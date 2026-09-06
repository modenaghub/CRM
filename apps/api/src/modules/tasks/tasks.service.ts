import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, asc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventEmitter2,
  ) {}

  async list(orgId: string, assigneeId?: string, status?: string) {
    const conditions = [eq(schema.activityTasks.organizationId, orgId)];
    if (assigneeId) conditions.push(eq(schema.activityTasks.assigneeId, assigneeId));
    if (status) conditions.push(eq(schema.activityTasks.status, status));
    return this.db
      .select()
      .from(schema.activityTasks)
      .where(and(...conditions))
      .orderBy(asc(schema.activityTasks.dueAt));
  }

  async create(orgId: string, dto: CreateTaskDto) {
    const [row] = await this.db
      .insert(schema.activityTasks)
      .values({
        organizationId: orgId,
        ...dto,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      })
      .returning();
    this.events.emit('task.created', row);
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateTaskDto) {
    const existing = await this.getOwned(orgId, id);
    const values: any = { ...dto, updatedAt: new Date() };
    if (values.dueAt) values.dueAt = new Date(values.dueAt);
    const [row] = await this.db.update(schema.activityTasks).set(values).where(eq(schema.activityTasks.id, id)).returning();
    if (dto.status === 'done' && existing.status !== 'done') {
      this.events.emit('task.completed', row);
    }
    return row;
  }

  async complete(orgId: string, id: string) {
    await this.getOwned(orgId, id);
    const [row] = await this.db
      .update(schema.activityTasks)
      .set({ status: 'done', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.activityTasks.id, id))
      .returning();
    this.events.emit('task.completed', row);
    return row;
  }

  async remove(orgId: string, id: string) {
    await this.getOwned(orgId, id);
    await this.db.delete(schema.activityTasks).where(eq(schema.activityTasks.id, id));
    return { success: true };
  }

  private async getOwned(orgId: string, id: string) {
    const existing = await this.db.query.activityTasks.findFirst({
      where: and(eq(schema.activityTasks.id, id), eq(schema.activityTasks.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Tarefa não encontrada.');
    return existing;
  }
}
