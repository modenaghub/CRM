import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: '', city: '', state: '', email: '', phone: '', abcClassification: 'B' });

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => (await api.get('/customers', { params: { search, pageSize: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/customers', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setOpen(false);
      setForm({ companyName: '', city: '', state: '', email: '', phone: '', abcClassification: 'B' });
    },
    onError: (err) => setError(friendlyError(err)),
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
          <h1 className="text-xl font-semibold text-slate-800">Clientes</h1>
          <p className="text-sm text-slate-500">Cadastro completo de clientes (Cliente 360º).</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo cliente</Button>
      </div>

      <Input placeholder="Buscar por nome, CNPJ ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading && <LoadingState />}
      {!isLoading && data?.data?.length === 0 && <EmptyState title="Nenhum cliente cadastrado" description="Crie o primeiro cliente para começar." />}

      {!isLoading && data?.data?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3">Ticket médio</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((c: any) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{c.companyName}</td>
                  <td className="px-4 py-3 text-slate-500">{[c.city, c.state].filter(Boolean).join('/') || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.abcClassification ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{c.ticketAverage ? currency.format(Number(c.ticketAverage)) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${c.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Razão social / Nome da empresa">
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
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Classificação ABC">
            <Select value={form.abcClassification} onChange={(e) => setForm({ ...form, abcClassification: e.target.value })}>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </Select>
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar cliente'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
