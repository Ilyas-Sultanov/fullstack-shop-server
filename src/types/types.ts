export interface IPaginationQuery {
  page?: string,
  limit?: string,
}

export interface IPaginatedData<T> {
  totalNumberOfMatches: number,
  currentPage: number,
  limit: number, 
  link: string,
  data: T[],
}

export interface IRole {
  _id: string
  value: string
}

export interface IToken {
  _id: string
  userId: string
  refreshToken: string
}

export interface ILink {
  value: string
  userId: string
  created: Date
  newPassword?: string
}

export interface IBrand {
  _id: string
  name: string
}