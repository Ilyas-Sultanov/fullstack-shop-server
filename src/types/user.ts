import { PopulatedDoc, Document } from "mongoose"
import { IDBOrder } from "./order"
import { IShoppingCart } from "./shoppingCart"
import { IPaginationQuery } from "./types"

export interface usersQuery extends IPaginationQuery {
    _id?: string, 
    name?: string, 
    email?: string, 
    role?: string[], 
    isActivated?: string,
    sort?: string,
    order?: string,
    dateFrom?: string,
    dateTo?: string,
}

export interface IUser {
    _id: string
    name: string
    email: string
    password: string
    roles: string[]
    isActivated: boolean
    shoppingCart: PopulatedDoc<IShoppingCart & Document>
    orders: Array<PopulatedDoc<IDBOrder & Document>>
}
  
export interface IUserDto {
    _id: string
    name: string
    email: string
    roles: string[]
    isActivated: boolean
    shoppingCart: PopulatedDoc<IShoppingCart & Document>
    orders: Array<PopulatedDoc<IDBOrder & Document>>
}