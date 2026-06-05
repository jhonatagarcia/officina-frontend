import { useState } from 'react';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';

export function useListParams() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const updateStatus = (value: string) => {
    setStatus(value);
    setPage(1);
  };
  const updateType = (value: string) => {
    setType(value);
    setPage(1);
  };

  return {
    page,
    pageSize,
    search,
    status,
    type,
    setPage,
    setSearch: updateSearch,
    setStatus: updateStatus,
    setType: updateType,
  };
}
