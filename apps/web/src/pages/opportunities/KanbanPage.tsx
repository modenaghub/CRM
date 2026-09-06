import { DndContext, DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/EmptyState';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function OpportunityCard({ opportunity }: { opportunity: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: opportunity.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing ${isDragging ? 'opacity-50 z-10' : ''}`}
    >
      <p className="text-sm font-medium text-slate-700">{opportunity.title}</p>
      <p className="mt-1 text-xs text-slate-400">{opportunity.value ? currency.format(Number(opportunity.value)) : 'Sem valor'}</p>
    </div>
  );
}

function KanbanColumn({ column }: { column: { stage: any; opportunities: any[] } }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stage.id });
  const total = column.opportunities.reduce((acc, o) => acc + Number(o.value ?? 0), 0);
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-xl border p-3 ${isOver ? 'border-brand-400 bg-brand-50/40' : 'border-slate-200 bg-slate-50/50'}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.stage.color ?? '#94a3b8' }} />
          <span className="text-sm font-semibold text-slate-700">{column.stage.name}</span>
        </div>
        <span className="text-xs text-slate-400">{column.opportunities.length}</span>
      </div>
      <p className="mb-2 text-xs text-slate-400">{currency.format(total)}</p>
      <div className="space-y-2 min-h-[80px]">
        {column.opportunities.map((o) => (
          <OpportunityCard key={o.id} opportunity={o} />
        ))}
      </div>
    </div>
  );
}

export function KanbanPage() {
  const queryClient = useQueryClient();
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', value: '' });

  const { data: pipelines } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => (await api.get('/pipelines')).data,
  });

  useEffect(() => {
    if (!pipelineId && pipelines?.length) setPipelineId(pipelines[0].id);
  }, [pipelines, pipelineId]);

  const { data: board, isLoading } = useQuery({
    queryKey: ['kanban', pipelineId],
    queryFn: async () => (await api.get('/opportunities/kanban', { params: { pipelineId } })).data,
    enabled: !!pipelineId,
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => api.post(`/opportunities/${id}/move-stage`, { stageId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-funnel'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/opportunities', { title: form.title, pipelineId, value: form.value ? Number(form.value) : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', pipelineId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOpen(false);
      setForm({ title: '', value: '' });
    },
    onError: (err) => setError(friendlyError(err)),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const stageId = String(over.id);
    const opportunityId = String(active.id);
    const currentColumn = board?.columns.find((c: any) => c.opportunities.some((o: any) => o.id === opportunityId));
    if (currentColumn?.stage.id === stageId) return;
    moveMutation.mutate({ id: opportunityId, stageId });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Oportunidades</h1>
          <p className="text-sm text-slate-500">Arraste os cards entre as etapas do funil.</p>
        </div>
        <div className="flex items-center gap-3">
          {pipelines && pipelines.length > 1 && (
            <Select value={pipelineId ?? ''} onChange={(e) => setPipelineId(e.target.value)} className="w-48">
              {pipelines.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          )}
          <Button onClick={() => setOpen(true)}>+ Nova oportunidade</Button>
        </div>
      </div>

      {isLoading && <LoadingState />}

      {board && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {board.columns.map((col: any) => (
              <KanbanColumn key={col.stage.id} column={col} />
            ))}
          </div>
        </DndContext>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nova oportunidade">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <Field label="Valor estimado (R$)">
            <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar oportunidade'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
