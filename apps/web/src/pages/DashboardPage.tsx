import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-800">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { user, organization } = useAuthStore();

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
  });
  const { data: funnel } = useQuery({
    queryKey: ['dashboard-funnel'],
    queryFn: async () => (await api.get('/dashboard/funnel')).data,
  });
  const { data: agenda } = useQuery({
    queryKey: ['dashboard-agenda'],
    queryFn: async () => (await api.get('/dashboard/my-agenda')).data,
  });

  const maxCount = Math.max(1, ...(funnel?.stages?.map((s: any) => s.count) ?? [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500">{organization?.name} — visão geral do seu comercial</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Clientes ativos" value={String(summary?.customersActive ?? '—')} />
        <KpiCard label="Prospects em aberto" value={String(summary?.prospectsOpen ?? '—')} />
        <KpiCard
          label="Pipeline aberto"
          value={summary ? currency.format(summary.opportunitiesOpenValue) : '—'}
          hint={summary ? `${summary.opportunitiesOpen} oportunidades` : undefined}
        />
        <KpiCard
          label="Ganho no mês"
          value={summary ? currency.format(summary.opportunitiesWonThisMonthValue) : '—'}
          hint={summary ? `${summary.opportunitiesWonThisMonth} fechamentos` : undefined}
        />
        <KpiCard label="Tarefas hoje" value={String(summary?.tasksToday ?? '—')} />
        <KpiCard label="Tarefas atrasadas" value={String(summary?.tasksOverdue ?? '—')} hint={summary?.tasksOverdue > 0 ? 'Requer atenção' : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Funil comercial — {funnel?.pipeline?.name}</h2>
          <div className="mt-4 space-y-2">
            {(funnel?.stages ?? []).map((s: any) => (
              <div key={s.stage.id} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs text-slate-500">{s.stage.name}</div>
                <div className="h-6 flex-1 rounded bg-slate-100">
                  <div
                    className="h-6 rounded text-right text-xs leading-6 text-white"
                    style={{
                      width: `${Math.max(6, (s.count / maxCount) * 100)}%`,
                      backgroundColor: s.stage.color ?? '#4f46e5',
                    }}
                  >
                    <span className="pr-2">{s.count > 0 ? s.count : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700">Minha agenda (7 dias)</h2>
          <div className="mt-4 space-y-3">
            {(agenda ?? []).length === 0 && <p className="text-xs text-slate-400">Nenhuma atividade pendente.</p>}
            {(agenda ?? []).slice(0, 6).map((t: any) => (
              <div key={t.id} className="border-b border-slate-50 pb-2 last:border-0">
                <p className="text-sm font-medium text-slate-700">{t.title}</p>
                <p className="text-xs text-slate-400">
                  {t.dueAt ? new Date(t.dueAt).toLocaleDateString('pt-BR') : 'Sem prazo'} · prioridade {t.priority}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
