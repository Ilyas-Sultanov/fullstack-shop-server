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
    link: string | null
    expireLink: Date | null
}
  
export interface IUserDto {
    _id: string
    name: string
    email: string
    roles: string[]
    isActivated: boolean
}