import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '', cost: '', stock: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => (await api.get('/products', { params: { search, pageSize: 50 } })).data,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/products', {
        ...form,
        price: form.price ? Number(form.price) : undefined,
        cost: form.cost ? Number(form.cost) : undefined,
        stock: form.stock ? Number(form.stock) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setForm({ name: '', sku: '', price: '', cost: '', stock: '' });
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
          <h1 className="text-xl font-semibold text-slate-800">Produtos</h1>
          <p className="text-sm text-slate-500">Catálogo de produtos e serviços.</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Novo produto</Button>
      </div>

      <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading && <LoadingState />}
      {!isLoading && data?.data?.length === 0 && <EmptyState title="Nenhum produto cadastrado" />}

      {!isLoading && data?.data?.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                  <td className="px-4 py-3 text-slate-500">{p.sku || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.price ? currency.format(Number(p.price)) : '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.stock ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo produto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome do produto">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Preço">
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Custo">
              <Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
            <Field label="Estoque">
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Salvando...' : 'Salvar produto'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
