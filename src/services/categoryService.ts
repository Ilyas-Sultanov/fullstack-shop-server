import {constants, access} from 'fs';
import { writeFile, unlink } from 'fs/promises';
import {resolve} from 'path';
import mongoose, {HydratedDocument, Mongoose, Document} from 'mongoose';
import categoryPropertyService from './categoryPropertyService';
import { CategoryRootModel, CategoryBranchModel, CategoryLeafModel} from '../models/Category';
import CategoryPropertyModel from '../models/CategoryProperty';
import Trees from '../helpers/Trees';
import { ICreateCategoryObj, IDBCategory, ICategiryTree } from '../types/category';
import { ICreatePropertyObj, IDBProperty } from '../types/categoryProperty';
import ApiError from '../exceptions/ApiError';
import ProductModel from '../models/Product';

class CategoryService {
    /**
     * Картинка категории сохраняется в базе как путь до этой картинки
     * Поэтому при создании категории нужно чтобы путь уже был создан
     * Если категория создалась, нужно сохранить картинку по созданному пути, 
     * При этом в пути нужно учесть путь до сайта (process.env.API_URL)
     * http://127.0.0.1:5000/uploads/categories/imgName.jpeg
     */ 

    
    public async create(category: ICreateCategoryObj, properties: ICreatePropertyObj[], categoryImage?: Express.Multer.File) {
        if (category.parentId) {
            const parent = await CategoryRootModel.findOne({_id: category.parentId}).lean();
            if (!parent) {
                throw ApiError.badRequest('Parent category not found');
            }
            if (parent && parent.status === 'leaf') {
                throw ApiError.badRequest('The selected category cannot be a parent'); // категория со статусом leaf не может быть родителем
            }
        }

        const _id = new mongoose.Types.ObjectId(); 
        /**
         * _id нужен заранее т.к. он используется как имя для картинки
         * и является частью url, который сохраняется в базу
         * и для создания категории 
         */
        const imgPath = (() => {
            if (categoryImage) {
                const idx = categoryImage.mimetype.lastIndexOf('/') + 1;
                const ext = categoryImage.mimetype.slice(idx);
                return `uploads/img/categories/${_id.toString()}.${ext}`;
            }
            return '';
        })();
        const imgUrl = imgPath ? `${process.env.API_URL}/${imgPath}` : '';

        if (category.status === 'root') {
            await CategoryRootModel.create({...category, _id: _id, img: imgUrl}); // обрати внимание на модель, в этом разница
        }
        else if (category.status === 'branch') { 
            await CategoryBranchModel.create({...category, _id: _id, img: imgUrl}); // обрати внимание на модель, в этом разница
        }
        else { // if (category.status === 'leaf')
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                let propsIds: Array<string> = [];
                if (properties.length > 0) {
                    for (let i=0; i<properties.length; i+=1) {
                        properties[i].categoryId = _id.toString();
                    }
                    const props = await categoryPropertyService.create(properties, session);
                    // category.properties = props.map((item) => item._id.toString());
                    propsIds = props.map((item) => item._id.toString());
                    // await CategoryLeafModel.create([{...category, _id: _id, img: imgUrl}], {session}); // 1) обрати внимание на модель, в этом разница   2) Если в методе create используешь session, то первый аргумент метода должен быть массивом
                }
                if (propsIds.length > 0) {
                    category.properties = propsIds;
                }
                await CategoryLeafModel.create([{...category, _id: _id, img: imgUrl}], {session});
            });
            session.endSession();
        }

        // если при создании категории небыло ошибок, то сохраняем картинку
        if (categoryImage && imgPath && imgUrl) {
            writeFile(resolve(`${__dirname}/../public/${imgPath}`), categoryImage.buffer);
        }
    }


    public async getAll() {
        const categories = await CategoryRootModel.find({}, '', {lean: true});
        const cats = Trees.createTrees<IDBCategory>(categories);
        return cats;
    }


    public async getOne(categoryId: string) {
        const allCategories: IDBCategory[] = await CategoryRootModel.find({}, '', {populate: 'properties', lean: true});
        const trees = Trees.createTrees<IDBCategory>(allCategories);
        const category = Trees.findTree(categoryId, trees) as ICategiryTree | null;
        if (!category) {
            throw ApiError.badRequest('Category not found');
        }
        const parentId = allCategories.find((item) => {
            if (item._id.toString() === categoryId) return item;
        })?.parentId;
        
        if (parentId) {
            const parent = await CategoryRootModel.findOne({_id: parentId});
            category.parent = {_id: parent?._id, name: parent!.name};
        }
        return category;
    }


    public async edit(categoryId: string, category: IDBCategory, properties: IDBProperty[], categoryImage?: Express.Multer.File) {
        const targetCat = await this.getOne(categoryId) as null | ICategiryTree;    
        if (targetCat) {
            // если с фронта пришла картинка, то добавляем поле category.img с url для картинки
            const imgPath = (() => {
                if (categoryImage) {
                    const idx = categoryImage.mimetype.lastIndexOf('/') + 1;
                    const ext = categoryImage.mimetype.slice(idx);
                    return `uploads/img/categories/${targetCat._id.toString()}.${ext}`;
                }
                return '';
            })()
            const imgUrl = imgPath ? `${process.env.API_URL}/${imgPath}` : '';
            if (imgUrl) category.img = imgUrl;
            // -------------------------------------------------------------------------------

            // Редактируем документ (на самом деле документ просто заменяется новым)
            if (category.status === 'root') {
                await this.handleRoot(targetCat, category); // Редактируем root категорию или конвертируем в root категорию  
            }
            else if (category.status === 'branch') { 
                await this.handleBranch(targetCat, category); // Редактируем branch категорию или конвертируем в branch категорию
            } 
            else if (category.status === 'leaf') {
                await this.handleLeaf(targetCat, category, properties); // Редактируем leaf категорию или конвертируем в leaf категорию
            }
            // -------------------------------------------------------------------------------

            //если при редактировании документа не произошло ошибок, то работаем с картинкой
            if (categoryImage) { // с фронта пришла картинка, то сохраняем ей на hdd
                await writeFile(resolve(`${__dirname}/../public/${imgPath}`), categoryImage.buffer);
            }
            else { // если с фронта не пришла картинка
                if (targetCat.img) { // и если на hdd она есть, то удаляем её с hdd
                    const publicDirPath = resolve(`${__dirname}/../public`);
                    const idx = targetCat.img.indexOf('uploads');
                    const filePath = targetCat.img.slice(idx);
                    await unlink(resolve(`${publicDirPath}/${filePath}`));
                }
            }
            // -------------------------------------------------------------------------------
        }
        else {
            throw ApiError.badRequest('Category not found');
        }
    }


    public async delete(categoryId: string) {
        /**
         * Для удаления категории, строим дерево категорий как на фронте отображено,
         * В этом дереве находим категорию (её _id) которую нужно удалить,
         * В этой категории (она тоже дерево) находим все дочерние категории (их _id), их тоже нужно удалить,
         * У некоторых удаляемых категорий может быть свойство properties (массив из _id для пропсов), находим их _id, получив _id пропсов их тоже можно удалить,
         * Для сохранения целостности данных, нужно убедиться что все операции удаления прошли без ошибок,
         * Для этого существует Transaction, она следит за процессом и если возникает ошибка хоть в какой-то операции, откатывает изменения. 
         */
        const allCategories = await CategoryRootModel.find({}, '', {lean: true});
        const trees = Trees.createTrees(allCategories);
        const category = Trees.findTree(categoryId, trees) as ICategiryTree;
        if (category) {
            const categoryIdsToDelete: string[] = [];
            const publicDirPath = resolve(`${__dirname}/../public`);
            // console.log(resolve()); // D:\WEB\myProgects\shop\server

            getValues(category);
            function getValues(category: ICategiryTree) {
                categoryIdsToDelete.push(category._id.toString());
                if (category.img) { 
                    const idx = category.img.lastIndexOf('uploads');
                    const imgPath = category.img.slice(idx);
                    const fullPath = resolve(`${publicDirPath}/${imgPath}`);
                    access(`${fullPath}`, constants.F_OK, () => {  // constants.F_OK проверяет что файлы существуют, есть еще константы, например что файл читаем и др. см документацию
                        unlink(fullPath);
                    });
                } 
                if (category.children.length > 0) {
                    for (let i=0; i < category.children.length; i+=1) {
                        getValues(category.children[i]);
                    }
                }
            }          

            const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
            const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session}); // Удаление категории и всех её подкатегорий
                await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session}); // Удаление пропсов категории и всех пропсов её подкатегорий
                await ProductModel.deleteMany({category: {$in: categoryIdsToDelete}}, {session}); // Удаление всех продуктов категории или продуктов одной из подкатегории (в дереве удаляемой категории, продукты могут быть только у одной категории - leaf)
            });
            session.endSession();
        }
        else throw ApiError.badRequest('Category not found');
    }


    protected async writeImage(img: Express.Multer.File) {

    }


    protected async handleRoot(targetCat: ICategiryTree, category: IDBCategory) {
        if (targetCat.status === 'root') { // редактируем root категорию
            console.log('root -> root');
            await CategoryRootModel.replaceOne({_id: targetCat._id}, category);
        }
        else if (targetCat.status === 'branch') { // конвертируем branch категорию в root
            // console.log('branch -> root');
            await CategoryRootModel.replaceOne(
                {_id: targetCat._id}, 
                category, 
                {overwriteDiscriminatorKey: true} 
            ); 
        }
        else if (targetCat.status === 'leaf') { // конвертируем leaf категорию в root
            // console.log('leaf -> root');
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                if (targetCat.properties && targetCat.properties.length > 0) {
                    const ids = targetCat.properties.map((prop) => prop as string);
                    await CategoryPropertyModel.deleteMany( // Удаляем пропсы этой категории
                        {_id: {$in: ids}}, 
                        {session}
                    ); 
                }
                await CategoryRootModel.replaceOne(
                    {_id: targetCat._id}, 
                    category, 
                    {
                        overwriteDiscriminatorKey: true, 
                        session: session
                    }
                );
            });
            session.endSession();
        }
    }


    protected async handleBranch(targetCat: ICategiryTree, category: IDBCategory) {
        if (targetCat.status === 'root') { // конвертируем root категорию в branch
            // console.log('root -> branch');
            await CategoryRootModel.replaceOne(
                {_id: targetCat._id}, 
                {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Branch'}, // parentId нужно преобразовать из string в ObjectId
                {overwriteDiscriminatorKey: true} 
                /**
                 * опция {overwriteDiscriminatorKey: true} позволет изменять поле __t (т.е. менять инстанс модели для дескриминатора). 
                 * ОБРАТИ ВНИМАНИЕ, если меняем инстанс, то методы вызываем у CategoryRootModel (т.е. у основной модели, которую наследуют другие)
                */
            ); 
        }
        else if (targetCat.status === 'branch') { // редактируем branch категорию 
            // console.log('branch -> branch');
            await CategoryBranchModel.replaceOne(
                {_id: targetCat._id}, 
                {...category, parentId: new mongoose.Types.ObjectId(category.parentId)}
            );
        }
        else if (targetCat.status === 'leaf') { // конвертируем leaf категорию в branch
            // console.log('leaf -> branch');
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                if (targetCat.properties && targetCat.properties.length > 0) {
                    const ids = targetCat.properties.map((prop) => prop as string);
                    await CategoryPropertyModel.deleteMany( // Удаляем пропсы этой категории
                        {_id: {$in: ids}}, 
                        {session}
                    ); 
                }
                await CategoryRootModel.replaceOne(
                    {_id: targetCat._id}, 
                    {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Branch'}, 
                    {overwriteDiscriminatorKey: true, session: session});
            });
            session.endSession();
        }
    }


    protected async handleLeaf(targetCat: ICategiryTree, category: IDBCategory, properties: IDBProperty[]) {
        if (targetCat.status === 'root') { // конвертируем root категорию в leaf
            // console.log('root -> leaf');
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                if (targetCat.children && targetCat.children.length > 0) { // удаляем все подкатегории 
                    const categoryIdsToDelete = Trees.getFieldValues(targetCat, '_id'); 
                    categoryIdsToDelete.splice(0, 1); // первый элемент массива - это _id редактируемой категории, значит нужно брать со второго элемента
                    const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
                    const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
                    await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session});
                    await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session});
                }
                if (properties && properties.length > 0) {
                    const props = await categoryPropertyService.create(properties, session); // Создаём пропсы
                    category.properties = props.map((item) => item._id.toString()); // Помещаем _id пропсов в категорию
                }
                await CategoryRootModel.replaceOne(
                    {_id: targetCat._id}, 
                    {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Leaf'}, 
                    {overwriteDiscriminatorKey: true, session: session}
                );
            });
            session.endSession();
        }
        else if (targetCat.status === 'branch') { // конвертируем branch категорию в leaf
            // console.log('branch -> leaf');
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                if (targetCat.children && targetCat.children.length > 0) { // удаляем все подкатегории 
                    const categoryIdsToDelete = Trees.getFieldValues(targetCat, '_id'); 
                    categoryIdsToDelete.splice(0, 1);
                    const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
                    const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
                    await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session});
                    await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session});
                }
                if (properties && properties.length > 0) {
                    const props = await categoryPropertyService.create(properties, session); // Создаём пропсы
                    category.properties = props.map((item) => item._id.toString()); // Помещаем _id пропсов в категорию
                }
                await CategoryRootModel.replaceOne(
                    {_id: targetCat._id}, 
                    {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Leaf'}, 
                    {overwriteDiscriminatorKey: true, session: session}
                );
            });
            session.endSession();
        }
        else if (targetCat.status === 'leaf') { // редактируем leaf категорию
            // console.log('leaf -> leaf');
            
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                const toReplace = [];
                const toCreate = [];
                // const existIds: string[] = [];

                const propIdsBeforeEdit = await CategoryPropertyModel.find(
                    {categoryId: targetCat._id},
                    '_id',
                    {lean: true, session: session}
                );                

                const preExistPropIds: string[] = propIdsBeforeEdit.map((prop) => prop._id.toString());
                const preInputPropIds: string[] = [];
                for (let i=0; i < properties.length; i+=1) {
                    if (properties[i]._id) {
                        preInputPropIds.push(properties[i]._id.toString());
                    }
                }
        

                /**
                 * Если с фронта пришло меньше пропсов чем есть у категории в базе, значит пользователь их удалил, и нам нужно удалить их из базы
                 * Для этого сравниваем два массива: 
                 *      preExistPropIds - массив _id пропсов находящихся в базе
                 *      preInputPropIds - массив _id пропсов пришедших с фронта
                 * Находим идентификаторы (_id) которые есть в preExistPropIds, но нет в preInputPropIds и помещаем их в propIdsToDelete.
                 */
                let propIdsToDelete = preExistPropIds.filter(x => !preInputPropIds.includes(x));
                // ----------------------------------------------------------------------------------
                

                /**
                 * Если пришедший с фронта проп имеет _id, то значит редактируют существующий в базе проп
                 * и нам просто нужно его заменить на новый (пришедший), при этом сохранив оригинальный _id.
                 * Если пришедший с фронта проп не имеет _id, то значит создаётся новый проп.
                 */
                for (let i=0; i < properties.length; i+=1) {
                    const prop = properties[i];
                    if (prop._id) {
                        // console.log('replace');
                        toReplace.push({
                            replaceOne: {
                                filter: {_id: prop._id},
                                replacement: prop
                            }
                        });
                    }
                    else {
                        // console.log('insert');
                        toCreate.push({
                            insertOne: {
                                document: prop
                            }
                        });
                    }
                }                    

                const res = await CategoryPropertyModel.bulkWrite(
                    [
                        {
                            deleteMany: {
                                filter: {_id: {$in: propIdsToDelete}}
                            }
                        },
                        ...toReplace,
                        ...toCreate,
                    ],
                    {session: session}
                ); 

                if (res.result.ok !== 1) throw ApiError.internal('Category editing error');
                
                /**
                 * Получаем _id всех пропсов которые относятся к этой категории (с учетом всех удалений или созданий)
                 * и помещаем их в свойство properties категории
                 */
                const categoryPropsAfterEdit = await CategoryPropertyModel.find(
                    {categoryId: targetCat._id},
                    '_id, input',
                    {lean: true, session: session}
                );                
                const categoryPropIds: string[] = categoryPropsAfterEdit.map((prop) => prop._id.toString());
               
               
                await CategoryLeafModel.replaceOne(
                    {_id: targetCat._id},
                    {...category, properties: categoryPropIds, parentId: targetCat.parent?._id},
                    {session: session}
                );



                /**
                 * В массиве categoryPropIds находятся все актуальные _id 
                 * При удалении пропса(ов) в категории, нужно удалить соответствующие пропсы у продуктов этой категории
                 */
                const products = await ProductModel.find(
                    {category: targetCat._id},
                    '',
                    {
                        lean: true,
                        session: session,
                    }
                );

                if (products.length > 0) {
                    const toReplaceProducts = [];
                
                    const productPropIds = products[0].properties.map((prop) => { // На этом месте, продукты все еще имеют старые _id пропсов 
                        return prop.categoryPropId.toString();
                    });
                    
                    // Сравниваем актуальные _id пропсов в категории и старые _id пропсов из продуктов 
                    const idsToAdd = categoryPropIds.filter((_id) => !productPropIds.includes(_id)); // _id пропсов что есть в категории, но нет в её продуктах
                    const idsToDel = productPropIds.filter((_id) => !categoryPropIds.includes(_id)); // _id пропсов что есть в продуктах, но нет в их категории
                    // console.log('idsToAdd:', idsToAdd);
                    // console.log('idsToDel:', idsToDel);

                    for (let i=0; i<products.length; i+=1) {
                        for (let j=0; j<products[i].properties.length; j+=1) {
                            for (let k=0; k<idsToDel.length; k+=1) {
                                if (products[i].properties[j].categoryPropId === idsToDel[k]) { // удаляем из продукта те пропсы, _id которых нет в категории
                                    products[i].properties.splice(j, 1);
                                }
                            }
                        }
                        
                        // ---------------------

                        const newProps = categoryPropsAfterEdit.filter((prop) => idsToAdd.includes(prop._id.toString()));
                        for (let n=0; n<newProps.length; n+=1) { 
                            products[i].properties.push({ // добавляем новые пропсы из категории в продукты
                                categoryPropId: newProps[n]._id,
                                value: newProps[n].input.inputType === 'String' ? 'null' :
                                    newProps[n].input.inputType === 'Number' ? 0 : false // false когда newProps[n].input.inputType === 'Boolean'
                            });
                        }

                        // ---------------------

                        toReplaceProducts.push({
                            replaceOne: {
                                filter: {_id: products[i]._id},
                                replacement: products[i]
                            }
                        });
                    }               

                    // console.log('toReplaceProducts:', toReplaceProducts);
                    
                    const prodReplaceResult = await ProductModel.bulkWrite(
                        [
                            ...toReplaceProducts,
                        ],
                        {session: session}
                    ); 
                    if (prodReplaceResult.result.ok !== 1) throw ApiError.internal('Category editing error');
                }
                
            });
            session.endSession();
        }
    }

    protected getPropIdsToDelete(categoriesToDelete: IDBCategory[]) {
        let propertyIdsToDelete: string[] = [];
        for (let i=0; i < categoriesToDelete.length; i+=1) {
            if (categoriesToDelete[i].properties && categoriesToDelete[i].properties!.length > 0) {
                const ids: string[] = [];
                for (let j=0; j < categoriesToDelete[i].properties!.length; j+=1) {
                    ids.push(categoriesToDelete[i].properties![j].toString());
                }
                propertyIdsToDelete.push(...ids);
            }
        }
        return propertyIdsToDelete;
    }
}

export default new CategoryService();















// import {constants, access} from 'fs';
// import { writeFile, unlink } from 'fs/promises';
// import {resolve} from 'path';
// import mongoose, {HydratedDocument, Mongoose, Document} from 'mongoose';
// import categoryPropertyService from './categoryPropertyService';
// import { CategoryRootModel, CategoryBranchModel, CategoryLeafModel} from '../models/Category';
// import CategoryPropertyModel from '../models/CategoryProperty';
// import Trees, {ITree} from '../helpers/Trees';
// import { ICreateCategoryObj, IDBCategory, ICategiryTree } from '../types/category';
// import { ICreatePropertyObj, IDBProperty } from '../types/categoryProperty';
// import { IDBProduct } from '../types/product';
// import {ProductPropValue} from '../types/productProperty'
// import ApiError from '../exceptions/ApiError';
// import ProductModel from '../models/Product';

// class CategoryService {
//     /**
//      * Картинка категории сохраняется в базе как путь до этой картинки
//      * Поэтому при создании категории нужно чтобы путь уже был создан
//      * Если категория создалась, нужно сохранить картинку по созданному пути, 
//      * При этом в пути нужно учесть путь до сайта (process.env.API_URL)
//      * http://127.0.0.1:5000/uploads/categories/imgName.jpeg
//      */ 
//     // public async create(category: ICreateCategoryObj, properties: ICreatePropertyObj[], categoryImage?: Express.Multer.File) {
//     //     if (category.parentId) {
//     //         const parent = await CategoryRootModel.findOne({_id: category.parentId}).lean();
//     //         if (!parent) {
//     //             throw ApiError.badRequest('Parent category not found');
//     //         }
//     //         if (parent && parent.status === 'leaf') {
//     //             throw ApiError.badRequest('The selected category cannot be a parent'); // категория со статусом leaf не может быть родителем
//     //         }
//     //     }

//     //     if (category.status === 'root') {
//     //         await CategoryRootModel.create(category); // обрати внимание на модель, в этом разница
//     //     }
//     //     else if (category.status === 'branch') { 
//     //         await CategoryBranchModel.create(category); // обрати внимание на модель, в этом разница
//     //     }
//     //     else { // if (category.status === 'leaf')
//     //         let newCat: Document;
//     //         const session = await mongoose.startSession();
//     //         await session.withTransaction(async () => {
//     //             if (properties.length > 0) {
//     //                 const props = await categoryPropertyService.create(properties, session);
//     //                 category.properties = props.map((item) => item._id.toString());
//     //             }
//     //             await CategoryLeafModel.create([{...category}], {session}); // 1) обрати внимание на модель, в этом разница   2) Если в методе create используешь session, то первый аргумент метода должен быть массивом  
//     //         });
//     //         session.endSession();
//     //     }

//     //     if (categoryImage) {
//     //         await writeFile(`./src/public/uploads/categories/imgName.jpeg`, categoryImage.buffer);
//     //     }
//     // }


//     public async create(category: ICreateCategoryObj, properties: ICreatePropertyObj[], categoryImage?: Express.Multer.File) {
//         if (category.parentId) {
//             const parent = await CategoryRootModel.findOne({_id: category.parentId}).lean();
//             if (!parent) {
//                 throw ApiError.badRequest('Parent category not found');
//             }
//             if (parent && parent.status === 'leaf') {
//                 throw ApiError.badRequest('The selected category cannot be a parent'); // категория со статусом leaf не может быть родителем
//             }
//         }

//         let doc; // из-за CategoryRootModel.discriminator тип IDBCategory не подходит

//         if (category.status === 'root') {
//             doc = new CategoryRootModel(category); // обрати внимание на модель, в этом разница
//         }
//         else if (category.status === 'branch') { 
//             doc = new CategoryBranchModel(category); // обрати внимание на модель, в этом разница
//         }
//         else { // if (category.status === 'leaf')
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 if (properties.length > 0) {
//                     const props = await categoryPropertyService.create(properties, session);
//                     category.properties = props.map((item) => item._id.toString());
//                 }
//                 doc = new CategoryLeafModel([{...category}], {session}); // 1) обрати внимание на модель, в этом разница   2) Если в методе create используешь session, то первый аргумент метода должен быть массивом  
//             });
//             session.endSession();
//         }

//         if (categoryImage) {
//             const imgPath = `uploads/img/categories/${doc?._id}--originalName:${categoryImage.originalname}`;
//             (doc as IDBCategory).img = `${process.env.API_URL}/${imgPath}`;
//             await doc?.save();
//             await writeFile(resolve(`${__dirname}/../public/${imgPath}`), categoryImage.buffer);
//         }
//         else {
//             await doc?.save();
//         }
//     }


//     public async getAll() {
//         const categories = await CategoryRootModel.find({}, '', {lean: true});
//         const cats = Trees.createTrees<IDBCategory>(categories);
//         return cats;
//     }


//     public async getOne(categoryId: string) {
//         const allCategories: IDBCategory[] = await CategoryRootModel.find({}, '', {populate: 'properties', lean: true});
//         const trees = Trees.createTrees<IDBCategory>(allCategories);
//         const category = Trees.findTree(categoryId, trees) as ICategiryTree | null;
//         if (!category) {
//             throw ApiError.badRequest('Category not found');
//         }
//         const parentId = allCategories.find((item) => {
//             if (item._id.toString() === categoryId) return item;
//         })?.parentId;
        
//         if (parentId) {
//             const parent = await CategoryRootModel.findOne({_id: parentId});
//             category.parent = {_id: parent?._id, name: parent!.name};
//         }
//         return category;
//     }

    
//     public async edit(categoryId: string, category: IDBCategory, properties: IDBProperty[], categoryImage?: Express.Multer.File) {
//         const targetCat = await this.getOne(categoryId) as null | ICategiryTree;    
//         if (targetCat) {
//             if (category.status === 'root') {
//                 return this.handleRoot(targetCat, category, categoryImage); // изменяем root категорию или конвертируем в root категорию         [Для try catch обязательно нужно чтобы возвращался promis]
//             }
//             else if (category.status === 'branch') { 
//                 return this.handleBranch(targetCat, category, categoryImage) // изменяем branch категорию или конвертируем в branch категорию
//             } 
//             else if (category.status === 'leaf') {
//                 return this.handleLeaf(targetCat, category, properties, categoryImage); // изменяем leaf категорию или конвертируем в leaf категорию
//             }
//         }
//         else {
//             throw ApiError.badRequest('Category not found');
//         }
//     }


//     public async delete(categoryId: string) {
//         /**
//          * Для удаления категории, строим дерево категорий как на фронте отображено,
//          * В этом дереве находим категорию (её _id) которую нужно удалить,
//          * В этой категории (она тоже дерево) находим все дочерние категории (их _id), их тоже нужно удалить,
//          * У некоторых удаляемых категорий может быть свойство properties (массив из _id для пропсов), находим их _id, получив _id пропсов их тоже можно удалить,
//          * Для сохранения целостности данных, нужно убедиться что все операции удаления прошли без ошибок,
//          * Для этого существует Transaction, она следит за процессом и если возникает ошибка хоть в какой-то операции, откатывает изменения. 
//          */
//         const allCategories = await CategoryRootModel.find({}, '', {lean: true});
//         const trees = Trees.createTrees(allCategories);
//         const category = Trees.findTree(categoryId, trees) as ICategiryTree;
//         if (category) {
//             const categoryIdsToDelete: string[] = [];
//             const parallelDeleting: Promise<void>[] = [];  // Массив промисов, для удаления картинок
//             const publicDirPath = resolve(`${__dirname}/../public`);
//             // console.log(resolve()); // D:\WEB\myProgects\shop\server

//             getValues(category);
//             function getValues(category: ICategiryTree) {
//                 categoryIdsToDelete.push(category._id.toString());
//                 if (category.img) {
//                     // 'http://127.0.0.1:5000/uploads/img/categories/628240b16ee22e8f2081a46c--3GADNJXx_EU.jpg',  
//                     const idx = category.img.lastIndexOf('uploads');
//                     const imgPath = category.img.slice(idx);
//                     const fullPath = resolve(`${publicDirPath}/${imgPath}`);
//                     access(`${fullPath}`, constants.F_OK, () => {  // constants.F_OK проверяет что файлы существуют, есть еще константы, например что файл читаеи и др. см документацию
//                         parallelDeleting.push( unlink(fullPath) );
//                     });
//                 } 
//                 if (category.children.length > 0) {
//                     for (let i=0; i < category.children.length; i+=1) {
//                         getValues(category.children[i]);
//                     }
//                 }
//             }          

//             const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
//             const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session}); // Удаление категории и всех её подкатегорий
//                 await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session}); // Удаление пропсов категории и всех пропсов её подкатегорий
//                 await ProductModel.deleteMany({category: {$in: categoryIdsToDelete}}, {session}); // Удаление всех продуктов категории или продуктов одной из подкатегории (в дереве удаляемой категории, продукты могут быть только у одной категории - leaf)
//             });
//             session.endSession();           
                 
//             if (parallelDeleting.length > 0) {
//                 await Promise.all(parallelDeleting);
//             }
//         }
//         else throw ApiError.badRequest('Category not found');
//     }


//     protected async handleRoot(targetCat: ICategiryTree, category: IDBCategory, categoryImage?: Express.Multer.File) {
//         if (targetCat.status === 'root') { // редактируем root категорию
//             // console.log('root -> root');
//             await CategoryRootModel.replaceOne({_id: targetCat._id}, category);
//         }
//         else if (targetCat.status === 'branch') { // конвертируем branch категорию в root
//             // console.log('branch -> root');
//             await CategoryRootModel.replaceOne(
//                 {_id: targetCat._id}, 
//                 category, 
//                 {overwriteDiscriminatorKey: true} 
//             ); 
//         }
//         else if (targetCat.status === 'leaf') { // конвертируем leaf категорию в root
//             // console.log('leaf -> root');
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 if (targetCat.properties && targetCat.properties.length > 0) {
//                     const ids = targetCat.properties.map((prop) => prop as string);
//                     await CategoryPropertyModel.deleteMany( // Удаляем пропсы этой категории
//                         {_id: {$in: ids}}, 
//                         {session}
//                     ); 
//                 }
//                 await CategoryRootModel.replaceOne(
//                     {_id: targetCat._id}, 
//                     category, 
//                     {
//                         overwriteDiscriminatorKey: true, 
//                         session: session
//                     }
//                 );
//             });
//             session.endSession();
//         }
//     }


//     protected async handleBranch(targetCat: ICategiryTree, category: IDBCategory, categoryImage?: Express.Multer.File) {
//         if (targetCat.status === 'root') { // конвертируем root категорию в branch
//             // console.log('root -> branch');
//             await CategoryRootModel.replaceOne(
//                 {_id: targetCat._id}, 
//                 {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Branch'}, // parentId нужно преобразовать из string в ObjectId
//                 {overwriteDiscriminatorKey: true} 
//                 /**
//                  * опция {overwriteDiscriminatorKey: true} позволет изменять поле __t (т.е. менять инстанс модели для дескриминатора). 
//                  * ОБРАТИ ВНИМАНИЕ, если меняем инстанс, то методы вызываем у CategoryRootModel (т.е. у основной модели, которую наследуют другие)
//                 */
//             ); 
//         }
//         else if (targetCat.status === 'branch') { // редактируем branch категорию 
//             // console.log('branch -> branch');
//             await CategoryBranchModel.replaceOne(
//                 {_id: targetCat._id}, 
//                 {...category, parentId: new mongoose.Types.ObjectId(category.parentId)}
//             );
//         }
//         else if (targetCat.status === 'leaf') { // конвертируем leaf категорию в branch
//             // console.log('leaf -> branch');
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 if (targetCat.properties && targetCat.properties.length > 0) {
//                     const ids = targetCat.properties.map((prop) => prop as string);
//                     await CategoryPropertyModel.deleteMany( // Удаляем пропсы этой категории
//                         {_id: {$in: ids}}, 
//                         {session}
//                     ); 
//                 }
//                 await CategoryRootModel.replaceOne(
//                     {_id: targetCat._id}, 
//                     {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Branch'}, 
//                     {overwriteDiscriminatorKey: true, session: session});
//             });
//             session.endSession();
//         }
//     }


//     protected async handleLeaf(targetCat: ICategiryTree, category: IDBCategory, properties: IDBProperty[], categoryImage?: Express.Multer.File) {
//         if (targetCat.status === 'root') { // конвертируем root категорию в leaf
//             // console.log('root -> leaf');
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 if (targetCat.children && targetCat.children.length > 0) { // удаляем все подкатегории 
//                     const categoryIdsToDelete = Trees.getFieldValues(targetCat, '_id'); 
//                     categoryIdsToDelete.splice(0, 1); // первый элемент массива - это _id редактируемой категории, значит нужно брать со второго элемента
//                     const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
//                     const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
//                     await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session});
//                     await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session});
//                 }
//                 if (properties && properties.length > 0) {
//                     const props = await categoryPropertyService.create(properties, session); // Создаём пропсы
//                     category.properties = props.map((item) => item._id.toString()); // Помещаем _id пропсов в категорию
//                 }
//                 await CategoryRootModel.replaceOne(
//                     {_id: targetCat._id}, 
//                     {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Leaf'}, 
//                     {overwriteDiscriminatorKey: true, session: session}
//                 );
//             });
//             session.endSession();
//         }
//         else if (targetCat.status === 'branch') { // конвертируем branch категорию в leaf
//             // console.log('branch -> leaf');
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 if (targetCat.children && targetCat.children.length > 0) { // удаляем все подкатегории 
//                     const categoryIdsToDelete = Trees.getFieldValues(targetCat, '_id'); 
//                     categoryIdsToDelete.splice(0, 1);
//                     const categoriesToDelete = await CategoryRootModel.find({_id: {$in: categoryIdsToDelete}}, '', {lean: true});
//                     const propertyIdsToDelete = this.getPropIdsToDelete(categoriesToDelete);
//                     await CategoryRootModel.deleteMany({_id: {$in: categoryIdsToDelete}}, {session});
//                     await CategoryPropertyModel.deleteMany({_id: {$in: propertyIdsToDelete}}, {session});
//                 }
//                 if (properties && properties.length > 0) {
//                     const props = await categoryPropertyService.create(properties, session); // Создаём пропсы
//                     category.properties = props.map((item) => item._id.toString()); // Помещаем _id пропсов в категорию
//                 }
//                 await CategoryRootModel.replaceOne(
//                     {_id: targetCat._id}, 
//                     {...category, parentId: new mongoose.Types.ObjectId(category.parentId), __t: 'Leaf'}, 
//                     {overwriteDiscriminatorKey: true, session: session}
//                 );
//             });
//             session.endSession();
//         }
//         else if (targetCat.status === 'leaf') { // редактируем leaf категорию
//             console.log('leaf -> leaf');
//             const session = await mongoose.startSession();
//             await session.withTransaction(async () => {
//                 const toReplace = [];
//                 const toCreate = [];
//                 // const existIds: string[] = [];

//                 const propIdsBeforeEdit = await CategoryPropertyModel.find(
//                     {categoryId: targetCat._id},
//                     '_id',
//                     {lean: true, session: session}
//                 );                

//                 const preExistPropIds: string[] = propIdsBeforeEdit.map((prop) => prop._id.toString());
//                 const preInputPropIds: string[] = [];
//                 for (let i=0; i < properties.length; i+=1) {
//                     if (properties[i]._id) {
//                         preInputPropIds.push(properties[i]._id.toString());
//                     }
//                 }
        

//                 /**
//                  * Если с фронта пришло меньше пропсов чем есть у категории в базе, значит пользователь их удалил, и нам нужно удалить их из базы
//                  * Для этого сравниваем два массива: 
//                  *      preExistPropIds - массив _id пропсов находящихся в базе
//                  *      preInputPropIds - массив _id пропсов пришедших с фронта
//                  * Находим идентификаторы (_id) которые есть в preExistPropIds, но нет в preInputPropIds и помещаем их в propIdsToDelete.
//                  */
//                 let propIdsToDelete = preExistPropIds.filter(x => !preInputPropIds.includes(x));
//                 // ----------------------------------------------------------------------------------
                

//                 /**
//                  * Если пришедший с фронта проп имеет _id, то значит редактируют существующий в базе проп
//                  * и нам просто нужно его заменить на новый (пришедший), при этом сохранив оригинальный _id.
//                  * Если пришедший с фронта проп не имеет _id, то значит создаётся новый проп.
//                  */
//                 for (let i=0; i < properties.length; i+=1) {
//                     const prop = properties[i];
//                     if (prop._id) {
//                         // console.log('replace');
//                         toReplace.push({
//                             replaceOne: {
//                                 filter: {_id: prop._id},
//                                 replacement: prop
//                             }
//                         });
//                     }
//                     else {
//                         // console.log('insert');
//                         toCreate.push({
//                             insertOne: {
//                                 document: prop
//                             }
//                         });
//                     }
//                 }                    

//                 const res = await CategoryPropertyModel.bulkWrite(
//                     [
//                         {
//                             deleteMany: {
//                                 filter: {_id: {$in: propIdsToDelete}}
//                             }
//                         },
//                         ...toReplace,
//                         ...toCreate,
//                     ],
//                     {session: session}
//                 ); 

//                 if (res.result.ok !== 1) throw ApiError.internal('Category editing error');
                
//                 /**
//                  * Получаем _id всех пропсов которые относятся к этой категории (с учетом всех удалений или созданий)
//                  * и помещаем их в свойство properties категории
//                  */
//                 const categoryPropsAfterEdit = await CategoryPropertyModel.find(
//                     {categoryId: targetCat._id},
//                     '_id, input',
//                     {lean: true, session: session}
//                 );                
//                 const categoryPropIds: string[] = categoryPropsAfterEdit.map((prop) => prop._id.toString());
               
//                 await CategoryLeafModel.replaceOne(
//                     {_id: targetCat._id},
//                     {...category, properties: categoryPropIds, parentId: new mongoose.Types.ObjectId(category.parentId)},
//                     {session: session}
//                 );





//                 /**
//                  * В массиве categoryPropIds находятся все актуальные _id 
//                  * При удалении пропса(ов) в категории, нужно удалить соответствующие пропсы у продуктов этой категории
//                  */
//                 const products = await ProductModel.find(
//                     {category: targetCat._id},
//                     '',
//                     {
//                         lean: true,
//                         session: session,
//                     }
//                 );
                
//                 const toReplaceProducts = [];
//                 const productPropIds = products[0].properties.map((prop) => { // На этом месте, продукты все еще имеют старые _id пропсов 
//                     return prop.categoryPropId.toString();
//                 });
                
//                 // Сравниваем актуальные _id пропсов в категории и старые _id пропсов из продуктов 
//                 const idsToAdd = categoryPropIds.filter((_id) => !productPropIds.includes(_id)); // _id пропсов что есть в категории, но нет в её продуктах
//                 const idsToDel = productPropIds.filter((_id) => !categoryPropIds.includes(_id)); // _id пропсов что есть в продуктах, но нет в их категории
//                 // console.log('idsToAdd:', idsToAdd);
//                 // console.log('idsToDel:', idsToDel);

//                 for (let i=0; i<products.length; i+=1) {
//                     for (let j=0; j<products[i].properties.length; j+=1) {
//                         for (let k=0; k<idsToDel.length; k+=1) {
//                             if (products[i].properties[j].categoryPropId === idsToDel[k]) { // удаляем из продукта те пропсы, _id которых нет в категории
//                                 products[i].properties.splice(j, 1);
//                             }
//                         }
//                     }
                    
//                     // ---------------------

//                     const newProps = categoryPropsAfterEdit.filter((prop) => idsToAdd.includes(prop._id.toString()));
//                     for (let n=0; n<newProps.length; n+=1) { 
//                         products[i].properties.push({ // добавляем новые пропсы из категории в продукты
//                             categoryPropId: newProps[n]._id,
//                             value: newProps[n].input.inputType === 'String' ? 'null' :
//                                 newProps[n].input.inputType === 'Number' ? 0 : false // fulse когда newProps[n].input.inputType === 'Boolean'
//                         });
//                     }

//                     // ---------------------

//                     toReplaceProducts.push({
//                         replaceOne: {
//                             filter: {_id: products[i]._id},
//                             replacement: products[i]
//                         }
//                     });
//                 }               

//                 // console.log('toReplaceProducts:', toReplaceProducts);
                

//                 const prodReplaceResult = await ProductModel.bulkWrite(
//                     [
//                         ...toReplaceProducts,
//                     ],
//                     {session: session}
//                 ); 
//                 if (prodReplaceResult.result.ok !== 1) throw ApiError.internal('Category editing error');
//                 // ----------------------------------------------------------------------------------
//             });
//             session.endSession();
//         }
        
//         // Этот способ не подходит так-как меняются _id пропсов
//         // else if (targetCat.status === 'leaf') { // редактируем leaf категорию
//         //     // console.log('leaf -> leaf');
//         //     const session = await mongoose.startSession();
//         //     await session.withTransaction(async () => {
//         //         if (targetCat.properties && targetCat.properties.length > 0) {
//         //             const ids = targetCat.properties.map((prop) => prop._id);
//         //             await CategoryPropertyModel.deleteMany( // Удаляем старые пропсы этой категории
//         //                 {_id: {$in: ids}}, 
//         //                 {session: session}
//         //             ); 
//         //         }
//         //         if (properties && properties.length > 0) {
//         //             const props = await categoryPropertyService.create(properties, session); // Создаём новые пропсы
//         //             category.properties = props.map((item) => item._id.toString()); // Помещаем _id новых пропсов в категорию
//         //         }
//         //         await CategoryLeafModel.replaceOne(
//         //             {_id: targetCat._id}, 
//         //             {...category, parentId: new mongoose.Types.ObjectId(category.parentId)}, 
//         //             {session: session}
//         //         );
//         //     });
//         //     session.endSession();
//         // }
//     }

//     protected getPropIdsToDelete(categoriesToDelete: IDBCategory[]) {
//         let propertyIdsToDelete: string[] = [];
//         for (let i=0; i < categoriesToDelete.length; i+=1) {
//             if (categoriesToDelete[i].properties && categoriesToDelete[i].properties!.length > 0) {
//                 const ids: string[] = [];
//                 for (let j=0; j < categoriesToDelete[i].properties!.length; j+=1) {
//                     ids.push(categoriesToDelete[i].properties![j].toString());
//                 }
//                 propertyIdsToDelete.push(...ids);
//             }
//         }
//         return propertyIdsToDelete;
//     }
// }

// export default new CategoryService();