import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

export function SuppliersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ companyName: '', city: '', state: '', phone: '', email: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: async () => (await api.get('/suppliers', { params: { search, pageSize: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/suppliers', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setOpen(false);
      setForm({ companyName: '', city: '', state: '', phone: '', email: '' });
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
          <h1 className="text-xl font-semibold text-slate-800">Fornecedores</h1>
          <p className="text-sm text-slate-500">Cadastro de fornecedores (Fornecedor 360º).</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo fornecedor</Button>
      </div>

      <Input placeholder="Buscar fornecedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading && <LoadingState />}
      {!isLoading && data?.data?.length === 0 && <EmptyState title="Nenhum fornecedor cadastrado" />}

      {!isLoading && data?.data?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cidade/UF</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Avaliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{s.companyName}</td>
                  <td className="px-4 py-3 text-slate-500">{[s.city, s.state].filter(Boolean).join('/') || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.phone || s.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{s.rating ? '⭐'.repeat(s.rating) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo fornecedor">
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
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar fornecedor'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
