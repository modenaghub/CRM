import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventEmitter2,
  ) {}

  async list(orgId: string, query: PaginationQueryDto) {
    const conditions = [eq(schema.customers.organizationId, orgId)];
    if (query.status) conditions.push(eq(schema.customers.status, query.status));
    if (query.search) {
      conditions.push(
        or(
          ilike(schema.customers.companyName, `%${query.search}%`),
          ilike(schema.customers.document, `%${query.search}%`),
          ilike(schema.customers.email, `%${query.search}%`),
        )!,
      );
    }
    const where = and(...conditions);

    const [{ total }] = await this.db.select({ total: count() }).from(schema.customers).where(where);
    const rows = await this.db
      .select()
      .from(schema.customers)
      .where(where)
      .orderBy(desc(schema.customers.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);

    return { data: rows, total: Number(total), page: query.page, pageSize: query.pageSize };
  }

  // Cliente 360º (prompt-mestre, seção 45) — visão consolidada em uma tela só.
  async findOne360(orgId: string, id: string) {
    const customer = await this.db.query.customers.findFirst({
      where: and(eq(schema.customers.id, id), eq(schema.customers.organizationId, orgId)),
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const [contacts, opportunities, tasks, notes] = await Promise.all([
      this.db.select().from(schema.contacts).where(eq(schema.contacts.customerId, id)),
      this.db.select().from(schema.opportunities).where(eq(schema.opportunities.customerId, id)),
      this.db.select().from(schema.activityTasks).where(eq(schema.activityTasks.customerId, id)),
      this.db.select().from(schema.notes).where(eq(schema.notes.customerId, id)).orderBy(desc(schema.notes.createdAt)),
    ]);

    return { ...customer, contacts, opportunities, tasks, notes };
  }

  async create(orgId: string, dto: CreateCustomerDto) {
    const [row] = await this.db.insert(schema.customers).values({ organizationId: orgId, ...dto }).returning();
    this.events.emit('customer.created', row);
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateCustomerDto) {
    const existing = await this.db.query.customers.findFirst({
      where: and(eq(schema.customers.id, id), eq(schema.customers.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Cliente não encontrado.');
    const [row] = await this.db
      .update(schema.customers)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.customers.id, id))
      .returning();
    this.events.emit('customer.updated', row);
    return row;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.customers.findFirst({
      where: and(eq(schema.customers.id, id), eq(schema.customers.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Cliente não encontrado.');
    await this.db.delete(schema.customers).where(eq(schema.customers.id, id));
    return { success: true };
  }
}
