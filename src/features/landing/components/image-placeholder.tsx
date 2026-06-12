import { Image as ImageIcon } from 'lucide-react';

interface ImagePlaceholderProps {
  label?: string;
  /** Valor CSS de aspect-ratio do slot (padrão 16 / 10). */
  aspectRatio?: string;
}

/** Skeleton elegante exibido em slots cuja imagem ainda não foi definida no manifest. */
export function ImagePlaceholder({ label, aspectRatio }: ImagePlaceholderProps) {
  return (
    <div
      className="img-placeholder"
      style={aspectRatio ? { aspectRatio } : undefined}
      role="img"
      aria-label={label ?? 'Imagem em breve'}
    >
      <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
      {label ? <span>{label}</span> : null}
    </div>
  );
}
