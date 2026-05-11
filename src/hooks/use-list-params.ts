import { useState } from 'react';
import { DEFAULT_TABLE_PAGE_SIZE } from '@/constants/pagination';

export function useListParams() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  return {
    page,
    pageSize,
    search,
    status,
    type,
    setPage,
    setSearch,
    setStatus,
    setType,
  };
}
