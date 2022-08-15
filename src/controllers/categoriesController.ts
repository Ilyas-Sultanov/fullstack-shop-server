import {Request, Response, NextFunction} from "express";
import {MongoError} from 'mongodb';
import {Error} from 'mongoose';
import categoriesService from "../services/categoryService";
import { CreateCatRequestBodyType, ICreateCategoryObj, EditCatRequestBodyType, IDBCategory } from "src/types/category";
import {IDBProduct} from '../types/product'
import ApiError from "../exceptions/ApiError";
import { ICreatePropertyObj, IDBProperty } from "../types/categoryProperty";


class CategoriesController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const category: ICreateCategoryObj = JSON.parse(req.body.category);
            const properties: ICreatePropertyObj[] = JSON.parse(req.body.props);
            const categoryImage = req.files && (req.files as Express.Multer.File[])[0];         
                                
            await categoriesService.create(category, properties, categoryImage);
            res.sendStatus(201);
        }
        catch (err) {
            if (err instanceof Error.ValidationError) {
                const messages = Object.values(err.errors).map((err) => err.message);
                next(ApiError.badRequest(messages.join('|')));
            } 
            else if ((err as MongoError).code === 11000) {
                next(ApiError.badRequest('A category with this this unique key already exists!'));
            }
            else {
                next(err);
            }
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await categoriesService.getAll();
            return res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id;
            const result = await categoriesService.getOne(categoryId);
            return res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }

    // async edit(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         // const validationMessages = getValidationMessages(req);
    //         // if (validationMessages?.length) {
    //         //     throw ApiError.badRequest(validationMessages.join('|'));
    //         // }
    //         const categoryId = req.params._id;
    //         const {category, properties}: EditCatRequestBodyType = req.body;  
    //         await categoriesService.edit(categoryId, category, properties);
    //         return res.sendStatus(204);
    //     }
    //     catch (err) {
    //         if (err instanceof Error.ValidationError) {
    //             const messages = Object.values(err.errors).map((err) => err.message);
    //             next(ApiError.badRequest(messages.join('|')));
    //         } 
    //         else {
    //             next(err);
    //         }
    //     }
    // }

    async edit(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id;
            const category: IDBCategory = JSON.parse(req.body.category);
            const properties: IDBProperty[] = JSON.parse(req.body.props);
            const categoryImage = req.files && (req.files as Express.Multer.File[])[0];  

            // for (let i=0; i<properties.length; i+=1) {
            //     console.log(properties[i]);
            // }
            
            await categoriesService.edit(categoryId, category, properties, categoryImage);
            return res.sendStatus(204);
        }
        catch (err) {
            if (err instanceof Error.ValidationError) {
                const messages = Object.values(err.errors).map((err) => err.message);
                next(ApiError.badRequest(messages.join('|')));
            } 
            else {
                next(err);
            }
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.params._id;
            await categoriesService.delete(categoryId);
            return res.sendStatus(204);
        }
        catch (err) {
            next(err);
        }
    }
}

export default new CategoriesController();