import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { vi } from 'vitest';
import { BudgetItemsEditor } from '@/features/budgets/components/budget-items-editor';
import type { BudgetSchema } from '@/features/budgets/schemas/budget-schema';
import { renderWithProviders } from '@/test/render-with-providers';

vi.mock('@/features/reference-data/hooks/use-service-options', () => ({
  useServiceOptions: () => ({
    isLoading: false,
    data: [
      {
        value: 'service-1',
        label: 'Troca de óleo',
        code: 'SRV-001',
        description: 'Troca de óleo do motor',
        suggestedTotalPrice: 120,
      },
      {
        value: 'service-2',
        label: 'Alinhamento',
        code: 'SRV-002',
        description: 'Alinhamento completo',
        suggestedTotalPrice: 90,
      },
    ],
  }),
}));

vi.mock('@/features/reference-data/hooks/use-inventory-options', () => ({
  useInventoryOptions: () => ({
    isLoading: false,
    data: [
      {
        value: 'inventory-1',
        label: 'Filtro de óleo',
        name: 'Filtro de óleo',
        internalCode: 'FO-001',
        salePrice: 35,
      },
      {
        value: 'inventory-2',
        label: 'Correia dentada',
        name: 'Correia dentada',
        internalCode: 'CD-001',
        salePrice: 80,
      },
    ],
  }),
}));

const defaultValues: BudgetSchema = {
  clientId: 'client-1',
  vehicleId: 'vehicle-1',
  problemDescription: 'Revisao',
  notes: '',
  discount: 0,
  items: [
    {
      type: 'LABOR',
      serviceCatalogItemId: '',
      inventoryItemId: '',
      serviceCode: '',
      description: '',
      quantity: 1,
      unitPrice: 1,
    },
  ],
};

function BudgetItemsEditorTestHarness({
  readOnly = false,
  initialValues = defaultValues,
}: {
  readOnly?: boolean;
  initialValues?: BudgetSchema;
}) {
  const form = useForm<BudgetSchema>({
    defaultValues: initialValues,
  });
  const fieldArray = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const items = form.watch('items');

  return <BudgetItemsEditor fieldArray={fieldArray} form={form} items={items} readOnly={readOnly} />;
}

async function selectOption(triggerName: RegExp, optionName: RegExp) {
  fireEvent.click(screen.getByRole('combobox', { name: triggerName }));
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
}

describe('BudgetItemsEditor', () => {
  it('sincroniza servico selecionado com codigo, descricao, preco e subtotal', async () => {
    renderWithProviders(<BudgetItemsEditorTestHarness />);

    await selectOption(/serviço/i, /troca de óleo/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/código/i)).toHaveValue('SRV-001');
      expect(screen.getByLabelText(/valor unitário/i)).toHaveValue('R$\u00a0120,00');
      expect(screen.getByText('Subtotal:', { exact: false })).toHaveTextContent(/R\$\s120,00/);
    });
  });

  it('soma servico e peca no item composto e limpa peca ao voltar para mao de obra', async () => {
    renderWithProviders(<BudgetItemsEditorTestHarness />);

    await selectOption(/tipo/i, /mão de obra \+ peça/i);
    await selectOption(/serviço/i, /troca de óleo/i);
    await selectOption(/peça ou produto/i, /filtro de óleo/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/código$/i)).toHaveValue('SRV-001');
      expect(screen.getByLabelText(/código da peça/i)).toHaveValue('FO-001');
      expect(screen.getByLabelText(/valor unitário/i)).toHaveValue('R$\u00a0155,00');
      expect(screen.getByText('Subtotal:', { exact: false })).toHaveTextContent(/R\$\s155,00/);
    });

    await selectOption(/tipo/i, /^mão de obra$/i);

    await waitFor(() => {
      expect(screen.queryByLabelText(/código da peça/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/valor unitário/i)).toHaveValue('R$\u00a0155,00');
    });
  });

  it('adiciona e remove itens mantendo os controles principais', async () => {
    renderWithProviders(<BudgetItemsEditorTestHarness />);

    fireEvent.click(screen.getByRole('button', { name: /adicionar item/i }));

    expect(screen.getAllByRole('combobox', { name: /tipo/i })).toHaveLength(2);
    expect(screen.getAllByText(/subtotal:/i)).toHaveLength(2);

    const removeButtons = screen.getAllByRole('button', { name: /remover/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByRole('combobox', { name: /tipo/i })).toHaveLength(1);
    });
  });

  it('respeita modo somente leitura', () => {
    renderWithProviders(
      <BudgetItemsEditorTestHarness
        readOnly
        initialValues={{
          ...defaultValues,
          items: [
            {
              type: 'LABOR',
              serviceCatalogItemId: 'service-1',
              inventoryItemId: '',
              serviceCode: 'SRV-001',
              description: 'Troca de óleo do motor',
              quantity: 2,
              unitPrice: 120,
            },
          ],
        }}
      />,
    );

    const editor = screen.getByText('Itens do orçamento').closest('div')?.parentElement;

    expect(screen.queryByRole('button', { name: /adicionar item/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover/i })).not.toBeInTheDocument();
    expect(within(editor as HTMLElement).getByRole('combobox', { name: /tipo/i })).toBeDisabled();
    expect(screen.getByLabelText(/quantidade/i)).toBeDisabled();
    expect(screen.getByLabelText(/valor unitário/i)).toBeDisabled();
  });
});
