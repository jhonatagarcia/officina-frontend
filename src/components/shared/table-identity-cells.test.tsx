import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VehicleIdentityCell } from '@/components/shared/table-identity-cells';

describe('VehicleIdentityCell', () => {
  it('mostra modelo e placa abaixo com mascara', () => {
    render(<VehicleIdentityCell plate="ABC1234" description="Fiat Uno" />);

    expect(screen.getByText('Fiat Uno')).toBeInTheDocument();
    expect(screen.getByText('ABC-1234')).toBeInTheDocument();
  });

  it('separa fallback antigo com hifen sem perder a placa', () => {
    render(<VehicleIdentityCell fallback="ABC1234 - Fiat Uno" />);

    expect(screen.getByText('Fiat Uno')).toBeInTheDocument();
    expect(screen.getByText('ABC-1234')).toBeInTheDocument();
  });
});
