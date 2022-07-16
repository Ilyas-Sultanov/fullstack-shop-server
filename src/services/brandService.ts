import ApiError from "../exceptions/ApiError";
import BrandModel from "../models/brand";
import ProductModel from "../models/Product";

class BrandService {
    public async create(name: string) {
        await BrandModel.create(
            {
                name: name
            }
        );
    }

    public async getOne(_id: string) {
        const brandDoc = await BrandModel.findOne(
            {_id: _id},
            '',
            {lean: true}
        );
        return brandDoc;
    }

    public async getAll() {
        const brandDocs = await BrandModel.find(
            {},
            '',
            {lean: true}
        );
        return brandDocs;
    }

    public async edit(_id: string, name: string) {
        await BrandModel.replaceOne(
            {_id: _id},
            {name: name}
        );
    }

    public async delete(_id: string) {
        const product = await ProductModel.findOne(
            {brand: _id},
            '',
            {lean: true}
        );
        if (!product) await BrandModel.deleteOne({_id: _id});
        else throw ApiError.badRequest('Found product using this brand.');
    }
}

export default new BrandService();