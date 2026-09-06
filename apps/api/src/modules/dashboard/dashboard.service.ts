import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';

// Dashboard principal (prompt-mestre, seção 40) — indicadores REAIS calculados
// a partir do banco (nada de mock estático).
@Injectable()
export class DashboardService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async summary(orgId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      [{ value: customersActive }],
      [{ value: customersInactive }],
      [{ value: prospectsOpen }],
      [{ value: opportunitiesOpen }],
      [openValueRow],
      [{ value: opportunitiesWonMonth }],
      [wonMonthValueRow],
      [{ value: tasksToday }],
      [{ value: tasksOverdue }],
    ] = await Promise.all([
      this.db.select({ value: count() }).from(schema.customers).where(and(eq(schema.customers.organizationId, orgId), eq(schema.customers.status, 'active'))),
      this.db.select({ value: count() }).from(schema.customers).where(and(eq(schema.customers.organizationId, orgId), eq(schema.customers.status, 'inactive'))),
      this.db.select({ value: count() }).from(schema.prospects).where(and(eq(schema.prospects.organizationId, orgId), eq(schema.prospects.status, 'open'))),
      this.db.select({ value: count() }).from(schema.opportunities).where(and(eq(schema.opportunities.organizationId, orgId), eq(schema.opportunities.status, 'open'))),
      this.db.select({ total: sql<string>`coalesce(sum(${schema.opportunities.value}), 0)` }).from(schema.opportunities).where(and(eq(schema.opportunities.organizationId, orgId), eq(schema.opportunities.status, 'open'))),
      this.db.select({ value: count() }).from(schema.opportunities).where(and(eq(schema.opportunities.organizationId, orgId), eq(schema.opportunities.status, 'won'), gte(schema.opportunities.updatedAt, startOfMonth))),
      this.db.select({ total: sql<string>`coalesce(sum(${schema.opportunities.value}), 0)` }).from(schema.opportunities).where(and(eq(schema.opportunities.organizationId, orgId), eq(schema.opportunities.status, 'won'), gte(schema.opportunities.updatedAt, startOfMonth))),
      this.db.select({ value: count() }).from(schema.activityTasks).where(and(eq(schema.activityTasks.organizationId, orgId), gte(schema.activityTasks.dueAt, startOfToday), lt(schema.activityTasks.dueAt, startOfTomorrow))),
      this.db.select({ value: count() }).from(schema.activityTasks).where(and(eq(schema.activityTasks.organizationId, orgId), lt(schema.activityTasks.dueAt, startOfToday), sql`${schema.activityTasks.status} != 'done'`)),
    ]);

    return {
      customersActive: Number(customersActive),
      customersInactive: Number(customersInactive),
      prospectsOpen: Number(prospectsOpen),
      opportunitiesOpen: Number(opportunitiesOpen),
      opportunitiesOpenValue: Number(openValueRow.total),
      opportunitiesWonThisMonth: Number(opportunitiesWonMonth),
      opportunitiesWonThisMonthValue: Number(wonMonthValueRow.total),
      tasksToday: Number(tasksToday),
      tasksOverdue: Number(tasksOverdue),
    };
  }

  // Funil visual (Kanban/Funil, seção 5): contagem de oportunidades abertas por etapa do pipeline default.
  async funnel(orgId: string) {
    const pipeline = await this.db.query.pipelines.findFirst({
      where: and(eq(schema.pipelines.organizationId, orgId), eq(schema.pipelines.isDefault, true)),
    });
    if (!pipeline) return { pipeline: null, stages: [] };

    const stages = await this.db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, pipeline.id))
      .orderBy(asc(schema.pipelineStages.order));

    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const [{ value }] = await this.db
          .select({ value: count() })
          .from(schema.opportunities)
          .where(and(eq(schema.opportunities.stageId, stage.id), eq(schema.opportunities.status, 'open')));
        return { stage, count: Number(value) };
      }),
    );

    return { pipeline, stages: stageCounts };
  }

  // Agenda do dia / atividades pendentes (Home inteligente, seção 69)
  async myAgenda(orgId: string, userId: string) {
    const now = new Date();
    const endOfWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    return this.db
      .select()
      .from(schema.activityTasks)
      .where(
        and(
          eq(schema.activityTasks.organizationId, orgId),
          eq(schema.activityTasks.assigneeId, userId),
          sql`${schema.activityTasks.status} != 'done'`,
          lte(schema.activityTasks.dueAt, endOfWeek),
        ),
      )
      .orderBy(asc(schema.activityTasks.dueAt));
  }
}
