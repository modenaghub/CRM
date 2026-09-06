import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreatePipelineDto } from './dto/create-pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string) {
    const pipelines = await this.db.select().from(schema.pipelines).where(eq(schema.pipelines.organizationId, orgId));
    const result: any[] = [];
    for (const pipeline of pipelines) {
      const stages = await this.db
        .select()
        .from(schema.pipelineStages)
        .where(eq(schema.pipelineStages.pipelineId, pipeline.id))
        .orderBy(asc(schema.pipelineStages.order));
      result.push({ ...pipeline, stages });
    }
    return result;
  }

  async create(orgId: string, dto: CreatePipelineDto) {
    const [pipeline] = await this.db
      .insert(schema.pipelines)
      .values({ organizationId: orgId, name: dto.name, type: dto.type ?? 'sales' })
      .returning();
    let order = 0;
    const stages: (typeof schema.pipelineStages.$inferSelect)[] = [];
    for (const s of dto.stages) {
      const [stage] = await this.db
        .insert(schema.pipelineStages)
        .values({
          pipelineId: pipeline.id,
          name: s.name,
          order: order++,
          color: s.color,
          probability: s.probability ?? 0,
          isWon: !!s.isWon,
          isLost: !!s.isLost,
        })
        .returning();
      stages.push(stage);
    }
    return { ...pipeline, stages };
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.pipelines.findFirst({
      where: (p, { and }) => and(eq(p.id, id), eq(p.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Pipeline não encontrado.');
    await this.db.delete(schema.pipelines).where(eq(schema.pipelines.id, id));
    return { success: true };
  }
}
