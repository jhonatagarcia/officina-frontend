import { FormEvent, useState } from 'react';
import type { Tenant, TenantPayload } from './useTenants';

const emptyTenant: TenantPayload = {
  name: '',
  ownerName: '',
  email: '',
  phone: '',
  cnpj: '',
  state: '',
  plan: 'TRIAL',
  type: 'MECANICA',
  notes: '',
};

export function TenantModal({
  tenant,
  pending,
  onClose,
  onSave,
}: {
  tenant?: Tenant | null;
  pending: boolean;
  onClose: () => void;
  onSave: (payload: TenantPayload) => void;
}) {
  const [form, setForm] = useState<TenantPayload>(
    tenant
      ? {
          name: tenant.name,
          ownerName: tenant.ownerName ?? '',
          email: tenant.email ?? '',
          phone: tenant.phone ?? '',
          cnpj: tenant.cnpj ?? '',
          state: tenant.state ?? '',
          plan: tenant.plan,
          type: tenant.type ?? 'MECANICA',
          notes: tenant.notes ?? '',
        }
      : emptyTenant,
  );

  function update<K extends keyof TenantPayload>(key: K, value: TenantPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave(form);
  }

  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal" onSubmit={submit}>
        <div className="admin-modal-header">
          <strong>{tenant ? 'Editar negócio' : 'Novo negócio'}</strong>
          <button className="admin-button secondary" type="button" onClick={onClose}>×</button>
        </div>
        <div className="admin-form-grid">
          <Field label="Nome do negócio *" value={form.name} onChange={(value) => update('name', value)} required />
          <Field label="Nome do Responsavel *" value={form.ownerName} onChange={(value) => update('ownerName', value)} required />
          <Field label="E-mail *" type="email" value={form.email} onChange={(value) => update('email', value)} required />
          <Field label="Telefone" value={form.phone ?? ''} onChange={(value) => update('phone', value)} />
          <Field label="CNPJ" value={form.cnpj ?? ''} onChange={(value) => update('cnpj', value)} />
          <div className="admin-field">
            <label>Plano *</label>
            <select className="admin-select" value={form.plan} onChange={(event) => update('plan', event.target.value as TenantPayload['plan'])}>
              <option value="TRIAL">Teste gratuito</option>
              <option value="BASIC">Basico - R$99/mes</option>
              <option value="PRO">Profissional - R$199/mes</option>
              <option value="ENTERPRISE">Empresarial - R$399/mes</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Tipo *</label>
            <select className="admin-select" value={form.type} onChange={(event) => update('type', event.target.value as TenantPayload['type'])}>
              <option value="MECANICA">Mecanica</option>
              <option value="FUNILARIA">Funilaria</option>
              <option value="AMBOS">Ambos</option>
            </select>
          </div>
          <div className="admin-field full">
            <label>Observacoes</label>
            <input className="admin-input" value={form.notes ?? ''} onChange={(event) => update('notes', event.target.value)} />
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button secondary" type="button" onClick={onClose}>Cancelar</button>
          <button className="admin-button" type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <input className="admin-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
    </div>
  );
}
