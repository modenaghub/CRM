import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';

@Injectable()
export class VerticalsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  // Alimenta o seletor de segmento do onboarding (prompt-mestre, seção 4)
  async listAll() {
    return this.db.select().from(schema.verticals);
  }

  async getTemplate(verticalKey: string) {
    const vertical = await this.db.query.verticals.findFirst({ where: eq(schema.verticals.key, verticalKey) });
    if (!vertical) return null;
    const template = await this.db.query.verticalTemplates.findFirst({
      where: eq(schema.verticalTemplates.verticalId, vertical.id),
      orderBy: desc(schema.verticalTemplates.version),
    });
    return { vertical, config: template?.config ?? null };
  }
}
