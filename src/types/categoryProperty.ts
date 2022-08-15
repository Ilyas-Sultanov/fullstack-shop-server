export type PropertyInputType = 'String' | 'Number' | 'Boolean';

export type PropertyInputSettings = {
    inputType: PropertyInputType, 
    isMultiselect: boolean
};

export type FilterChoiceValue = number | string | boolean | Array<string>;

export type FilterChoice = {
    name: string
    value: FilterChoiceValue
}
  
export interface ICreatePropertyObj {
    categoryId: string,
    name: string,
    required: boolean
    filterable: boolean
    unit?: string
    inputSettings: PropertyInputSettings
    filterChoices?: Array<FilterChoice>
}
  
export interface IDBProperty extends ICreatePropertyObj {
    _id: string
}