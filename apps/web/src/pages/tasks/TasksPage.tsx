import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

const typeLabel: Record<string, string> = {
  call: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  meeting: 'Reunião',
  visit: 'Visita',
  followup: 'Follow-up',
  internal: 'Interna',
  proposal: 'Proposta',
  return: 'Retorno',
};

export function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'followup', title: '', priority: 'normal', dueAt: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter],
    queryFn: async () => (await api.get('/tasks', { params: statusFilter ? { status: statusFilter } : {} })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/tasks', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOpen(false);
      setForm({ type: 'followup', title: '', priority: 'normal', dueAt: '' });
    },
    onError: (err) => setError(friendlyError(err)),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/tasks/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  const isOverdue = (t: any) => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < new Date();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Tarefas</h1>
          <p className="text-sm text-slate-500">Atividades e follow-ups da equipe.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nova tarefa</Button>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'done'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
          >
            {s === '' ? 'Todas' : s === 'pending' ? 'Pendentes' : 'Concluídas'}
          </button>
        ))}
      </div>

      {isLoading && <LoadingState />}
      {!isLoading && data?.length === 0 && <EmptyState title="Nenhuma tarefa encontrada" />}

      <div className="space-y-2">
        {(data ?? []).map((t: any) => (
          <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={t.status === 'done'}
                onChange={() => t.status !== 'done' && completeMutation.mutate(t.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <div>
                <p className={`text-sm font-medium ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.title}</p>
                <p className="text-xs text-slate-400">
                  {typeLabel[t.type] ?? t.type} · {t.dueAt ? new Date(t.dueAt).toLocaleDateString('pt-BR') : 'sem prazo'}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isOverdue(t) ? 'bg-red-50 text-red-600' : t.priority === 'high' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isOverdue(t) ? 'Atrasada' : t.priority}
            </span>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova tarefa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(typeLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </Select>
            </Field>
          </div>
          <Field label="Prazo">
            <Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar tarefa'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
