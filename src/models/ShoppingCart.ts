import { model, Schema, Types } from 'mongoose';
import { IShoppingCart } from '../types/shoppingCart';

const ShoppingCartSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'users',
            required: [true, 'userId is required'],
        },
        shoppingCartItems: {
            type: [
                {
                    productId: {
                        type: Types.ObjectId,
                        ref: 'products',
                        required: [true, 'productId is required'],
                    },
                    name: {
                        type: String,
                        required: [true, 'product name is required'],
                    },
                    img: {
                        type: String,
                        required: [true, 'product image url is required'],
                    },
                    price: {
                        type: Number,
                        required: [true, 'price is required'],
                    },
                    quantity: {        // всего в наличии
                        type: Number,
                        required: [true, 'quantity is required'],
                    },
                    count: {           // количество в этом заказе
                        type: Number,
                        required: [true, 'count is required'],
                    },
                }
            ],
            required: [true, 'shoppingCartItems is required'],
            default: [],
        },
        totalCount: {
            type: Number,
            required: [true, 'totalCount is required'],
            default: 0,
        },
        totalPrice: {
            type: Number,
            required: [true, 'totalPrice is required'],
            default: 0,
        },
    },
);

const ShoppingCartModel = model<IShoppingCart>('shoppingCarts', ShoppingCartSchema);
export default ShoppingCartModel;