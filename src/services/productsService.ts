import ProductModel from '../models/Product';
import {ICreateProductObj, IEditedProductObj, IProductsQuery, IDBProduct} from '../types/product';
import { FilterQuery, QueryOptions } from 'mongoose';
import paginatedResults from "../helpers/paginatedResults";
import cleanObject from '../helpers/cleanObject';
import {access, constants} from 'fs';
import { mkdir, readdir, writeFile, unlink, rm } from 'fs/promises';
import path, {resolve} from 'path';

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

    async create(newProduct: ICreateProductObj, productImages?: Express.Multer.File[]) {
        const doc = new ProductModel(newProduct);
        if (productImages) {
            const apiPath = process.env.API_URL;
            for (let i=0; i<productImages.length; i+=1) {
                doc.images.push(`${apiPath}/uploads/img/products/${doc._id}/${productImages[i].originalname}`);
            }
            await doc.save();
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


    async getMany(query: IProductsQuery, originalUrl: string) {
        console.log(query);
        
        const preFilter: FilterQuery<IDBProduct> = {
            _id: query._id,
            name: query.name ? {$regex: new RegExp('^'+query.name+'.*', 'i')} : undefined,  // Поиск документов, у которых значение поля name начинается как query.name
            brand: query.brand,
            category: query.category,
            price: (query.minPrice && query.maxPrice) ? {$gte: query.minPrice, $lte: query.maxPrice} :
                query.minPrice ? {$gte: query.minPrice} :
                query.maxPrice ? {$lte: query.maxPrice} :
                undefined,
            createdAt: (query.dateFrom && query.dateTo) ? {$gte: query.dateFrom, $lte: query.dateTo} : 
                query.dateFrom ? {$gte: query.dateFrom} :
                query.dateTo ? {$lte: query.dateTo} :
                undefined,
            quantity: query.quantityLTE ? {$lte: query.quantityLTE} : undefined,
        }

        const preOptions: QueryOptions = { 
            limit: query.limit ? parseInt(query.limit) : 10,
            skip: query.page ? (parseInt(query.page) - 1) * (query.limit ? parseInt(query.limit) : 10) : undefined,
            sort: (query.sort && query.order) ? {[query.sort]: parseInt(query.order)} : null,
            // populate: {path: 'category', select: '_id name'},
            populate: {path: 'category brand'},
            lean: true,
        }   

        const filter: FilterQuery<IDBProduct> = cleanObject(preFilter);
        const queryProjection = '_id name description category brand price rating quantity properties createdAt';
        const options: QueryOptions = cleanObject(preOptions);

        const productsData = await paginatedResults(
            ProductModel, 
            filter, 
            originalUrl, 
            queryProjection, 
            options, 
            query.page ? parseInt(query.page) : null
        );              

        return productsData;
    }


    async getOne(_id: string) {
        const product = await ProductModel
            .findOne({_id: _id})
            .populate({ // Заполняем первое поле
                path: 'category', 
                populate: { path: 'properties' } // Populating across multiple levels
            })
            .populate({  // Заполняем второе поле
                path: 'brand',
                select: 'name'
            })
        return product;
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


    async edit(editedProduct: IEditedProductObj, productImages?: Express.Multer.File[]) {
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


    public async getHighestPrice() {
        const productWithHighestPrice = await ProductModel.findOne(
            {},
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
}

export default new ProductsService();