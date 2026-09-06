import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

const potentialLabel: Record<string, string> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
const potentialColor: Record<string, string> = {
  alto: 'bg-green-50 text-green-700',
  medio: 'bg-amber-50 text-amber-700',
  baixo: 'bg-slate-100 text-slate-500',
};

export function ProspectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: '', city: '', state: '', potential: 'medio', origin: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['prospects', search],
    queryFn: async () => (await api.get('/prospects', { params: { search, pageSize: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/prospects', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOpen(false);
      setForm({ companyName: '', city: '', state: '', potential: 'medio', origin: '' });
    },
    onError: (err) => setError(friendlyError(err)),
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/prospects/${id}/convert-to-customer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prospects'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Prospects</h1>
          <p className="text-sm text-slate-500">Prospecção comercial — converta em cliente quando fechar.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo prospect</Button>
      </div>

      <Input placeholder="Buscar prospect..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading && <LoadingState />}
      {!isLoading && data?.data?.length === 0 && <EmptyState title="Nenhum prospect cadastrado" />}

      {!isLoading && data?.data?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Potencial</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.companyName}</td>
                  <td className="px-4 py-3 text-slate-500">{[p.city, p.state].filter(Boolean).join('/') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${potentialColor[p.potential] ?? 'bg-slate-100 text-slate-500'}`}>
                      {potentialLabel[p.potential] ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'open' && (
                      <Button size="sm" variant="secondary" onClick={() => convertMutation.mutate(p.id)} disabled={convertMutation.isPending}>
                        Converter em cliente
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo prospect">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome da empresa">
            <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="UF">
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} maxLength={2} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Potencial">
              <Select value={form.potential} onChange={(e) => setForm({ ...form, potential: e.target.value })}>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
                <option value="baixo">Baixo</option>
              </Select>
            </Field>
            <Field label="Origem">
              <Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="indicação, site, feira..." />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar prospect'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
