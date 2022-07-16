import { Schema, model } from 'mongoose';
import { IBrand } from '../types/types';

const BrandSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true, 
        },
    },
    /* options */
);

const BrandModel = model<IBrand>('brands', BrandSchema);
export default BrandModel;