import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { MoveStageDto } from './dto/move-stage.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventEmitter2,
  ) {}

  async list(orgId: string, pipelineId?: string, status?: string) {
    const conditions = [eq(schema.opportunities.organizationId, orgId)];
    if (pipelineId) conditions.push(eq(schema.opportunities.pipelineId, pipelineId));
    if (status) conditions.push(eq(schema.opportunities.status, status));
    return this.db.select().from(schema.opportunities).where(and(...conditions));
  }

  // Monta o board no formato que o Kanban do frontend consome direto
  // (Funil de Vendas, prompt-mestre seção 42).
  async kanban(orgId: string, pipelineId: string) {
    const pipeline = await this.db.query.pipelines.findFirst({
      where: and(eq(schema.pipelines.id, pipelineId), eq(schema.pipelines.organizationId, orgId)),
    });
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado.');

    const stages = await this.db
      .select()
      .from(schema.pipelineStages)
      .where(eq(schema.pipelineStages.pipelineId, pipelineId))
      .orderBy(asc(schema.pipelineStages.order));

    const opportunities = await this.db
      .select()
      .from(schema.opportunities)
      .where(and(eq(schema.opportunities.organizationId, orgId), eq(schema.opportunities.pipelineId, pipelineId)));

    return {
      pipeline,
      columns: stages.map((stage) => ({
        stage,
        opportunities: opportunities.filter((o) => o.stageId === stage.id),
      })),
    };
  }

  async create(orgId: string, dto: CreateOpportunityDto) {
    const pipeline = await this.db.query.pipelines.findFirst({
      where: and(eq(schema.pipelines.id, dto.pipelineId), eq(schema.pipelines.organizationId, orgId)),
    });
    if (!pipeline) throw new BadRequestException('Pipeline inválido.');

    let stageId = dto.stageId;
    if (!stageId) {
      const firstStage = await this.db.query.pipelineStages.findFirst({
        where: eq(schema.pipelineStages.pipelineId, dto.pipelineId),
        orderBy: asc(schema.pipelineStages.order),
      });
      if (!firstStage) throw new BadRequestException('Pipeline sem etapas configuradas.');
      stageId = firstStage.id;
    }
    const stage = await this.db.query.pipelineStages.findFirst({ where: eq(schema.pipelineStages.id, stageId) });

    const [row] = await this.db
      .insert(schema.opportunities)
      .values({
        organizationId: orgId,
        title: dto.title,
        pipelineId: dto.pipelineId,
        stageId,
        customerId: dto.customerId,
        prospectId: dto.prospectId,
        ownerId: dto.ownerId,
        value: dto.value !== undefined ? String(dto.value) : undefined,
        discount: dto.discount !== undefined ? String(dto.discount) : undefined,
        origin: dto.origin,
        probability: stage?.probability ?? 0,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
      })
      .returning();

    await this.db.insert(schema.opportunityStageHistory).values({ opportunityId: row.id, toStageId: stageId });
    this.events.emit('opportunity.created', row);
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateOpportunityDto) {
    const existing = await this.getOwned(orgId, id);
    const values: any = { ...dto, updatedAt: new Date() };
    if (values.value !== undefined) values.value = String(values.value);
    if (values.discount !== undefined) values.discount = String(values.discount);
    if (values.expectedCloseDate) values.expectedCloseDate = new Date(values.expectedCloseDate);
    const [row] = await this.db.update(schema.opportunities).set(values).where(eq(schema.opportunities.id, id)).returning();
    return row;
  }

  // Mover no Kanban (prompt-mestre, seção 51: "Mover Kanban -> deve alterar a etapa")
  async moveStage(orgId: string, id: string, dto: MoveStageDto, userId: string) {
    const opportunity = await this.getOwned(orgId, id);
    const stage = await this.db.query.pipelineStages.findFirst({ where: eq(schema.pipelineStages.id, dto.stageId) });
    if (!stage || stage.pipelineId !== opportunity.pipelineId) {
      throw new BadRequestException('Etapa inválida para este pipeline.');
    }

    const status = stage.isWon ? 'won' : stage.isLost ? 'lost' : 'open';
    const [row] = await this.db
      .update(schema.opportunities)
      .set({
        stageId: dto.stageId,
        probability: stage.probability,
        status,
        lostReason: stage.isLost ? dto.lostReason : null,
        stageChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.opportunities.id, id))
      .returning();

    await this.db.insert(schema.opportunityStageHistory).values({
      opportunityId: id,
      fromStageId: opportunity.stageId,
      toStageId: dto.stageId,
      changedById: userId,
    });

    this.events.emit('opportunity.stage_changed', { opportunity: row, fromStageId: opportunity.stageId, toStageId: dto.stageId });
    if (status === 'won') this.events.emit('opportunity.won', row);
    if (status === 'lost') this.events.emit('opportunity.lost', row);

    return row;
  }

  async remove(orgId: string, id: string) {
    await this.getOwned(orgId, id);
    await this.db.delete(schema.opportunities).where(eq(schema.opportunities.id, id));
    return { success: true };
  }

  private async getOwned(orgId: string, id: string) {
    const existing = await this.db.query.opportunities.findFirst({
      where: and(eq(schema.opportunities.id, id), eq(schema.opportunities.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Oportunidade não encontrada.');
    return existing;
  }
}
