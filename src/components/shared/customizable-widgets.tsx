import { useEffect, useMemo, useState, type DragEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { GripVertical, Plus, RotateCcw, Settings2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SummaryCard } from '@/components/shared/summary-card';
import { cn } from '@/lib/utils';

export interface CustomizableSummaryCardOption {
  id: string;
  title: string;
  value: string;
  icon?: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  mediaClassName?: string;
  valueClassName?: string;
  size?: 'default' | 'compact';
}

export interface CustomizableWidgetOption {
  id: string;
  title: string;
  category?: string;
  className?: string;
  render: () => ReactNode;
}

interface CustomizableSummaryCardsProps {
  storageKey: string;
  cards: CustomizableSummaryCardOption[];
  defaultVisibleIds: string[];
  gridClassName?: string;
}

interface CustomizableWidgetGridProps {
  storageKey: string;
  widgets: CustomizableWidgetOption[];
  defaultVisibleIds: string[];
  gridClassName?: string;
  emptyMessage?: string;
}

function readStoredIds(storageKey: string) {
  if (typeof window === 'undefined') return null;

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) return null;

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) && parsedValue.every((item) => typeof item === 'string')
      ? parsedValue
      : null;
  } catch {
    return null;
  }
}

function writeStoredIds(storageKey: string, ids: string[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch {
    // localStorage can be unavailable in private browsing or restricted environments.
  }
}

function sanitizeVisibleIds(ids: string[], availableIds: string[]) {
  return ids.filter((id, index) => availableIds.includes(id) && ids.indexOf(id) === index);
}

function areSameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function useVisibleWidgetIds(storageKey: string, availableIds: string[], defaultVisibleIds: string[]) {
  const availableIdsKey = availableIds.join('|');
  const defaultVisibleIdsKey = defaultVisibleIds.join('|');
  const [visibleIds, setVisibleIds] = useState<string[]>(() =>
    sanitizeVisibleIds(readStoredIds(storageKey) ?? defaultVisibleIds, availableIds),
  );

  useEffect(() => {
    const nextVisibleIds = sanitizeVisibleIds(readStoredIds(storageKey) ?? defaultVisibleIds, availableIds);
    setVisibleIds((currentVisibleIds) => (areSameIds(currentVisibleIds, nextVisibleIds) ? currentVisibleIds : nextVisibleIds));
  }, [storageKey, availableIdsKey, defaultVisibleIdsKey, availableIds, defaultVisibleIds]);

  const updateVisibleIds = (nextIds: string[]) => {
    const sanitizedIds = sanitizeVisibleIds(nextIds, availableIds);
    setVisibleIds(sanitizedIds);
    writeStoredIds(storageKey, sanitizedIds);
  };

  return {
    visibleIds,
    addVisibleId: (id: string) => updateVisibleIds([...visibleIds, id]),
    removeVisibleId: (id: string) => updateVisibleIds(visibleIds.filter((visibleId) => visibleId !== id)),
    moveVisibleId: (draggedId: string, targetId: string) => {
      if (draggedId === targetId) return;

      const draggedIndex = visibleIds.indexOf(draggedId);
      const targetIndex = visibleIds.indexOf(targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const nextVisibleIds = [...visibleIds];
      const [draggedItem] = nextVisibleIds.splice(draggedIndex, 1);
      nextVisibleIds.splice(targetIndex, 0, draggedItem);
      updateVisibleIds(nextVisibleIds);
    },
    resetVisibleIds: () => updateVisibleIds(defaultVisibleIds),
  };
}

function WidgetControls({
  availableItems,
  visibleIds,
  onAdd,
  onRemove,
  onReset,
}: {
  availableItems: Array<{ id: string; title: string; category?: string }>;
  visibleIds: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onReset: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Adicionar ou remover</p>
            <p className="text-xs text-muted-foreground">A escolha fica salva neste navegador.</p>
          </div>
          <Button size="sm" variant="outline" type="button" onClick={onReset}>
            <RotateCcw className="size-4" />
            Restaurar padrão
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {availableItems.map((item) => {
            const isVisible = visibleIds.includes(item.id);

            return (
              <div key={item.id} className="flex min-h-14 items-center justify-between gap-3 rounded-xl border bg-white/70 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.category ? <p className="text-xs text-muted-foreground">{item.category}</p> : null}
                </div>
                <Button
                  aria-label={isVisible ? `Remover ${item.title}` : `Adicionar ${item.title}`}
                  size="icon"
                  type="button"
                  variant={isVisible ? 'outline' : 'secondary'}
                  onClick={() => (isVisible ? onRemove(item.id) : onAdd(item.id))}
                >
                  {isVisible ? <X className="size-4" /> : <Plus className="size-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function CustomizableSummaryCards({
  storageKey,
  cards,
  defaultVisibleIds,
  gridClassName = 'grid gap-4 md:grid-cols-2 xl:grid-cols-4',
}: CustomizableSummaryCardsProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const availableIds = useMemo(() => cards.map((card) => card.id), [cards]);
  const { visibleIds, addVisibleId, removeVisibleId, resetVisibleIds } = useVisibleWidgetIds(
    storageKey,
    availableIds,
    defaultVisibleIds,
  );
  const visibleCards = visibleIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card): card is CustomizableSummaryCardOption => Boolean(card));

  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsConfiguring((current) => !current)}>
          <Settings2 className="size-4" />
          Personalizar cards
        </Button>
      </div>
      {isConfiguring ? (
        <WidgetControls
          availableItems={cards}
          visibleIds={visibleIds}
          onAdd={addVisibleId}
          onRemove={removeVisibleId}
          onReset={resetVisibleIds}
        />
      ) : null}
      {visibleCards.length ? (
        <div className={gridClassName}>
          {visibleCards.map((card) => (
            <div key={card.id} className="relative">
              <SummaryCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                imageSrc={card.imageSrc}
                imageAlt={card.imageAlt}
                mediaClassName={card.mediaClassName}
                valueClassName={card.valueClassName}
                size={card.size}
              />
              {isConfiguring ? (
                <Button
                  aria-label={`Remover ${card.title}`}
                  className="absolute right-3 top-3 size-8 bg-white/90"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => removeVisibleId(card.id)}
                >
                  <X className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-24 items-center justify-center p-6 text-sm text-muted-foreground">
            Nenhum card ativo.
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export function CustomizableWidgetGrid({
  storageKey,
  widgets,
  defaultVisibleIds,
  gridClassName = 'grid gap-4 md:grid-cols-2 xl:grid-cols-4',
  emptyMessage = 'Nenhum widget ativo.',
}: CustomizableWidgetGridProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const availableIds = useMemo(() => widgets.map((widget) => widget.id), [widgets]);
  const { visibleIds, addVisibleId, removeVisibleId, moveVisibleId, resetVisibleIds } = useVisibleWidgetIds(
    storageKey,
    availableIds,
    defaultVisibleIds,
  );
  const visibleWidgets = visibleIds
    .map((id) => widgets.find((widget) => widget.id === id))
    .filter((widget): widget is CustomizableWidgetOption => Boolean(widget));
  const clearDragState = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };
  const handleDragStart = (event: DragEvent<HTMLDivElement>, widgetId: string) => {
    if (!isConfiguring) return;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', widgetId);
    setDraggedWidgetId(widgetId);
  };
  const handleDragOver = (event: DragEvent<HTMLDivElement>, widgetId: string) => {
    if (!isConfiguring || draggedWidgetId === widgetId) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverWidgetId(widgetId);
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>, widgetId: string) => {
    event.preventDefault();

    const sourceWidgetId = draggedWidgetId ?? event.dataTransfer.getData('text/plain');
    if (sourceWidgetId) {
      moveVisibleId(sourceWidgetId, widgetId);
    }

    clearDragState();
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsConfiguring((current) => !current)}>
          <Settings2 className="size-4" />
          Personalizar dashboard
        </Button>
      </div>
      {isConfiguring ? (
        <div className="space-y-3">
          <WidgetControls
            availableItems={widgets}
            visibleIds={visibleIds}
            onAdd={addVisibleId}
            onRemove={removeVisibleId}
            onReset={resetVisibleIds}
          />
          <p className="text-xs text-muted-foreground">Arraste os widgets visíveis para reorganizar o dashboard.</p>
        </div>
      ) : null}
      {visibleWidgets.length ? (
        <div className={gridClassName}>
          {visibleWidgets.map((widget) => (
            <div
              key={widget.id}
              aria-grabbed={isConfiguring ? draggedWidgetId === widget.id : undefined}
              className={cn(
                'relative transition',
                isConfiguring ? 'cursor-grab active:cursor-grabbing' : null,
                draggedWidgetId === widget.id ? 'opacity-60' : null,
                dragOverWidgetId === widget.id ? 'rounded-[28px] ring-2 ring-primary/40 ring-offset-2' : null,
                widget.className,
              )}
              draggable={isConfiguring}
              onDragStart={(event) => handleDragStart(event, widget.id)}
              onDragOver={(event) => handleDragOver(event, widget.id)}
              onDrop={(event) => handleDrop(event, widget.id)}
              onDragEnd={clearDragState}
            >
              {widget.render()}
              {isConfiguring ? (
                <div className="absolute right-3 top-3 flex gap-2">
                  <div
                    aria-hidden="true"
                    className="inline-flex size-8 items-center justify-center rounded-xl border border-border bg-white/90 text-muted-foreground shadow-sm"
                  >
                    <GripVertical className="size-4" />
                  </div>
                  <Button
                    aria-label={`Remover ${widget.title}`}
                    className="size-8 bg-white/90"
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() => removeVisibleId(widget.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex min-h-28 items-center justify-center p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      )}
    </section>
  );
}
