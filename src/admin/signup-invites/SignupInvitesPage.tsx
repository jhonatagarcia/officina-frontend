import { useState, type FormEvent } from 'react';
import { Copy, Link2, UserPlus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TopBar } from '@/admin/components/TopBar';
import {
  useCreateSignupInvite,
  useRevokeSignupInvite,
  useSignupInvites,
  type CreatedSignupInvite,
  type SignupInviteStatus,
} from '@/admin/signup-invites/useSignupInvites';

const statusLabels: Record<SignupInviteStatus, string> = {
  ACTIVE: 'Ativo',
  USED: 'Utilizado',
  REVOKED: 'Revogado',
  EXPIRED: 'Expirado',
};

export default function SignupInvitesPage() {
  const [email, setEmail] = useState('');
  const [created, setCreated] = useState<CreatedSignupInvite | null>(null);
  const invites = useSignupInvites();
  const createInvite = useCreateSignupInvite();
  const revokeInvite = useRevokeSignupInvite();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createInvite
      .mutateAsync(email.trim())
      .then((invite) => {
        setCreated(invite);
        setEmail('');
        toast.success(
          'Convite criado. O link será exibido somente nesta sessão.',
        );
      })
      .catch((error: { message?: string }) =>
        toast.error(error.message ?? 'Não foi possível criar o convite.'),
      );
  }

  async function copyInvite() {
    if (!created) return;
    await navigator.clipboard.writeText(created.inviteUrl);
    toast.success('Link copiado. Envie-o somente ao destinatário informado.');
  }

  return (
    <>
      <TopBar title="Convites de acesso" />
      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-pad">
            <strong>Convidar novo negócio</strong>
            <p className="admin-muted">
              O convite é individual, vinculado ao e-mail, expira e só pode ser
              utilizado uma vez.
            </p>
            <form className="admin-controls" onSubmit={submit}>
              <input
                className="admin-input"
                aria-label="E-mail do convite"
                autoComplete="email"
                disabled={createInvite.isPending}
                placeholder="responsavel@negocio.com.br"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button
                className="admin-button"
                disabled={createInvite.isPending}
                type="submit"
              >
                <UserPlus size={14} />{' '}
                {createInvite.isPending ? 'Criando...' : 'Criar convite'}
              </button>
            </form>
          </div>
          {created ? (
            <div
              className="admin-card-pad"
              style={{ borderTop: '1px solid #303244' }}
            >
              <strong>Link temporário criado para {created.email}</strong>
              <p className="admin-muted">
                Este token não voltará a aparecer na listagem.
              </p>
              <div className="admin-controls">
                <input
                  className="admin-input"
                  readOnly
                  value={created.inviteUrl}
                />
                <button
                  className="admin-button secondary"
                  type="button"
                  onClick={copyInvite}
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="admin-card">
          <div className="admin-card-pad">
            <strong>Histórico de convites</strong>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>E-mail</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Expira em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {invites.isLoading ? (
                <tr>
                  <td colSpan={5}>Carregando...</td>
                </tr>
              ) : null}
              {invites.data?.map((invite) => (
                <tr key={invite.id}>
                  <td>
                    <Link2 size={14} /> {invite.email}
                  </td>
                  <td>
                    <span
                      className={`admin-pill ${invite.status === 'ACTIVE' ? 'green' : ''}`}
                    >
                      {statusLabels[invite.status]}
                    </span>
                  </td>
                  <td>{formatDate(invite.createdAt)}</td>
                  <td>{formatDate(invite.expiresAt)}</td>
                  <td>
                    {invite.status === 'ACTIVE' ? (
                      <button
                        className="admin-button danger"
                        disabled={revokeInvite.isPending}
                        type="button"
                        onClick={() => revokeInvite.mutate(invite.id)}
                      >
                        <XCircle size={14} /> Revogar
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!invites.isLoading && invites.data?.length === 0 ? (
                <tr>
                  <td colSpan={5}>Nenhum convite criado.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
