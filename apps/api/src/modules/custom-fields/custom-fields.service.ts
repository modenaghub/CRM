import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';

const ENTITY_COLUMN_MAP = {
  customer: schema.customFieldValues.customerId,
  prospect: schema.customFieldValues.prospectId,
  supplier: schema.customFieldValues.supplierId,
  product: schema.customFieldValues.productId,
} as const;

@Injectable()
export class CustomFieldsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string, entityType?: string) {
    const conditions = [eq(schema.customFields.organizationId, orgId)];
    if (entityType) conditions.push(eq(schema.customFields.entityType, entityType));
    return this.db
      .select()
      .from(schema.customFields)
      .where(and(...conditions))
      .orderBy(asc(schema.customFields.order));
  }

  async create(orgId: string, dto: CreateCustomFieldDto) {
    const [row] = await this.db
      .insert(schema.customFields)
      .values({
        organizationId: orgId,
        entityType: dto.entityType,
        key: dto.key,
        label: dto.label,
        fieldType: dto.fieldType,
        required: !!dto.required,
        options: dto.options,
      })
      .returning();
    return row;
  }

  async remove(orgId: string, id: string) {
    await this.db.delete(schema.customFields).where(and(eq(schema.customFields.id, id), eq(schema.customFields.organizationId, orgId)));
    return { success: true };
  }

  async getValues(entityType: keyof typeof ENTITY_COLUMN_MAP, entityId: string) {
    const column = ENTITY_COLUMN_MAP[entityType];
    if (!column) return [];
    return this.db.select().from(schema.customFieldValues).where(eq(column, entityId));
  }

  async setValue(entityType: keyof typeof ENTITY_COLUMN_MAP, entityId: string, customFieldId: string, value: any) {
    const column = ENTITY_COLUMN_MAP[entityType];
    const existing = await this.db.query.customFieldValues.findFirst({
      where: and(eq(schema.customFieldValues.customFieldId, customFieldId), eq(column as any, entityId)),
    });
    if (existing) {
      const [row] = await this.db
        .update(schema.customFieldValues)
        .set({ value })
        .where(eq(schema.customFieldValues.id, existing.id))
        .returning();
      return row;
    }
    const values: any = { customFieldId, entityType, value };
    values[`${entityType}Id`] = entityId;
    const [row] = await this.db.insert(schema.customFieldValues).values(values).returning();
    return row;
  }
}
