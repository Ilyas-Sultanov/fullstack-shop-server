import { IPaginationQuery } from "./types"

export type OrderItem = {
    productId: string
    quantity: number
    price: number // Цена на момент создания заказа
}

export interface INewOrder {
    userId: string
    items: Array<OrderItem>
    totalPrice: number
}

export interface IDBOrder extends INewOrder {
    _id: string
    isPaid: boolean
    createdAt: Date
    updatedAt: Date
}

export interface IOrderQuery extends IPaginationQuery, Record<string, string | Array<string> | undefined | Record<string, string>> {
    _id?: string
    price?: {gte: string, lte: string}
    sort?: string
    order?: string // порядок сортировки
    date: {gte: string, lte: string}
}