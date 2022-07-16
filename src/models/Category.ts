import {Schema, model, Types} from 'mongoose';
import { IDBCategory } from 'src/types/category';
import CategoryPropertyModel from './CategoryProperty';
import ProductModel from './Product';

const CategoryRootSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            minlength: [2, 'Name can\'t be smaller than 2 characters'],
            maxlength: [75, 'Name can\'t be greater than 75 characters']
        },
        status: {
            type: String,
            required: [true, 'Status is required']
        },
        description: {
            type: String,
            maxlength: [500, 'Description can\'t be greater than 500 characters']
        },
        img: {
            type: String,
            // multer не пропустит строку длиннее 100 bytes
        }
    }, 
    {timestamps: true}
)
const CategoryRootModel = model<IDBCategory>('categories', CategoryRootSchema);



const CategoryBranchModel = CategoryRootModel.discriminator(
    'Branch',
    new Schema(
        {
            parentId: {
                type: Types.ObjectId,
                ref: 'categories',
                required: true,
            },
        }
    )
)



const CategoryLeafModel = CategoryRootModel.discriminator(
    'Leaf',
    new Schema(
        {
            parentId: {
                type: Types.ObjectId,
                ref: 'categories',
                required: true,
            },
            properties: [
                {
                    type: Types.ObjectId,
                    ref: CategoryPropertyModel,
                    default: [],
                }
            ],
            products: [
                {
                    type: Types.ObjectId,
                    ref: ProductModel,
                    default: [],
                }
            ],
        }
    )
)


export {CategoryRootModel, CategoryBranchModel, CategoryLeafModel};

/**
* здесь используется discriminator, но возможно можно использовать валидатор поля required, 
* это особый валидатор, который есть только у этого поля, т.е. значение поля required может зависеть от значения другого поля,
* в нашем случае от поля status
*/