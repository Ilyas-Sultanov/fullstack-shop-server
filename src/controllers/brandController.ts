import { Request, Response, NextFunction } from 'express';
import {MongoError} from 'mongodb';
import {Error} from 'mongoose';
import ApiError from '../exceptions/ApiError';
import ProductModel from '../models/Product';
import brandService from '../services/brandService';

class BrandControler {
    public async create(req: Request, res: Response, next: NextFunction) {
        try {
            const {name}: {name: string} = req.body;
            await brandService.create(name);
            res.sendStatus(201);
        }
        catch (err) {
            if (err instanceof Error.ValidationError) {
                const messages = Object.values(err.errors).map((err) => err.message);
                next(ApiError.badRequest(messages.join('|')));
            } 
            else if ((err as MongoError).code === 11000) {
                next(ApiError.badRequest('A brand with this this unique name already exists!'));
            }
            else {
                next(err);
            }
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const brand = await brandService.getOne(req.params._id);
            res.status(200).json(brand);
        }
        catch (err) {
            next(err);
        }
    }

    public async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const brands = await brandService.getAll();
            res.status(200).json(brands);
        }
        catch (err) {
            next(err);
        }
    }

    public async edit(req: Request, res: Response, next: NextFunction) {
        try {
            const _id = req.params._id;
            const {name}: {_id: string, name: string} = req.body;
            console.log(name);
            
            await brandService.edit(_id, name);
            res.sendStatus(200);
        }
        catch (err) {
            if (err instanceof Error.ValidationError) {
                const messages = Object.values(err.errors).map((err) => err.message);
                next(ApiError.badRequest(messages.join('|')));
            } 
            else if ((err as MongoError).code === 11000) {
                next(ApiError.badRequest('A brand with this this unique name already exists!'));
            }
            else {
                next(err);
            }
        }
    }

    public async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await brandService.delete(req.params._id);
            res.sendStatus(204);
        }
        catch (err) {
            next(err);
        }
    }
}

export default new BrandControler();