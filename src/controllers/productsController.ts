import { NextFunction, Request, Response } from "express";
import productsService from "../services/productsService";
import { ICreateProductObj, IEditedProductObj, IProductsQuery } from "../types/product";
import ApiError from "../exceptions/ApiError";
import getValidationMessages from "../helpers/getValidationMessages";

class ProductController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const newProduct: ICreateProductObj = JSON.parse(req.body.product);
            const productImages = req.files && (req.files as Express.Multer.File[]);  

            await productsService.create(newProduct, productImages);
            res.sendStatus(201);
        }
        catch (err) {
            next(err);
        }
    }

    async getMany(req: Request, res: Response, next: NextFunction) {
        try {
            const productsData = await productsService.getMany(req.query as IProductsQuery, req.originalUrl);
            return res.json(productsData);
        }
        catch (err) {
            next(err);
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const {_id} = req.params;
            const product = await productsService.getOne(_id);
            return res.json(product);
        }
        catch (err) {
            next(err);
        }
    }

    async edit(req: Request, res: Response, next: NextFunction) {
        try {
            const editedProduct: IEditedProductObj = JSON.parse(req.body.product);
            const productImages = req.files && (req.files as Express.Multer.File[]);  

            await productsService.edit(editedProduct, productImages);
            return res.sendStatus(200);
        }
        catch (err) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await productsService.delete(req.params._id);
            return res.sendStatus(204);
            /**
             *  202 (Accepted) код состояния, если удаление будет успешным, но ещё не выполнено.
             *  204 (No Content) код ответа, если удаление было выполнено, но тело ответа отсутствует.
             *  200 (OK) код ответа, если удаление было выполнено, и ответ содержит код и объект описывающий состояние.
             */
        }
        catch (err) {
            next(err);
        }
    }

    async getHighestPrice(req: Request, res: Response, next: NextFunction) {
        try {
            const categoryId = req.query.categoryId as string | undefined;
            const highestPrice = await productsService.getHighestPrice(categoryId);
            if (highestPrice) return res.json(highestPrice);
            return res.json('Not found');
        }
        catch (err) {
            next(err);
        }
    }
}

export default new ProductController();