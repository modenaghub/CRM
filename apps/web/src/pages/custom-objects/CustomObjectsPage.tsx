import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { api, friendlyError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, LoadingState } from '../../components/ui/EmptyState';

interface ObjectField {
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
}
interface CustomObject {
  id: string;
  key: string;
  name: string;
  fields: ObjectField[];
}

// Dynamic Object Engine (prompt-mestre, seção 17): esta tela renderiza
// dinamicamente a tabela e o formulário a partir dos campos configurados
// para cada objeto — nenhuma coluna aqui é fixa no código.
export function CustomObjectsPage() {
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: objects, isLoading } = useQuery<CustomObject[]>({
    queryKey: ['custom-objects'],
    queryFn: async () => (await api.get('/custom-objects')).data,
  });

  const selected = objects?.find((o) => o.key === selectedKey) ?? objects?.[0];

  const { data: records, isLoading: loadingRecords } = useQuery({
    queryKey: ['custom-object-records', selected?.key],
    queryFn: async () => (await api.get(`/custom-objects/${selected!.key}/records`)).data,
    enabled: !!selected,
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post(`/custom-objects/${selected!.key}/records`, { data: formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-object-records', selected?.key] });
      setOpen(false);
      setFormData({});
    },
    onError: (err) => setError(friendlyError(err)),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  }

  if (isLoading) return <LoadingState />;
  if (!objects || objects.length === 0) {
    return (
      <EmptyState
        title="Nenhum objeto personalizado configurado"
        description="Objetos como Veículo (Oficina) ou Imóvel (Imobiliário) aparecem aqui automaticamente conforme o segmento da sua empresa."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Objetos personalizados</h1>
          <p className="text-sm text-slate-500">Estrutura dinâmica específica do seu segmento (Vertical Engine).</p>
        </div>
        {selected && <Button onClick={() => setOpen(true)}>+ Novo {selected.name.toLowerCase()}</Button>}
      </div>

      <div className="flex gap-2">
        {objects.map((o) => (
          <button
            key={o.key}
            onClick={() => setSelectedKey(o.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              (selected?.key ?? objects[0].key) === o.key ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {o.name}
          </button>
        ))}
      </div>

      {loadingRecords && <LoadingState />}
      {!loadingRecords && records?.length === 0 && <EmptyState title={`Nenhum registro em ${selected?.name}`} />}

      {!loadingRecords && records?.length > 0 && selected && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                {selected.fields.map((f) => (
                  <th key={f.key} className="px-4 py-3">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  {selected.fields.map((f) => (
                    <td key={f.key} className="px-4 py-3 text-slate-600">
                      {r.data?.[f.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal open={open} onClose={() => setOpen(false)} title={`Novo ${selected.name.toLowerCase()}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {selected.fields.map((f) => (
              <Field key={f.key} label={f.label}>
                <Input
                  type={f.fieldType === 'number' ? 'number' : 'text'}
                  required={f.required}
                  value={formData[f.key] ?? ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                />
              </Field>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
