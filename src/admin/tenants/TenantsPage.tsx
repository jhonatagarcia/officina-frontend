import { BadgeCheck, Edit, PauseCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TopBar } from '../components/TopBar';
import { planLabel, tenantStatusLabel } from '../lib/labels';
import { ConfirmModal } from './ConfirmModal';
import { PilotWorkshopModal } from './PilotWorkshopModal';
import { TenantModal } from './TenantModal';
import {
  Tenant,
  TenantPayload,
  useCreateTenant,
  useDeleteTenant,
  useInactivateTenant,
  useReactivateTenant,
  useSetPilotWorkshop,
  useTenants,
  useUpdateTenant,
} from './useTenants';

type ConfirmState = { type: 'inactivate' | 'reactivate' | 'delete'; tenant: Tenant } | null;

export default function TenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [editing, setEditing] = useState<Tenant | null | undefined>();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [pilotTenant, setPilotTenant] = useState<Tenant | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);
  const tenants = useTenants({ search: debouncedSearch, status, plan });
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const inactivate = useInactivateTenant();
  const reactivate = useReactivateTenant();
  const remove = useDeleteTenant();
  const setPilot = useSetPilotWorkshop();
  const pending = createTenant.isPending || updateTenant.isPending;

  function saveTenant(payload: TenantPayload) {
    const mutation = editing
      ? updateTenant.mutateAsync({ id: editing.id, data: payload })
      : createTenant.mutateAsync(payload);

    mutation
      .then(() => {
        toast.success(editing ? 'Negócio atualizado' : 'Negócio criado');
        setEditing(undefined);
      })
      .catch((error: { message?: string }) => toast.error(error.message ?? 'Nao foi possivel salvar'));
  }

  function runConfirm() {
    if (!confirm) return;
    const action =
      confirm.type === 'inactivate'
        ? inactivate.mutateAsync(confirm.tenant.id)
        : confirm.type === 'reactivate'
          ? reactivate.mutateAsync(confirm.tenant.id)
          : remove.mutateAsync(confirm.tenant.id);

    action
      .then(() => {
        toast.success('Acao concluida');
        setConfirm(null);
      })
      .catch((error: { message?: string }) => toast.error(error.message ?? 'Nao foi possivel concluir'));
  }

  function confirmPilot(reason: string) {
    if (!pilotTenant) return;
    setPilot
      .mutateAsync({ id: pilotTenant.id, reason })
      .then(() => {
        toast.success('Oficina definida como piloto permanente');
        setPilotTenant(null);
      })
      .catch((error: { message?: string }) =>
        toast.error(error.message ?? 'Nao foi possivel definir a oficina piloto'),
      );
  }

  return (
    <>
      <TopBar title="Negócios" />
      <section className="admin-content">
        <div className="admin-card">
          <div className="admin-card-pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>Negócios cadastrados</strong>
              <span className="admin-pill" style={{ marginLeft: 10 }}>{tenants.data?.meta.total ?? 0} total</span>
            </div>
            <button className="admin-button" type="button" onClick={() => setEditing(null)}>
              <Plus size={14} /> Novo negócio
            </button>
          </div>
          <div className="admin-card-pad admin-controls" style={{ borderTop: '1px solid #303244' }}>
            <input className="admin-input" placeholder="Buscar por nome ou email..." value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos os status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="TRIALING">Em teste</option>
              <option value="PAST_DUE">Em atraso</option>
              <option value="SUSPENDED">Suspenso</option>
              <option value="CANCELED">Cancelado</option>
              <option value="EXPIRED">Expirado</option>
              <option value="PILOT">Piloto</option>
              <option value="LEGACY_FREE">Legado gratuito</option>
              <option value="UNASSIGNED">Sem assinatura</option>
              <option value="INACTIVE">Inativo</option>
            </select>
            <select className="admin-select" value={plan} onChange={(event) => setPlan(event.target.value)}>
              <option value="">Todos os planos</option>
              <option value="ESSENTIAL">Essencial</option>
              <option value="PROFESSIONAL">Profissional</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="TRIALING">Período gratuito</option>
              <option value="PILOT">Oficina piloto</option>
              <option value="LEGACY_FREE">Legado gratuito</option>
              <option value="UNASSIGNED">Sem assinatura</option>
            </select>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Meu Negócio</th>
                <th>Responsavel</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Valor do plano</th>
                <th>Cadastro</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {tenants.isLoading ? (
                <tr><td colSpan={7}>Carregando...</td></tr>
              ) : (
                tenants.data?.data.map((tenant) => (
                  <tr key={tenant.id}>
                    <td><strong>{tenant.name}</strong><br /><span className="admin-muted">{tenant.email}</span></td>
                    <td>{tenant.ownerName}</td>
                    <td><PlanPill plan={tenant.plan} /></td>
                    <td><StatusPill status={tenant.status} /></td>
                    <td className="admin-positive">{planValue(tenant.planAmount)}</td>
                    <td>{formatDate(tenant.createdAt)}</td>
                    <td>
                      {tenant.status !== 'PILOT' ? (
                        <>
                          <button
                            className="admin-button secondary"
                            type="button"
                            aria-label={`Definir ${tenant.name} como oficina piloto`}
                            title="Definir como oficina piloto"
                            onClick={() => setPilotTenant(tenant)}
                          >
                            <BadgeCheck size={14} />
                          </button>{' '}
                        </>
                      ) : null}
                      <button className="admin-button secondary" type="button" onClick={() => setEditing(tenant)}><Edit size={14} /></button>{' '}
                      <button className="admin-button secondary" type="button" onClick={() => setConfirm({ type: tenant.status === 'INACTIVE' ? 'reactivate' : 'inactivate', tenant })}>
                        {tenant.status === 'INACTIVE' ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                      </button>{' '}
                      <button className="admin-button danger" type="button" onClick={() => setConfirm({ type: 'delete', tenant })}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      {editing !== undefined ? (
        <TenantModal tenant={editing} pending={pending} onClose={() => setEditing(undefined)} onSave={saveTenant} />
      ) : null}
      {confirm ? (
        <ConfirmModal
          title={confirm.type === 'delete' ? 'Excluir negócio?' : confirm.type === 'reactivate' ? 'Reativar negócio?' : 'Inativar negócio?'}
          description={`O negócio ${confirm.tenant.name} sera atualizado.`}
          confirmLabel={confirm.type === 'delete' ? 'Excluir' : 'Confirmar'}
          danger={confirm.type === 'delete'}
          pending={inactivate.isPending || reactivate.isPending || remove.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={runConfirm}
        />
      ) : null}
      {pilotTenant ? (
        <PilotWorkshopModal
          tenant={pilotTenant}
          pending={setPilot.isPending}
          onCancel={() => setPilotTenant(null)}
          onConfirm={confirmPilot}
        />
      ) : null}
    </>
  );
}

function PlanPill({ plan }: { plan: Tenant['plan'] }) {
  const color = plan === 'PROFESSIONAL' ? 'blue' : plan === 'TRIALING' ? 'yellow' : '';
  return <span className={`admin-pill ${color}`}>{planLabel(plan)}</span>;
}

function StatusPill({ status }: { status: Tenant['status'] }) {
  const color = status === 'ACTIVE' || status === 'PILOT' ? 'green' : status === 'TRIALING' ? 'blue' : '';
  return <span className={`admin-pill ${color}`}>{tenantStatusLabel(status)}</span>;
}

function planValue(amount?: number | null) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
