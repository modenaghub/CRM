import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import { Db } from '../../db/client';
import * as schema from '../../db/schema';

// Module Engine (seção 3) + Feature Flags (seção 26) do prompt-mestre.
@Injectable()
export class PlatformService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async getModules(orgId: string) {
    const catalog = await this.db.select().from(schema.modules);
    const orgModules = await this.db
      .select()
      .from(schema.organizationModules)
      .where(eq(schema.organizationModules.organizationId, orgId));
    const enabledSet = new Set(orgModules.filter((m) => m.enabled).map((m) => m.moduleKey));
    return catalog.map((m) => ({ ...m, enabled: m.isCore || enabledSet.has(m.key) }));
  }

  async toggleModule(orgId: string, moduleKey: string, enabled: boolean) {
    const existing = await this.db.query.organizationModules.findFirst({
      where: (om, { and }) => and(eq(om.organizationId, orgId), eq(om.moduleKey, moduleKey)),
    });
    if (existing) {
      await this.db
        .update(schema.organizationModules)
        .set({ enabled })
        .where(eq(schema.organizationModules.id, existing.id));
    } else {
      await this.db.insert(schema.organizationModules).values({ organizationId: orgId, moduleKey, enabled });
    }
    return { moduleKey, enabled };
  }

  async getFeatureFlags(orgId: string) {
    const flags = await this.db.select().from(schema.featureFlags);
    const overrides = await this.db
      .select()
      .from(schema.organizationFeatureFlags)
      .where(eq(schema.organizationFeatureFlags.organizationId, orgId));
    const overrideMap = new Map(overrides.map((o) => [o.flagKey, o.enabled]));
    return flags.map((f) => ({ ...f, enabled: overrideMap.has(f.key) ? overrideMap.get(f.key) : f.defaultOn }));
  }

  async getPlan(orgId: string) {
    const sub = await this.db.query.subscriptions.findFirst({ where: eq(schema.subscriptions.organizationId, orgId) });
    if (!sub) return null;
    const plan = await this.db.query.plans.findFirst({ where: eq(schema.plans.key, sub.planKey) });
    return { ...sub, plan };
  }
}
