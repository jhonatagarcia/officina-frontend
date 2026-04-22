import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
