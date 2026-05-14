export interface User {
  id: string
  name: string
}

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}
