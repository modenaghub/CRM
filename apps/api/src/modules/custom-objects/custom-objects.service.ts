import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreateCustomObjectDto } from './dto/create-custom-object.dto';

@Injectable()
export class CustomObjectsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string) {
    const objects = await this.db.select().from(schema.customObjects).where(eq(schema.customObjects.organizationId, orgId));
    const result: any[] = [];
    for (const obj of objects) {
      const fields = await this.db
        .select()
        .from(schema.customObjectFields)
        .where(eq(schema.customObjectFields.customObjectId, obj.id))
        .orderBy(asc(schema.customObjectFields.order));
      result.push({ ...obj, fields });
    }
    return result;
  }

  async create(orgId: string, dto: CreateCustomObjectDto) {
    const [obj] = await this.db
      .insert(schema.customObjects)
      .values({ organizationId: orgId, key: dto.key, name: dto.name, description: dto.description, icon: dto.icon })
      .returning();
    const fields: (typeof schema.customObjectFields.$inferSelect)[] = [];
    let order = 0;
    for (const f of dto.fields ?? []) {
      const [field] = await this.db
        .insert(schema.customObjectFields)
        .values({ customObjectId: obj.id, key: f.key, label: f.label, fieldType: f.fieldType, required: !!f.required, order: order++ })
        .returning();
      fields.push(field);
    }
    return { ...obj, fields };
  }

  private async getObjectByKey(orgId: string, key: string) {
    const obj = await this.db.query.customObjects.findFirst({
      where: and(eq(schema.customObjects.organizationId, orgId), eq(schema.customObjects.key, key)),
    });
    if (!obj) throw new NotFoundException(`Objeto personalizado "${key}" não encontrado.`);
    return obj;
  }

  async listRecords(orgId: string, key: string) {
    const obj = await this.getObjectByKey(orgId, key);
    return this.db.select().from(schema.customObjectRecords).where(eq(schema.customObjectRecords.customObjectId, obj.id));
  }

  async createRecord(orgId: string, key: string, data: Record<string, any>, createdById: string) {
    const obj = await this.getObjectByKey(orgId, key);
    const [row] = await this.db
      .insert(schema.customObjectRecords)
      .values({ customObjectId: obj.id, data, createdById })
      .returning();
    return row;
  }

  async updateRecord(orgId: string, key: string, id: string, data: Record<string, any>) {
    const obj = await this.getObjectByKey(orgId, key);
    const existing = await this.db.query.customObjectRecords.findFirst({
      where: and(eq(schema.customObjectRecords.id, id), eq(schema.customObjectRecords.customObjectId, obj.id)),
    });
    if (!existing) throw new NotFoundException('Registro não encontrado.');
    const [row] = await this.db
      .update(schema.customObjectRecords)
      .set({ data: { ...(existing.data as object), ...data }, updatedAt: new Date() })
      .where(eq(schema.customObjectRecords.id, id))
      .returning();
    return row;
  }

  async removeRecord(orgId: string, key: string, id: string) {
    const obj = await this.getObjectByKey(orgId, key);
    await this.db
      .delete(schema.customObjectRecords)
      .where(and(eq(schema.customObjectRecords.id, id), eq(schema.customObjectRecords.customObjectId, obj.id)));
    return { success: true };
  }
}
