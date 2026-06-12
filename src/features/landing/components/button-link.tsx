type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
};

export function ButtonLink({ href, children, variant = 'primary', onClick }: ButtonLinkProps) {
  return (
    <a
      className={`button-link button-link--${variant}`}
      href={href}
      onClick={onClick}
    >
      {children}
    </a>
  );
}
