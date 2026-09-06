import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { api, friendlyError } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';

interface Vertical {
  id: string;
  key: string;
  name: string;
  description?: string;
  isCustom: boolean;
}

export function RegisterOrganizationPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [step, setStep] = useState(1);
  const [organizationName, setOrganizationName] = useState('');
  const [segmentKey, setSegmentKey] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: verticals } = useQuery<Vertical[]>({
    queryKey: ['verticals'],
    queryFn: async () => (await api.get('/verticals')).data,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register-organization', {
        organizationName,
        segmentKey,
        adminName,
        adminEmail,
        adminPassword,
      });
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-semibold text-slate-800">Criar sua organização</h1>
        <p className="mt-1 text-sm text-slate-500">
          Etapa {step} de 2 — {step === 1 ? 'qual é o segmento da sua empresa?' : 'dados da empresa e do administrador'}
        </p>

        {step === 1 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-700">Selecione o segmento da sua empresa:</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(verticals ?? []).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setSegmentKey(v.key)}
                  className={clsx(
                    'rounded-xl border p-3 text-left text-sm transition-colors',
                    segmentKey === v.key
                      ? 'border-brand-600 bg-brand-50 text-brand-700 font-medium'
                      : 'border-slate-200 hover:border-brand-300',
                  )}
                >
                  {v.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              O sistema já configura automaticamente o menu, o pipeline e os indicadores do seu segmento. Você poderá
              personalizar tudo depois.
            </p>
            <Button className="mt-6" disabled={!segmentKey} onClick={() => setStep(2)}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Nome da empresa">
              <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Seu nome">
                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
              </Field>
              <Field label="Seu e-mail">
                <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
              </Field>
            </div>
            <Field label="Senha">
              <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={6} />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Criando...' : 'Criar organização'}
              </Button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
