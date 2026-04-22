import { useState } from 'react';

export function useListParams() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
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
