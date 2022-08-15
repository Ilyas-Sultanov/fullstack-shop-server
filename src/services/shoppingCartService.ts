import { Types } from "mongoose";
import ShoppingCartModel from "../models/ShoppingCart";


class ShoppingCartService {
    public async create(userId: string | Types.ObjectId) {
        return await ShoppingCartModel.create({userId: userId.toString()});
    }

    public async getOne(cartId: string) {
        return await ShoppingCartModel.findOne({_id: cartId});
    }
}

export default new ShoppingCartService();