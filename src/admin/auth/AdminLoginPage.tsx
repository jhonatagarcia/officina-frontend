import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { http } from '@/services/api/http';
import type { AuthSession } from '@/types/auth';
import { useAdminAuth } from './useAdminAuth';
import '../admin.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAdminAuth((state) => state.login);
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () =>
      http
        .post<AuthSession>('/auth/login', { email, password })
        .then((response) => response.data),
    onSuccess: ({ accessToken, user }) => {
      if (user.role !== 'ADMIN') {
        toast.error('Usuário sem permissão de administrador');
        return;
      }

      login(accessToken);
      navigate('/admin/dashboard', { replace: true });
    },
    onError: () => toast.error('Credenciais invalidas'),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <main className="admin-shell" style={{ gridTemplateColumns: '1fr' }}>
      <section className="admin-modal-backdrop" style={{ background: '#090a12' }}>
        <form className="admin-modal" onSubmit={handleSubmit}>
          <div className="admin-modal-header">
            <div>
              <strong style={{ color: '#ff7425' }}>AutoPro</strong>
              <div className="admin-muted">Acesso Administrador Master</div>
            </div>
          </div>
          <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="admin-field">
              <label htmlFor="admin-email">E-mail</label>
              <input
                id="admin-email"
                className="admin-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Senha</label>
              <input
                id="admin-password"
                className="admin-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
          </div>
          <div className="admin-modal-footer">
            <button className="admin-button" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
