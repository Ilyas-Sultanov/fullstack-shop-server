export type ProductPropValue = string | number | boolean | string[] | number[]
// export interface IProductProperty extends Record<string, ProductPropValue> {}

export interface IProductProperty {
    value: ProductPropValue
    categoryPropId: string
}

// export interface IProductProperty {
//     value: ProductPropValue
//     propType: 'String' | 'Number' | 'Boolean'
// }