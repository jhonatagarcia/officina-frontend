import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { vi } from 'vitest';
import { InventoryItemForm } from '@/features/inventory/components/inventory-item-form';
import type { InventoryItemSchema } from '@/features/inventory/schemas/inventory-item-schema';
import { renderWithProviders } from '@/test/render-with-providers';

const defaultValues: InventoryItemSchema = {
  name: '',
  category: '',
  supplier: '',
  quantity: 0,
  minimumQuantity: 0,
  cost: 0,
  salePrice: 0,
};

function InventoryItemFormTestHarness({
  mode = 'create',
  isPending = false,
  onSubmit = vi.fn(),
}: {
  mode?: 'create' | 'edit';
  isPending?: boolean;
  onSubmit?: (values: InventoryItemSchema) => void;
}) {
  const form = useForm<InventoryItemSchema>({
    defaultValues,
  });

  return (
    <InventoryItemForm
      form={form}
      mode={mode}
      internalCode="INT-001"
      isPending={isPending}
      onSubmit={onSubmit}
    />
  );
}

describe('InventoryItemForm', () => {
  it('formata valores monetarios e envia os dados preenchidos', async () => {
    const onSubmit = vi.fn();

    renderWithProviders(<InventoryItemFormTestHarness onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/nome da peça/i), { target: { value: 'filtro de oleo' } });
    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: 'lubrificacao' } });
    fireEvent.change(screen.getByLabelText(/fornecedor/i), { target: { value: 'auto pecas' } });
    fireEvent.change(screen.getByLabelText(/quantidade atual/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/estoque mínimo/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/custo/i), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText(/preço de venda/i), { target: { value: '2500' } });

    expect(screen.getByLabelText(/nome da peça/i)).toHaveValue('Filtro De Oleo');
    expect(screen.getByLabelText(/categoria/i)).toHaveValue('Lubrificacao');
    expect(screen.getByLabelText(/fornecedor/i)).toHaveValue('Auto Pecas');
    expect(screen.getByLabelText(/custo/i)).toHaveValue('R$\u00a012,34');
    expect(screen.getByLabelText(/preço de venda/i)).toHaveValue('R$\u00a025,00');

    fireEvent.click(screen.getByRole('button', { name: /^salvar$/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({
        name: 'Filtro De Oleo',
        category: 'Lubrificacao',
        supplier: 'Auto Pecas',
        quantity: '5',
        minimumQuantity: '2',
        cost: 12.34,
        salePrice: 25,
      });
  });

  it('exibe codigo interno no modo edicao', () => {
    renderWithProviders(<InventoryItemFormTestHarness mode="edit" />);

    expect(screen.getByLabelText(/^id$/i)).toHaveValue('INT-001');
  });

  it('mostra estado de salvamento no botao principal', () => {
    renderWithProviders(<InventoryItemFormTestHarness isPending />);

    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled();
  });
});
