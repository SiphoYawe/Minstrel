export type ApiResponse<T> = { data: T; error: null };
export type ApiErrorResponse = { data: null; error: { code: string; message: string } };
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
