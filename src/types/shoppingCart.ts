export type ShoppingCartItem = {
    productId: string
    name: string
    img: string
    price: number
    quantity: number
    count: number
}

export interface IShoppingCart {
    userId: string
    shoppingCartItems: Array<ShoppingCartItem>
    totalCount: number
    totalPrice: number
    createdAt: Date
    updatedAt: Date
}