import { FormEvent, useState } from 'react';
import type { Tenant } from './useTenants';

export function PilotWorkshopModal({
  tenant,
  pending,
  onCancel,
  onConfirm,
}: {
  tenant: Tenant;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const normalizedReason = reason.trim();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedReason.length < 8 || pending) return;
    onConfirm(normalizedReason);
  }

  return (
    <div className="admin-modal-backdrop">
      <form className="admin-modal" style={{ maxWidth: 500 }} onSubmit={submit}>
        <div className="admin-modal-header">
          <strong>Definir oficina piloto</strong>
        </div>
        <div className="admin-card-pad">
          <p className="admin-muted" style={{ marginTop: 0 }}>
            <strong>{tenant.name}</strong> terá acesso permanente sem cobrança. Esta ação é
            auditada e não pode ser desfeita pelo painel.
          </p>
          <div className="admin-field">
            <label htmlFor="pilot-reason">Justificativa</label>
            <textarea
              id="pilot-reason"
              className="admin-input"
              rows={4}
              maxLength={240}
              placeholder="Ex.: Oficina parceira do programa piloto"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              autoFocus
            />
            <span className="admin-muted">Informe de 8 a 240 caracteres.</span>
          </div>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="admin-button"
            type="submit"
            disabled={pending || normalizedReason.length < 8}
          >
            {pending ? 'Processando...' : 'Confirmar oficina piloto'}
          </button>
        </div>
      </form>
    </div>
  );
}
