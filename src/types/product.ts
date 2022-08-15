import { PopulatedDoc, Document } from 'mongoose';
import {IBrand, IPaginatedData, IPaginationQuery} from '../types/types';
import {IDBCategory} from '../types/category';
import { FilterChoice, FilterChoiceValue, IDBProperty, PropertyInputSettings, PropertyInputType } from './categoryProperty';

export interface IProductsQuery extends IPaginationQuery, Record<string, string | Array<string> | undefined | Record<string, string>> {
    _id?: string
    name?: string
    brand?: string | Array<string>
    category?: string
    price?: {gte: string, lte: string}
    quantity?: {lte: string}
    sort?: string
    order?: string
    dateFrom?: string
    dateTo?: string
}

export interface IProductProperty {
    value: FilterChoiceValue
    categoryPropId: string
}

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
    images: Array<string>
}

export interface IDBProduct {
    _id: string
    category: PopulatedDoc<IDBCategory & Document>
    name: string
    description: string
    images: Array<string>
    brand: PopulatedDoc<IBrand & Document>
    price: number
    warranty: number
    quantity: number
    ordered: number
    rating?: number
    properties: Array<IProductProperty>
    createdAt: string
    updatedAt: string
}


export interface IPreparedForUIProperty extends IProductProperty {
    name: string
    filterable: boolean
    filterChoices: Array<FilterChoice> | undefined
    // type: PropertyInputType
    // isMultiselect: boolean
    validationMessages: Array<string>
    unit: string
    inputSettings: PropertyInputSettings
}


export interface IPreparedForUIProduct {
    _id: string
    name: string
    description: string
    category: PopulatedDoc<IDBCategory & Document>
    images: Array<string>
    brand: PopulatedDoc<IBrand & Document>
    price: number
    warranty: number
    quantity?: number
    rating?: number
    properties: Array<IPreparedForUIProperty>
    createdAt: string
    updatedAt: string
    validationMessages: {
        category?: Array<string>
        name?: Array<string>
        description?: Array<string>
        brand?: Array<string>
        price?: Array<string>
        warranty?: Array<string>
        quantity?: Array<string>
    }
}


export interface IProductsData extends IPaginatedData<IDBProduct> {
    data: IDBProduct[]
}