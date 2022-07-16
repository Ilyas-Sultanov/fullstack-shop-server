export type PropertyInputType = {
    inputType: 'String' | 'Number' | 'Boolean', 
    isMultiselect: boolean
};

export type FilterChoicesType = 'equal' | 'range';

export type FilterChoiceValue = [number | undefined, number | undefined] | number | string;
  
export interface ICreatePropertyObj {
    categoryId: string,
    name: string,
    required: boolean
    filterable: boolean
    unit?: string
    input: PropertyInputType
    filterChoices?: {
        name: string
        value: FilterChoiceValue
        type: FilterChoicesType
    }[]
}
  
export interface IDBProperty extends ICreatePropertyObj {
    _id: string
}