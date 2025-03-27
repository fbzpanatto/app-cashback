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