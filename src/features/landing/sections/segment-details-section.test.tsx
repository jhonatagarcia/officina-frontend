import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SegmentDetailsSection } from './segment-details-section';

describe('SegmentDetailsSection', () => {
  it('amplia a imagem e fecha ao clicar fora dela', async () => {
    render(<SegmentDetailsSection />);

    fireEvent.click(
      screen.getAllByRole('button', { name: /ampliar imagem/i })[0]!,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const overlay = document.querySelector<HTMLElement>(
      '.landing-image-dialog-overlay',
    );
    expect(overlay).not.toBeNull();

    if (!overlay) {
      throw new Error('A sobreposição do modal não foi renderizada.');
    }

    fireEvent.click(overlay);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
