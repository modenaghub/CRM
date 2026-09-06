import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string, relatedTo?: { customerId?: string; prospectId?: string; supplierId?: string }) {
    const conditions = [eq(schema.contacts.organizationId, orgId)];
    if (relatedTo?.customerId) conditions.push(eq(schema.contacts.customerId, relatedTo.customerId));
    if (relatedTo?.prospectId) conditions.push(eq(schema.contacts.prospectId, relatedTo.prospectId));
    if (relatedTo?.supplierId) conditions.push(eq(schema.contacts.supplierId, relatedTo.supplierId));
    return this.db.select().from(schema.contacts).where(and(...conditions));
  }

  async create(orgId: string, dto: CreateContactDto) {
    const [row] = await this.db.insert(schema.contacts).values({ organizationId: orgId, ...dto }).returning();
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateContactDto) {
    const existing = await this.db.query.contacts.findFirst({
      where: and(eq(schema.contacts.id, id), eq(schema.contacts.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Contato não encontrado.');
    const [row] = await this.db
      .update(schema.contacts)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.contacts.id, id))
      .returning();
    return row;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.contacts.findFirst({
      where: and(eq(schema.contacts.id, id), eq(schema.contacts.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Contato não encontrado.');
    await this.db.delete(schema.contacts).where(eq(schema.contacts.id, id));
    return { success: true };
  }
}
