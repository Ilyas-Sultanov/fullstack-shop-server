import {ProductPropValueUnion} from '../../../src/models/ProductProperty';
import { SchemaType } from "mongoose";

declare module 'mongoose' {
    namespace Schema {
        namespace Types {
            class ProductPropValueUnion extends SchemaType {}
            class FilterChoiceValueUnion extends SchemaType {}
        }
    }
}