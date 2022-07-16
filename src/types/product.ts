import {IPaginatedData, IPaginationQuery} from '../types/types';
import {IDBCategory} from '../types/category';
import {IProductProperty} from '../types/productProperty';

export interface ICreateProductObj {
    name: string
    category: string
    description: string
    brand: string
    price: number
    warranty: number
    quantity?: number
    rating?: number
    properties: IProductProperty[]
}

export interface IEditedProductObj extends ICreateProductObj {
    _id: string
    images: string[]
}

export interface IDBProduct {
    _id: string
    category: string
    name: string
    description: string
    images: string[]
    brand: string
    price: number
    warranty: number
    quantity?: number
    rating?: number
    properties: IProductProperty[]
    createdAt: string
    updatedAt: string
}

export interface IProductsData extends IPaginatedData<IDBProduct> {
    data: IDBProduct[]
}

export interface IProductsQuery extends IPaginationQuery {
    _id?: string
    name?: string
    brand?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    quantityLTE?: number
    sort?: string
    order?: string
    dateFrom?: string
    dateTo?: string
}