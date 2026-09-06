import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, friendlyError } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('admin@vpjalimentos.com.br');
  const [password, setPassword] = useState('Demo@123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data);
      navigate('/');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-slate-100">
        <h1 className="text-xl font-semibold text-slate-800">Entrar</h1>
        <p className="mt-1 text-sm text-slate-500">Acesse sua plataforma de gestão comercial.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Senha">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem uma organização?{' '}
          <Link to="/register" className="font-medium text-brand-600 hover:underline">
            Criar agora
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <strong>Demo:</strong> admin@vpjalimentos.com.br / Demo@123
        </div>
      </div>
    </div>
  );
}
