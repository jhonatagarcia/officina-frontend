export function ConfirmModal({
  title,
  description,
  confirmLabel,
  danger,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-modal" style={{ maxWidth: 430 }}>
        <div className="admin-card-pad">
          <strong>{title}</strong>
          <p className="admin-muted" style={{ marginTop: 12 }}>{description}</p>
        </div>
        <div className="admin-modal-footer">
          <button className="admin-button secondary" type="button" onClick={onCancel}>Cancelar</button>
          <button className={`admin-button ${danger ? 'danger' : ''}`} type="button" onClick={onConfirm} disabled={pending}>
            {pending ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
