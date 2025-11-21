export interface GenericResponse<T = any> {
  code: number;
  message: string;
  object: T;
}

export interface GenericResponseProd<T = any> {
  code: number;
  message: string;
  object: T;
  totalRecords: number;
}
