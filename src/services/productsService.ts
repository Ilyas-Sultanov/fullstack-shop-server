import ProductModel from '../models/Product';
import {ICreateProductObj, IEditedProductObj, IProductsQuery, IDBProduct, IPreparedForUIProduct, IProductProperty, IPreparedForUIProperty} from '../types/product';
import { FilterQuery, QueryOptions, RootQuerySelector, PopulatedDoc } from 'mongoose';
import paginatedResults from "../helpers/paginatedResults";
import cleanObject from '../helpers/cleanObject';
import getBoolean from '../helpers/getBoolean';
import {access, constants} from 'fs';
import { mkdir, readdir, writeFile, unlink, rm } from 'fs/promises';
import path, {resolve} from 'path';
import { IDBProperty } from '../types/categoryProperty';

class ProductsService {
    // async create(newProduct: ICreateProductObj, productImages?: Express.Multer.File[]) {
    //     const doc = new ProductModel(newProduct);
    //     if (productImages) {
    //         const apiPath = process.env.API_URL;
    //         const imagesDirPath = resolve(`${__dirname}/../public/uploads/img/products/${doc._id}`);
    //         await mkdir(imagesDirPath);
    //         const urlPaths: Array<string> = [];
    //         const parallelWriting: Promise<void>[] = [];
    //         for (let i=0; i<productImages.length; i+=1) {
    //             parallelWriting.push(
    //                 writeFile(resolve(`${imagesDirPath}/${productImages[i].originalname}`), productImages[i].buffer)
    //             );
    //             urlPaths.push(`${apiPath}/uploads/img/products/${doc._id}/${productImages[i].originalname}`);
    //         }
    //         doc.images = urlPaths;
    //         await doc.save();
    //         await Promise.all(parallelWriting);
    //     }
    //     else {
    //         await doc.save();
    //     }
    // }

    public async create(newProduct: ICreateProductObj, productImages?: Express.Multer.File[]) {
        const doc = new ProductModel(newProduct);
        if (productImages) {
            const apiPath = process.env.API_URL;
            for (let i=0; i<productImages.length; i+=1) {
                doc.images.push(`${apiPath}/uploads/img/products/${doc._id}/${productImages[i].originalname}`);
            }
        }

        await doc.save();

        // если документ создан без ошибок, то сохраняем картинки на hdd
        if (productImages) {
            const imagesDirPath = resolve(`${__dirname}/../public/uploads/img/products/${doc._id}`);
            await mkdir(imagesDirPath);
            // await Promise.all(new Array(productImages.length).map((item, index) => {
            //     return writeFile(resolve(`${imagesDirPath}/${productImages[index].originalname}`), productImages[index].buffer);
            // }));
            const parallelWriting: Array<Promise<void>> = [];
            for (let i=0; i<productImages.length; i+=1) {
                parallelWriting.push(writeFile(resolve(`${imagesDirPath}/${productImages[i].originalname}`), productImages[i].buffer));
            }
            await Promise.all(parallelWriting);
        }
    }


    public async getMany(query: IProductsQuery, originalUrl: string) {
        // console.log(query);

        const equal: Array<RootQuerySelector<FilterQuery<IProductsQuery>>> = [];
        const range: Array<RootQuerySelector<FilterQuery<IProductsQuery>>> = [];
        
        for(let key in query) {
            if (query.hasOwnProperty(key) && query[key]) {
                if (
                    key !== '_id' &&
                    key !== 'name' &&
                    key !== 'brand' &&
                    key !== 'category' &&
                    key !== 'price' &&
                    key !== 'createdAt' &&
                    key !== 'quantity' &&
                    key !== 'page' &&
                    key !== 'limit'
                ) {
                    if (typeof query[key] === 'string' && (query[key] === 'true' || query[key] === 'false')) {
                        const value = getBoolean(query[key] as string);
                        equal.push({ $elemMatch : { categoryPropId: key, value: value } });
                    }
                    else if (typeof query[key] === 'string' && !isNaN(Number(query[key]))) {
                        const value = Number(query[key]);
                        equal.push({ $elemMatch : { categoryPropId: key, value: value } });
                    }
                    else if (Array.isArray(query[key])) {
                        const value = query[key] as Array<string | number>;
                        if (query[key] && (query[key] as Array<string>)[0] && typeof (query[key] as Array<String>)[0] === 'number') {
                            value.map((item) => Number(item));
                        }
                        equal.push({ $elemMatch : { categoryPropId: key, value: {$in: value} } });
                    }
                    else {
                        const value = query[key] as Record<string, string>;
                        const gteNum = !isNaN(Number(value.gte)) ? Number(value.gte) : null;
                        const lteNum = !isNaN(Number(value.lte)) ? Number(value.lte) : null;
                        if (gteNum || lteNum) {
                            range.push(
                                { $elemMatch : { 
                                    categoryPropId: key, 
                                    value: (gteNum && lteNum) ? {$gte: gteNum, $lte: lteNum} : 
                                        gteNum ? {$gte: gteNum} : 
                                        lteNum ? {$lte: lteNum} : 
                                        undefined,
                                    }  
                                }
                            );
                        }
                    }
                }
            }
        }            
                
        
        const preFilter: FilterQuery<IDBProduct> = {
            _id: query._id,
            name: query.name ? {$regex: new RegExp('^'+query.name+'.*', 'i')} : undefined,  // Поиск документов, у которых значение поля name начинается как query.name
            brand: query.brand,
            category: query.category,
            quantity: query.quantity ? {$lte: Number(query.quantity.lte)} : undefined,
            $and: (query.price && query.price) ? 
                [ 
                    {price: {$gte: query.price ? Number(query.price.gte) : undefined}}, 
                    {price: {$lte: query.price ? Number(query.price.lte) : undefined}}
                ] : 
                undefined,
            createdAt: (query.dateFrom && query.dateTo) ? // Для поиска документов созданных в определённом промежутке дат, оператор $and не нужен (именно по полю createdAt, не знаю как будет для кастомного поля с датой).  
                {$gte: query.dateFrom, $lte: query.dateTo} : 
                query.dateFrom ? {$gte: query.dateFrom} :
                query.dateTo ? {$lte: query.dateTo} :
                undefined,
            properties: [...equal, ...range].length > 0 ? {$all: [...equal, ...range]} : undefined,
            // properties: equal.length > 0 ? {$all: equal.length > 0 ? equal : undefined} : undefined,
            // properties: { $all: [
            //     { "$elemMatch" : { categoryPropId: "keyId", value: {$in: [5, 6, 7, 8]} } },
            //     { "$elemMatch" : { categoryPropId: "keyId", value: {$in: ['a', 'b', 'c', 'd']} } },
            //     { "$elemMatch" : { categoryPropId: "keyId", value: {$in: [true, false]} } },
            //     { "$elemMatch" : { categoryPropId: "keyId", value: (gte && lte) ? {$gte: gte, $lte: lte} : gte ? {$gte: gte} : lte ? {$lte: lte} : undefined }
            // ] }
        }

        // const preFilter: RootQuerySelector<IDBProduct> = {
        //     price: {$and: [ {price: {$gte: 3}} , {price: {$lte: 7}} ]}
        // }

        // console.log(preFilter);

        const preOptions: QueryOptions = { 
            limit: query.limit ? parseInt(query.limit) : 10,
            skip: query.page ? (parseInt(query.page) - 1) * (query.limit ? parseInt(query.limit) : 10) : undefined,
            sort: (query.sort && query.order) ? {[query.sort]: parseInt(query.order)} : null,
            // populate: {path: 'category', select: '_id name'},
            populate: {path: 'brand'},
            lean: true,
        }   

        const filter: FilterQuery<IDBProduct> = cleanObject(preFilter);
        const queryProjection = '_id name description images category brand price rating quantity properties createdAt';
        const options: QueryOptions = cleanObject(preOptions);

        const productsData = await paginatedResults(
            ProductModel, 
            filter, 
            originalUrl, 
            queryProjection, 
            options, 
            query.page ? parseInt(query.page) : null
        );              

        // console.log(productsData);
        

        return productsData;
    }


    public async getOne(_id: string) {
        const product = await ProductModel
            .findOne({_id: _id})
            .populate({ // Заполняем первое поле
                path: 'category', 
                populate: { path: 'properties brands' } // Populating across multiple levels (в заполненом поле category, заполняем поля properties brands)
            })
            .populate({  // Заполняем второе поле
                path: 'brand',
                select: 'name'
            })
        
        const preparedProduct = this.prepareRroduct(product);
        return preparedProduct;
    }

    // Не получилось заполнить два поля этим способом
    // async getOne(_id: string) {
    //     const product = await ProductModel.findOne(
    //         {_id: _id},
    //         '',
    //         {
    //             populate: {
    //                 path: 'category', // заполняем поле category
    //                 populate: { path: 'properties' } // заполняем поле properties у поля category (т.е. Populating across multiple levels)
    //             },
    //             lean: true,
    //         }
    //     );
    //     return product;
    // }


    public async edit(editedProduct: IEditedProductObj, productImages?: Express.Multer.File[]) {
        const imagesDirPath = resolve(`${__dirname}/../public/uploads/img/products/${editedProduct._id}`);

        if (productImages && productImages.length > 0) {
            const imagesFromFront = productImages.map((file) => file.originalname);
            const imagesFromBack = await readdir(imagesDirPath);
            const imagesToDelete = imagesFromBack.filter((img) => !imagesFromFront.includes(img));
            
            const apiPath = process.env.API_URL;
            const urlPaths: Array<string> = [];

            for (let i=0; i<imagesToDelete.length; i+=1) {
                const imgPath = resolve(`${imagesDirPath}/${imagesToDelete[i]}`);
                unlink(imgPath);
            }

            for (let i=0; i<productImages.length; i+=1) {
                writeFile(resolve(`${imagesDirPath}/${productImages[i].originalname}`), productImages[i].buffer);
                urlPaths.push(`${apiPath}/uploads/img/products/${editedProduct._id}/${productImages[i].originalname}`);
            }

            editedProduct.images = urlPaths;
        }
        else {
            const fileNames = await readdir(imagesDirPath);
            if (fileNames.length > 0) {
                for (let i=0; i<fileNames.length; i+=1) {
                    const imgPath = resolve(`${imagesDirPath}/${fileNames[i]}`);
                    access(imgPath, constants.F_OK, () => {
                        unlink(imgPath);
                    })
                }
            }
        }

        await ProductModel.replaceOne(
            {_id: editedProduct._id},
            editedProduct
        );  
    }

    
    public async delete(_id: string) {
        await ProductModel.deleteOne({_id: _id});
        const imagesDirPath = resolve(`${__dirname}/../public/uploads/img/products/${_id}`);
        await rm(imagesDirPath, {recursive: true});
    }


    public async getHighestPrice(categoryId?: string) {
        const filter = categoryId ? {category: categoryId} : {};
        const productWithHighestPrice = await ProductModel.findOne(
            filter,
            '',
            {
                sort: {'price': -1},
                limit: 1,
                lean: true,
            }
        );

        if (productWithHighestPrice) {
            return productWithHighestPrice.price;
        }
        return null;
    }


    private prepareRroduct(product: IDBProduct): IPreparedForUIProduct {
        const preparedProduct: IPreparedForUIProduct = {
            _id: product._id,
            name: product.name,
            category: product.category,
            brand: product.brand,
            description: product.description,
            images: product.images,
            price: product.price,
            quantity: product.quantity,
            warranty: product.warranty,
            properties: [],
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            validationMessages: {}
        };
        const category = product.category;
        const props: Array<IPreparedForUIProperty> = [];
        if (category.status === 'leaf' && category.properties && category.properties.length > 0) {
            for (let i=0; i<category.properties.length; i+=1) {                   
                props.push({
                    categoryPropId: category.properties[i]._id,
                    value: product.properties.find((prop) => prop.categoryPropId === String(category.properties[i]._id))!.value, // т.к. существует product.properties[i] значит метод find точно найдет категорию, т.к. product.properties[i] создаётся на основе категорий.
                    name: category.properties[i].name,
                    filterable: category.properties[i].filterable,
                    filterChoices: category.properties[i].filterChoices ? category.properties[i].filterChoices : undefined,
                    // type: category.properties[i].inputSettings.inputType,
                    // isMultiselect: category.properties[i].inputSettings.isMultiselect,
                    unit: category.properties[i].unit,
                    inputSettings: category.properties[i].inputSettings,
                    validationMessages: []
                });
            }
            preparedProduct.properties = props;
        }
        return preparedProduct;
    }
}

export default new ProductsService();