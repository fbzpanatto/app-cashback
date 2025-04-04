export interface Sale {
  saleId: number | string,
  clientId?: number,
  clientName: string,
  clientPhone: string
  saleValue: number | string,
  saleDate: Date | string,
  cashback?: number,
  cashbackExpiration?: Date | string,
  withdrawnDate?: Date | null,
  defaultExpiration?: number | null,
}

export interface Parameter {
  id: number,
  cashback: number,
  expiration_day: number
}

export interface Message {
  id: number,
  text: string
}

export interface Action {
  id: number,
  day: number,
  active: boolean,
}

export interface User {
  id: number,
  email: string,
  password: string,
  admin: boolean,
  createdAt: Date | string,
  updatedAt: Date | string,
}