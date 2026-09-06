import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, ilike, or } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(orgId: string, query: PaginationQueryDto) {
    const conditions = [eq(schema.suppliers.organizationId, orgId)];
    if (query.status) conditions.push(eq(schema.suppliers.status, query.status));
    if (query.search) {
      conditions.push(
        or(
          ilike(schema.suppliers.companyName, `%${query.search}%`),
          ilike(schema.suppliers.document, `%${query.search}%`),
        )!,
      );
    }
    const where = and(...conditions);
    const [{ total }] = await this.db.select({ total: count() }).from(schema.suppliers).where(where);
    const rows = await this.db
      .select()
      .from(schema.suppliers)
      .where(where)
      .orderBy(desc(schema.suppliers.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize);
    return { data: rows, total: Number(total), page: query.page, pageSize: query.pageSize };
  }

  // Fornecedor 360º (prompt-mestre, seção 46)
  async findOne360(orgId: string, id: string) {
    const supplier = await this.db.query.suppliers.findFirst({
      where: and(eq(schema.suppliers.id, id), eq(schema.suppliers.organizationId, orgId)),
    });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado.');
    const [contacts, products] = await Promise.all([
      this.db.select().from(schema.contacts).where(eq(schema.contacts.supplierId, id)),
      this.db.select().from(schema.products).where(eq(schema.products.supplierId, id)),
    ]);
    return { ...supplier, contacts, products };
  }

  async create(orgId: string, dto: CreateSupplierDto) {
    const [row] = await this.db.insert(schema.suppliers).values({ organizationId: orgId, ...dto }).returning();
    return row;
  }

  async update(orgId: string, id: string, dto: UpdateSupplierDto) {
    const existing = await this.db.query.suppliers.findFirst({
      where: and(eq(schema.suppliers.id, id), eq(schema.suppliers.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Fornecedor não encontrado.');
    const [row] = await this.db
      .update(schema.suppliers)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.suppliers.id, id))
      .returning();
    return row;
  }

  async remove(orgId: string, id: string) {
    const existing = await this.db.query.suppliers.findFirst({
      where: and(eq(schema.suppliers.id, id), eq(schema.suppliers.organizationId, orgId)),
    });
    if (!existing) throw new NotFoundException('Fornecedor não encontrado.');
    await this.db.delete(schema.suppliers).where(eq(schema.suppliers.id, id));
    return { success: true };
  }
}
