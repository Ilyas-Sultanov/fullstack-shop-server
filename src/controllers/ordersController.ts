import { Request, Response, NextFunction } from "express";
import { IDBOrder, INewOrder, IOrderQuery } from "../types/order";
import orderService from "../services/orderService";

class OrdersController {
    public async create(req: Request, res: Response, next: NextFunction) {
        try {
            const newOrder: INewOrder = req.body;
            await orderService.create(newOrder);
            res.sendStatus(201);
        }
        catch (err) {
            next(err);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params._id;
            const order = await orderService.getOne(orderId);
            res.json(order);
        } catch (err) {
            next(err)
        }
    }

    public async getMany(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as IOrderQuery;
            const orders = await orderService.getMany(query, req.originalUrl);
            res.json(orders);
        } catch (err) {
            next(err)
        }
    }

    public async deleteOne(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId: string = req.params._id;
            await orderService.deleteOne(req.user, orderId);
            res.sendStatus(204);
        }
        catch (err) {
            next(err);
        }
    }

    public async editOne(req: Request, res: Response, next: NextFunction) {
        try {
            const editedOrder: IDBOrder = req.body;
            await orderService.editOne(req.user, editedOrder);
            res.sendStatus(204);
        } 
        catch (err) {
            next(err);
        }
    }
}

export default new OrdersController();