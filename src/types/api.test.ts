import type { ApiResponse, ApiErrorResponse, ApiResult } from '@/types/api';

describe('API types', () => {
  it('ApiResponse type accepts data with null error', () => {
    const response: ApiResponse<{ id: number }> = {
      data: { id: 1 },
      error: null,
    };
    expect(response.data.id).toBe(1);
    expect(response.error).toBeNull();
  });

  it('ApiErrorResponse type accepts error with null data', () => {
    const response: ApiErrorResponse = {
      data: null,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    };
    expect(response.data).toBeNull();
    expect(response.error.code).toBe('NOT_FOUND');
    expect(response.error.message).toBe('Resource not found');
  });

  it('ApiResult discriminated union narrows on error field', () => {
    const success: ApiResult<string> = { data: 'hello', error: null };
    const failure: ApiResult<string> = {
      data: null,
      error: { code: 'ERR', message: 'fail' },
    };

    if (success.error === null) {
      expect(success.data).toBe('hello');
    }
    if (failure.error !== null) {
      expect(failure.error.code).toBe('ERR');
    }
  });
});
