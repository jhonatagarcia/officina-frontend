import type { ReactNode } from 'react';
import { useInView } from '../hooks/use-in-view';

interface RevealProps {
  children: ReactNode;
  /** Atraso da entrada em ms, para escalonar elementos vizinhos. */
  delay?: number;
  className?: string;
}

/** Wrapper de animação fade-up ao entrar no viewport. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={`fade-up${inView ? ' visible' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
