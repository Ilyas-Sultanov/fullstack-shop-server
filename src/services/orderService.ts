import { IDBOrder, INewOrder, IOrderQuery } from '../types/order';
import OrderModel from '../models/Order';
import UserModel from '../models/User';
import ProductModel from '../models/Product';
import { IUserDto } from '../types/user';
import ApiError from '../exceptions/ApiError';
import { startSession, UpdateQuery, FilterQuery } from 'mongoose';
import { IDBProduct } from '../types/product';

class OrderService {
    public async create(newOrder: INewOrder) {
        const session = await startSession();
        await session.withTransaction(
            async function() {
                // Создание заказа
                const order = await OrderModel.create(newOrder);
                
                // Добавление _id заказа пользователю
                await UserModel.updateOne(
                    {_id: newOrder.userId},
                    {$push: {orders: order._id}},
                    {session}
                );

                // Изменение доступного количества товара
                const writes: Array<{updateOne: {filter: FilterQuery<IDBProduct>, update: UpdateQuery<IDBProduct>}}> = [];
                for (let i = 0; i < order.items.length; i+=1) {
                    const filter: FilterQuery<IDBProduct> = { _id: order.items[i].productId };
                    const update: UpdateQuery<IDBProduct> = { $inc: {quantity: -order.items[i].quantity, ordered: order.items[i].quantity} };
                    writes.push({updateOne: {filter, update}});
                }

                await ProductModel.bulkWrite(writes, {session});
            }
        );
        session.endSession();
    }


    public async getOne(orderId: string) {
        const order = await OrderModel.findOne(
            {_id: orderId}
        );
        if (order) return order;
        throw ApiError.badRequest('Order not found.')
    }


    public async getMany(query: IOrderQuery, originalUrl: string) {
        console.log(query);
        console.log(originalUrl);
        
    }   

    
    public async deleteOne(user: IUserDto, orderId: string) { // именно удаление, а не завершёние (оплата)
        const order = await OrderModel.findOne({_id: orderId}, '', {lean: true});
        
        if (order) {
            const session = await startSession();
            await session.withTransaction(async () => {
                // admin может удалять любые заказы, а user только свои.
                // Удаление _id заказа у пользователя
                const filter = user.roles.includes('admin') ? {orders: {$elemMatch: {$eq: orderId}}} : {_id: user._id, orders: {$elemMatch: {$eq: orderId}}};
                await UserModel.updateOne(
                    filter,
                    {$pull: {orders: orderId}},
                    {session},
                );
    
                // Изменение доступного количества товара
                const writes: Array<{updateOne: {filter: FilterQuery<IDBProduct>, update: UpdateQuery<IDBProduct>}}> = [];
                for (let i = 0; i < order.items.length; i+=1) {
                    const filter: FilterQuery<IDBProduct> = { _id: order.items[i].productId };
                    const update: UpdateQuery<IDBProduct> = { $inc: {quantity: order.items[i].quantity, ordered: -order.items[i].quantity} };
                    writes.push({updateOne: {filter, update}});
                }
                await ProductModel.bulkWrite(writes, {session});
    
                // Удаление заказа
                await OrderModel.deleteOne( 
                    {_id: orderId}, 
                    {session},
                ); 
            });
            session.endSession();
        }
        else {
            throw ApiError.badRequest("Order not found.");
        }
    }


    public async editOne(user: IUserDto, editedOrder: IDBOrder) {
        const order = await OrderModel.findOne({_id: editedOrder._id}, '', {lean: true});
        
        // Если заказ еще не оплачен, его можно изменять
        // admin может изменять любые заказы, а user только свои.
        if (order && !order.isPaid && (user.roles.includes('admin') || order.userId.toString() === user._id)) {
            const prodIds = order.items.map((item) => item.productId);
                        
            const products = await ProductModel.find(
                {_id: {$in: prodIds}},
                '',
                {lean: true}
            );

            const session = await startSession();

            await session.withTransaction(
                async function() {
                    await OrderModel.replaceOne(
                        {_id: editedOrder._id},
                        editedOrder
                    );

                    // Изменение доступного количества товара
                    const writes: Array<{updateOne: {filter: FilterQuery<IDBProduct>, update: UpdateQuery<IDBProduct>}}> = [];
                    for (let j = 0; j < products.length; j++) {
                        const product = products[j];
                        const orderItem = editedOrder.items.find((item) => item.productId === product._id.toString());
                        
                        if (orderItem) {
                            const filter: FilterQuery<IDBProduct> = { _id: orderItem.productId };
                            const update: UpdateQuery<IDBProduct> = { $set: {
                                quantity: product.quantity + product.ordered - orderItem.quantity, 
                                ordered: orderItem.quantity
                            } };
                            writes.push({updateOne: {filter, update}});
                        }
                    }
                    await ProductModel.bulkWrite(writes, {session});
                }
            );
            session.endSession();
        }
    }
}

export default new OrderService();