import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { and, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';

// Workflow Builder / Event Bus (prompt-mestre, seções 20, 29, 54): reage a
// eventos do núcleo e executa automações configuradas por organização.
// Suporta a ação "create_task" nesta fase; demais tipos de ação (send_whatsapp,
// notify, etc.) ficam com a arquitetura pronta (tabela `automations`) para a
// próxima fase, sem simular funcionalidade que ainda não existe.
@Injectable()
export class AutomationsListener {
  private readonly logger = new Logger('AutomationsListener');

  constructor(@Inject(DB) private readonly db: Db) {}

  @OnEvent('customer.created')
  onCustomerCreated(payload: any) {
    return this.run('customer.created', payload.organizationId, payload);
  }

  @OnEvent('prospect.created')
  onProspectCreated(payload: any) {
    return this.run('prospect.created', payload.organizationId, payload);
  }

  @OnEvent('opportunity.stage_changed')
  onOpportunityStageChanged(payload: any) {
    return this.run('opportunity.stage_changed', payload.opportunity.organizationId, payload.opportunity);
  }

  @OnEvent('opportunity.won')
  onOpportunityWon(payload: any) {
    return this.run('opportunity.won', payload.organizationId, payload);
  }

  @OnEvent('opportunity.lost')
  onOpportunityLost(payload: any) {
    return this.run('opportunity.lost', payload.organizationId, payload);
  }

  private async run(eventName: string, organizationId: string, entity: any) {
    if (!organizationId) return;
    const automations = await this.db
      .select()
      .from(schema.automations)
      .where(and(eq(schema.automations.organizationId, organizationId), eq(schema.automations.triggerEvent, eventName), eq(schema.automations.enabled, true)));

    for (const automation of automations) {
      for (const action of (automation.actions as any[]) ?? []) {
        try {
          await this.executeAction(organizationId, action, entity);
        } catch (err) {
          this.logger.error(`Falha ao executar automação "${automation.name}": ${err}`);
        }
      }
    }
  }

  private async executeAction(organizationId: string, action: { type: string; params: any }, entity: any) {
    if (action.type === 'create_task') {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + (action.params?.dueInDays ?? 1));
      await this.db.insert(schema.activityTasks).values({
        organizationId,
        type: action.params?.type ?? 'internal',
        title: action.params?.title ?? 'Tarefa gerada por automação',
        priority: action.params?.priority ?? 'normal',
        assigneeId: entity.ownerId ?? null,
        customerId: entity.companyName ? entity.id : null,
        dueAt,
      });
      this.logger.log(`Automação: tarefa "${action.params?.title}" criada para org ${organizationId}.`);
    }
    // Demais tipos (send_whatsapp, notify, send_email...) entram na próxima fase,
    // junto com os módulos de WhatsApp/E-mail reais.
  }
}
