import {Schema, model, Types, SchemaType, AnyObject, ValidatorProps} from 'mongoose';
import { IDBProperty, FilterChoiceValue } from '../types/categoryProperty';


export class FilterChoiceValueUnion extends SchemaType { // custom schema type
    constructor(key: string, options: AnyObject) {
      super(key, options, 'FilterChoiceValueUnion');
    }
 
    cast(value: FilterChoiceValue) {
        if (isNaN(value as number) && typeof value !== 'string' && !Array.isArray(value)) {
            throw new Error(`Choice value must be of type string, number, or Array`);
        }
        return value;
    }
}
Schema.Types.FilterChoiceValueUnion = FilterChoiceValueUnion;



const CategoryPropertySchema = new Schema({
    categoryId: {
        type: Types.ObjectId,
        ref: 'categories',
        required:  [true, 'categoryId is required'],
    },
    name: {
        type: String,
        required:  [true, 'Prop name is required'],
    },
    filterable: {
        type: Boolean,
        default: false,
    },
    unit: {
        type: String,
        maxlength: [10, 'Unit can\'t be greater than 10 characters'],
    },
    filterChoices: [
        {
            name: {
                type: String,
                required: true,
                minlength: [1, 'FilterChoices Name can\'t be smaller than 1 characters'],
                maxlength: [75, 'FilterChoices Name can\'t be greater than 75 characters'],
            },
            value: {
                type: FilterChoiceValueUnion,
                validate: [
                    {
                        validator(value: FilterChoiceValue) {
                            const v = value as string;
                            if (v.length < 1 || v.length > 75) {
                                return false
                            }
                            return true;
                        },
                        message({path, value}: ValidatorProps) {
                            return `String length ${value} is out of range 1 - 75`;
                        }
                    },
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
                            return `${value} is outside the range 0 - 999999`;
                        }
                    },
                    {
                        validator(value: FilterChoiceValue) {
                            const v = (value as Array<any>);
                            if (Array.isArray(v) && (v.length !== 2)) return false;
                            return true;
                        },
                        message({path, value}: ValidatorProps) {
                            return `Filter choice array, can contain only 2 elements`;
                        }
                    },
                    {
                        validator(value: FilterChoiceValue) {
                            const v = (value as Array<any>);
                            if (Array.isArray(v)) {
                                if ( (typeof v[0] !== 'number' && v[0] !== null) || (typeof v[1] !== 'number' && v[1] !== null) ) {
                                    return false;
                                }
                            }
                           
                            return true;
                        },
                        message({path, value}: ValidatorProps) {
                            return `Filter choice array, can contain elements of type null or number`;
                        }
                    },
                    {
                        validator(value: FilterChoiceValue) {
                            const v = (value as Array<any>);
                            if (Array.isArray(v)) {
                                if ( (v[0] && (v[0] < 1) || v[0] > 999999) ) {
                                    return false;
                                }
                                if ( (v[1] && (v[1] < 1) || v[1] > 999999) ) {
                                    return false;
                                }
                            }
                            return true;
                        },
                        message({path, value}: ValidatorProps) {
                            return `The numeric value of the choice value must be between 0 - 999999`;
                        }
                    }
                ]
            },
        }
    ],
    inputSettings: {
        inputType: {
            type: String,
            enum: {
                values: ['Number', 'String', 'Boolean'],
                message: 'inputType can be only Number, String or Boolean',
            },
        }, 
        isMultiselect: {
            type: Boolean,
            default: false,
        },
        isRange: {
            type: Boolean,
            default: false,
        },
    }
});

const CategoryPropertyModel = model<IDBProperty>('category_properties', CategoryPropertySchema);
export default CategoryPropertyModel;












// import {Schema, model} from 'mongoose';
// import { IDBProperty } from '../types/property';

// const PropertySchema = new Schema({
//     name: {
//         type: String,
//         required: true
//     },

//     filterable: {
//         type: Boolean,
//         default: false
//     },

//     unit: {
//         type: String
//     },

//     filterChoices: [
//         {
//             name: {
//                 type: String,
//                 required: true
//             },
//             value: {
//                 type: String,
//                 required: true
//             },
//             type: {
//                 type: String,
//                 enum: ['lt', 'lte', 'eq', 'gte', 'gt', ''],
//             }
//         }
//     ],

//     input: {
//         inputType: {
//             type: String,
//             enum: ['Number', 'String', 'Boolean'],
//         }, 
//         isMultiselect: {
//             type: Boolean
//         }
//     }
// });

// const PropertyModel = model<IDBProperty>('properties', PropertySchema);
// export default PropertyModel;