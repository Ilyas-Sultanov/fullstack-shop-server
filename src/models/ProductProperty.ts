import {Schema, model, SchemaTypes, SchemaType, Types, AnyObject, ValidatorProps} from 'mongoose';
import { FilterChoiceValue } from '../types/categoryProperty';


export class ProductPropValueUnion extends SchemaType { // custom schema type
    constructor(key: string, options: AnyObject) {
      super(key, options, 'ProductPropValueUnion');
    }
 
    // валидация типов (значения валируем там где положено - в validate)
    cast(value: FilterChoiceValue) {
        let isValid = true;
        if (Array.isArray(value)) {
            const elType: string | number = typeof value[0];
            if (elType !== 'string' && elType !== 'number') {
                isValid = false;
            }
            for (let i=0; i<value.length; i+=1) {
                if (typeof value[i] !== elType) {
                    isValid = false;
                    break;
                }
            }
        }
        else if (
            isNaN(value as number) && 
            typeof value !== 'string' && 
            typeof value !== 'boolean'
        ) { 
            isValid = false;
        }

        if (!isValid) {
            throw new Error('The property value must be of type string, number, boolean, array of strings or array of numbers');
        }
        return value;
    }
}
Schema.Types.ProductPropValueUnion = ProductPropValueUnion;
/**
 * Чтобы добавить новый тип схемы (см. строчку выше), нужно добавить его тип для Schema.Types в index.d.ts
 *  declare module 'mongoose' {
        namespace Schema {
            namespace Types {
                class ProductPropValueUnion extends SchemaType {}
            }
        }
    }
 */


export const ProductPropertySchema = new Schema(
    {   
        value: {
            type: ProductPropValueUnion,
            required: true,
            validate: [
                {
                    validator(value: FilterChoiceValue) {
                        if (!isNaN(value as number)) {
                            if (value < 0 || value > 999999) {
                                return false;
                            }
                        }
                        return true;
                    },
                    message({path, value}: ValidatorProps) {
                        return `${value} is outside the range 0 - 999999`
                    }
                },
                {
                    validator(value: FilterChoiceValue) {
                        const v = value as string;
                        if (v.length < 1 || v.length > 75) {
                            return false
                        }
                        return true;
                    },
                    message({path, value}: ValidatorProps) {
                        return `String length ${value} is out of range 1 - 75`
                    }
                },
            ]
        },
        categoryPropId: String
        // propType: {
        //     type: String,
        //     required: true,
        //     enum: {
        //         values: ['String', 'Number', 'Boolean'],
        //         message: 'Property type not valid',
        //     }
        // },
    }
);

// const ProductPropertyModel = model<IProductProperty>('productProperties', ProductPropertySchema);
// export default ProductPropertyModel;




/**
 * Валидация поля value в зависимости от поля propType
 * 
 * Входящие данные:
 * 
 * "properties": [
        {
            "value": "Some string",
            "propType": "String"
        },
        {
            "value": 777,
            "propType": "Number"
        },
        {
            "value": true,
            "propType": "Boolean"
        }
    ]
 * 
 * export const ProductPropertySchema = new Schema(
    {   
        value: {
            type: ProductPropValueUnion,
            required: true,
            validate: [
                {
                    validator(value: ProductPropValue) {
                        const prop = this as IProductProperty;
                        if (prop.propType === 'String') {
                            if (typeof prop.value !== 'string') {
                                return false;
                            }
                        }
                        return true;
                    },
                    message({path, value}: ValidatorProps) {
                        return `${value} is not a string`
                    }
                },
                {
                    validator(value: ProductPropValue) {
                        const prop = this as IProductProperty;
                        if (prop.propType === 'Number') {
                            if (typeof prop.value !== 'number') {
                                return false;
                            }
                        }
                        return true;
                    },
                    message({path, value}: ValidatorProps) {
                        return `${value} is not a number`
                    }
                },
                {
                    validator(value: ProductPropValue) {
                        const prop = this as IProductProperty;
                        if (prop.propType === 'Boolean') {
                            if (typeof prop.value !== 'boolean') {
                                return false;
                            }
                        }
                        return true;
                    },
                    message({path, value}: ValidatorProps) {
                        return `${value} is not a boolean`
                    }
                },
            ]
        },
        propType: {
            type: String,
            required: true,
            enum: {
                values: ['String', 'Number', 'Boolean'],
                message: 'Property type not valid',
            }
        },
    }
);

const ProductPropertyModel = model<IProductProperty>('productProperties', ProductPropertySchema);
export default ProductPropertyModel;
 */








// import {Schema, model, SchemaTypes, Types} from 'mongoose';
// import {IDBProductProprty} from '../types/productProperty';

// const ProductPropertySchema = new Schema(
//     {
//         category: {
//             type: Types.ObjectId,
//             ref: 'categories',
//             required: true,
//         },
//         propType: {
//             type: String,
//             required: true,
//             enum: {
//                 values: ['String', 'Number', 'Boolean'],
//                 message: 'Property type not valid',
//             }
//         },
//     }
// );

// const ProductPropertyModel = model<IDBProductProprty>('productProperties', ProductPropertySchema);

// const ProductPropertyStringModel = ProductPropertyModel.discriminator(
//     'String',
//     new Schema(
//         {
//             value: {
//                 type: String,
//                 required: true
//             },
//         }
//     )
// )

// const ProductPropertyNumberModel = ProductPropertyModel.discriminator(
//     'Number',
//     new Schema(
//         {
//             value: {
//                 type: Number,
//                 required: true
//             },
//         }
//     )
// )

// const ProductPropertyBooleanModel = ProductPropertyModel.discriminator(
//     'Boolean',
//     new Schema(
//         {
//             value: {
//                 type: Boolean,
//                 required: true
//             },
//         }
//     )
// )

// export {
//     ProductPropertyStringModel, 
//     ProductPropertyNumberModel, 
//     ProductPropertyBooleanModel
// };