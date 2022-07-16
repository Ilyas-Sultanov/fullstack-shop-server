import { IDBProperty } from "./categoryProperty";
import { IDBProduct } from './product';

export type CategoryStatusType = 'root' | 'branch' | 'leaf';
export type CreateCatRequestBodyType = {category: ICreateCategoryObj, categoryImage: string, properties: IDBProperty[]};
export type EditCatRequestBodyType = {category: IDBCategory, properties: IDBProperty[]};

export interface ICreateCategoryObj {
    parentId?: string
    name: string
    status: CategoryStatusType
    description: string
    properties?: string[]
}

  
export interface IDBCategory {
    _id: string
    parentId?: string
    name: string
    status: CategoryStatusType
    img?: string
    description?: string
    properties?: string[]
    products?: string[]
}

export interface IUnit {
    _id: string
    value: string
}

export interface ICategiryTree {
    _id: string
    name: string
    status: CategoryStatusType
    description?: string
    img?: string
    properties?: IDBProperty[] | string[]
    products?: IDBProduct[]
    children: ICategiryTree[]
    parent?: {
        _id: string
        name: string
    }
}