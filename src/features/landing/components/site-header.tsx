import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { brand } from '../content';
import { useScrollShadow } from '../hooks/use-scroll-shadow';
import { ButtonLink } from './button-link';
import { LoginModal } from './login-modal';
import { RegisterWorkshopDialog } from '@/features/auth/components/register-workshop-dialog';

const navItems = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  // TODO(WhatsApp Cloud API): restaurar o link quando a secao voltar a landing page.
  // { label: 'WhatsApp', href: '#whatsapp' },
  { label: 'Produto', href: '#produto' },
  { label: 'Planos', href: '#planos' },
];

export function SiteHeader() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const scrolled = useScrollShadow();

  function openRegister() {
    setLoginOpen(false);
    setRegisterOpen(true);
  }

  return (
    <>
      <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
        <nav className="site-header__inner" aria-label="Navegação principal">
          <a className="brand-mark" href="#top" aria-label="AutoPro System início">
            <span><Wrench size={18} strokeWidth={2} /></span>
            <strong>{brand.name}</strong>
          </a>
          <div className="site-header__links">
            {navItems.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
          <div className="site-header__actions">
            <button
              className="btn-header-login"
              type="button"
              onClick={() => setLoginOpen(true)}
            >
              Fazer Login
            </button>
            <ButtonLink href="#planos" variant="primary">
              Começar grátis
            </ButtonLink>
          </div>
        </nav>
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onRegisterClick={openRegister} />
      <RegisterWorkshopDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
      />
    </>
  );
}
