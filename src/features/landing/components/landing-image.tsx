import type { LandingImageAsset } from '../assets/images';
import { ImagePlaceholder } from './image-placeholder';

interface LandingImageProps {
  image: LandingImageAsset;
  className?: string;
  /** Carrega com prioridade (apenas para a primeira imagem do hero). */
  eager?: boolean;
}

/** Renderiza uma imagem do manifest, com fallback automático para placeholder. */
export function LandingImage({ image, className, eager = false }: LandingImageProps) {
  if (!image.src) {
    return <ImagePlaceholder label={image.alt} />;
  }

  return (
    <img
      src={image.src}
      alt={image.alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding={eager ? 'sync' : 'async'}
    />
  );
}
