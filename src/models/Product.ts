import {Schema, model, Types, SchemaTypes, ValidatorProps} from 'mongoose';
import {IDBProduct} from '../types/product';
import {ProductPropertySchema} from './ProductProperty'
import {ProductPropValue, IProductProperty} from '../types/productProperty';

const ProductSchema = new Schema(
    {
        name: {
            type: String,
            minlength: [2, 'Name length must be between 2 and 75 characters'],
            maxlength: [75, 'Name length must be between 2 and 75 characters'],
            required: true,
        },
        category: {
            type: Types.ObjectId,
            ref: 'categories',
            required: true
        }, 
        description: {
            type: String,
            minlength: [2, 'Description length cannot be more than 500 characters'],
            maxlength: [500, 'Description length cannot be more than 500 characters'],
            required: true,
        },
        images: {
            type: [String]
        },
        // brand: {
        //     type: String,
        //     minlength: [2, 'Brand length must be between 2 and 75 characters'],
        //     maxlength: [75, 'Brand length must be between 2 and 75 characters'],
        //     required: true,
        // },
        brand: {
            type: Types.ObjectId,
            ref: 'brands',
            required:  [true, 'categoryId is required'],
        },
        price: {
            type: Number,
            min: [1, 'The value of the price field must be 1 - 999999'],
            max: [999999, 'The value of the price field must be 1 - 999999'],
            required: true,
            default: 1
        },
        warranty: {
            type: Number,
            min: [0, 'The value of the warranty field must be 0 - 10'],
            max: [10, 'The value of the warranty field must be 0 - 10'],
            required: true,
        },
        quantity: {
            type: Number,
            min: [1, 'The value of the quantity field must be 1 - 999999'],
            max: [999999, 'The value of the quantity field must be 1 - 999999'],
            required: true,
            default: 1
        },
        rating: {
            type: Number,
            min: [0, ''],
            max: [5, ''],
            default: 0
        },
        properties: [ProductPropertySchema],
        
        // properties: {
        //     type: Map,
        //     of: String,
        // },

        // properties: [ 
        //     {
        //         type: Map,
        //         of: String,
        //     }
        // ],
    },
    {
        timestamps: true,
    }
);


// ProductSchema.path('properties').validate(
//     function(value: IProductProperty[]) {        
//         value.every((item) => {
//             const prodPropValue = Object.values(item)[0];

//             if (typeof prodPropValue === 'string') {
//                 if (prodPropValue.length < 1 || prodPropValue.length > 75) return false
//             }
//             else if (typeof prodPropValue === 'number') {
//                 if (prodPropValue < 0 || prodPropValue > 999999) return false
//             }
//             // else if (typeof prodPropValue !== 'boolean')
//             //     return false
//             // }
//             return true;
//         });
//     },
//     'Property value is not valid'
// );


const ProductModel = model<IDBProduct>('products', ProductSchema);
export default ProductModel;