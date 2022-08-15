import { model, Schema, Types } from 'mongoose';
import { IDBOrder } from '../types/order';

const OrderSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'users',
            required: [true, 'userId is required'],
        },
        items: {
            type: [
                {
                    productId: {type : String},
                    price: {type : Number},      // цена на момент создания заказа 
                    quantity: {type : Number},
                }
            ],
            required: [true, 'items is required'],
        },
        totalPrice: {
            type: String,
            required: [true, 'totalPrice is required'],
        },
        isPaid: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const OrderModel = model<IDBOrder>('orders', OrderSchema);
export default OrderModel;