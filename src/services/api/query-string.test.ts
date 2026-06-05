import { buildQueryParams } from '@/services/api/query-string';

describe('buildQueryParams', () => {
  it('should keep active=false in query params', () => {
    expect(
      buildQueryParams({
        page: 1,
        pageSize: 10,
        active: false,
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      active: 'false',
    });
  });

  it('should keep active=true in query params', () => {
    expect(
      buildQueryParams({
        page: 1,
        pageSize: 10,
        active: true,
      }),
    ).toEqual({
      page: 1,
      limit: 10,
      active: 'true',
    });
  });

  it('should keep status and type filters in query params', () => {
    expect(
      buildQueryParams({
        page: 2,
        pageSize: 20,
        status: 'REPROVADO',
        type: 'RECEIVABLE',
      }),
    ).toEqual({
      page: 2,
      limit: 20,
      status: 'REPROVADO',
      type: 'RECEIVABLE',
    });
  });
});
