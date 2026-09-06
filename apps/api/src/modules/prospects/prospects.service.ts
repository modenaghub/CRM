import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';

@Injectable()
export class ProspectsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly events: EventEmitter2,
  ) {}

  async list(orgId: string, query: PaginationQueryDto) {
    const conditions = [eq(schema.prospects.organizationId, orgId)];
    if (query.status) conditions.push(eq(schema.prospects.status, query.status));
    if (query.search) {
      conditions.push(
        or(
          ilike(schema.prospects.companyName, `%${query.search}%`),
          ilike(schema.prospects.document, `%${query.search}%`),
          ilike(schema.prospects.email, `%${query.search}%`),
        )!,
      );
    }
    const where = and(...conditions);
    const [{ total }] = await this.db.select({ total: count() }).from(schema.prospects).where(where);
    const rows = await this.db
      .select()
      .from(schema.prospects)
      .where(where)
      .orderBy(desc(schema.prospects.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { data: rows, total: Number(total), page: query.page, pageSize: query.pageSize };
  }

  async findOne(orgId: string, id: string) {
    const prospect = await this.db.query.prospects.findFirst({
      where: and(eq(schema.prospects.id, id), eq(schema.prospects.organizationId, orgId)),
    });
    if (!prospect) throw new NotFoundException('Prospect não encontrado.');
    const [contacts, opportunities, tasks] = await Promise.all([
      this.db.select().from(schema.contacts).where(eq(schema.contacts.prospectId, id)),
      this.db.select().from(schema.opportunities).where(eq(schema.opportunities.prospectId, id)),
      this.db.select().from(schema.activityTasks).where(eq(schema.activityTasks.prospectId, id)),
    ]);
    return { ...prospect, contacts, opportunities, tasks };
  }

  async create(orgId: string, dto: CreateProspectDto) {
    const [row] = await this.db.insert(schema.prospects).values({ organizationId: orgId, ...dto }).returning();
    this.events.emit('prospect.created', row);
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateProspectDto) {
    const existing = await this.db.query.prospects.findFirst({
      where: and(eq(schema.prospects.id, id), eq(schema.prospects.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Prospect não encontrado.');
    const [row] = await this.db
      .update(schema.prospects)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.prospects.id, id))
      .returning();
    return row;
  }

  // Fluxo Prospect -> Cliente (prompt-mestre, seção 1: "Prospect → Lead → ... → Cliente")
  async convertToCustomer(orgId: string, id: string) {
    const prospect = await this.db.query.prospects.findFirst({
      where: and(eq(schema.prospects.id, id), eq(schema.prospects.organizationId, orgId)),
    });
    if (!prospect) throw new NotFoundException('Prospect não encontrado.');

    const [customer] = await this.db
      .insert(schema.customers)
      .values({
        organizationId: orgId,
        companyName: prospect.companyName,
        tradeName: prospect.tradeName,
        document: prospect.document,
        segment: prospect.segment,
        size: prospect.size,
        address: prospect.address,
        city: prospect.city,
        state: prospect.state,
        zipCode: prospect.zipCode,
        website: prospect.website,
        phone: prospect.phone,
        whatsapp: prospect.whatsapp,
        email: prospect.email,
        ownerId: prospect.ownerId,
        status: 'active',
        firstPurchaseAt: new Date(),
      })
      .returning();

    await this.db
      .update(schema.prospects)
      .set({ status: 'converted', convertedToCustomerId: customer.id, updatedAt: new Date() })
      .where(eq(schema.prospects.id, id));

    // Migra contatos do prospect para o novo cliente
    await this.db.update(schema.contacts).set({ customerId: customer.id }).where(eq(schema.contacts.prospectId, id));

    this.events.emit('customer.created', customer);
    this.events.emit('prospect.converted', { prospectId: id, customerId: customer.id });
    return customer;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.prospects.findFirst({
      where: and(eq(schema.prospects.id, id), eq(schema.prospects.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Prospect não encontrado.');
    await this.db.delete(schema.prospects).where(eq(schema.prospects.id, id));
    return { success: true };
  }
}
