import { PopulatedDoc, Document } from "mongoose";
import { IDBProperty } from "./categoryProperty";
import { IDBProduct } from './product';
import { IBrand } from "./types";

export type CategoryStatusType = 'root' | 'branch' | 'leaf';
export type CreateCatRequestBodyType = {category: ICreateCategoryObj, categoryImage: string, properties: IDBProperty[]};
export type EditCatRequestBodyType = {category: IDBCategory, properties: IDBProperty[]};

export interface ICreateCategoryObj {
    parentId?: string
    name: string
    status: CategoryStatusType
    description: string
    properties?: Array<string>
    brands?: Array<string>
}

  
export interface IDBCategory {
    _id: string
    parentId?: string
    name: string
    status: CategoryStatusType
    img?: string
    description?: string
    properties?: Array<PopulatedDoc<IDBProperty & Document>>
    brands: Array<PopulatedDoc<IBrand & Document>>
    // products?: string[]
}


export interface ICategoryTree {
    _id: string
    name: string
    status: CategoryStatusType
    description?: string
    img?: string
    properties?: PopulatedDoc<IDBProperty & Document>
    products?: Array<IDBProduct>
    children: ICategoryTree[]
    parent?: {
        _id: string
        name: string
    }
}