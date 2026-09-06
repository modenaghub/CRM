import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { desc, eq } from 'drizzle-orm';
import { DB } from '../../db/db.module';
import * as schema from '../../db/schema';
import { Db } from '../../db/client';
import { RegisterOrganizationDto } from './dto/register-organization.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly jwt: JwtService,
  ) {}

  // ------------------------------------------------------------------------
  // REGISTRO DE ORGANIZAÇÃO (onboarding, seção 73 + Vertical Engine, seção 4)
  // ------------------------------------------------------------------------
  async registerOrganization(dto: RegisterOrganizationDto) {
    const existingUser = await this.db.query.users.findFirst({ where: eq(schema.users.email, dto.adminEmail) });
    if (existingUser) {
      throw new BadRequestException('Já existe um usuário cadastrado com este e-mail.');
    }

    const vertical = await this.db.query.verticals.findFirst({ where: eq(schema.verticals.key, dto.segmentKey) });
    if (!vertical) {
      throw new BadRequestException(
        `Segmento "${dto.segmentKey}" não encontrado. Use um dos segmentos disponíveis ou "personalizado".`,
      );
    }

    const template = await this.db.query.verticalTemplates.findFirst({
      where: eq(schema.verticalTemplates.verticalId, vertical.id),
      orderBy: desc(schema.verticalTemplates.version),
    });
    const config: any = template?.config ?? {};
    const modulesToEnable: string[] = config.modules ?? [
      'customers', 'prospects', 'contacts', 'pipelines', 'opportunities', 'tasks', 'calendar',
    ];

    const [org] = await this.db
      .insert(schema.organizations)
      .values({
        name: dto.organizationName,
        document: dto.document,
        segmentKey: vertical.key,
        verticalId: vertical.id,
      })
      .returning();

    await this.db.insert(schema.subscriptions).values({ organizationId: org.id, planKey: 'starter' });

    for (const moduleKey of modulesToEnable) {
      await this.db.insert(schema.organizationModules).values({ organizationId: org.id, moduleKey, enabled: true });
    }

    const [branch] = await this.db
      .insert(schema.branches)
      .values({ organizationId: org.id, name: 'Matriz', isMain: true })
      .returning();

    const [adminRole] = await this.db
      .insert(schema.roles)
      .values({ organizationId: org.id, key: 'admin', name: 'Administrador', isSystem: true })
      .returning();
    await this.db
      .insert(schema.roles)
      .values({ organizationId: org.id, key: 'vendedor', name: 'Vendedor', isSystem: true });

    const allPermissions = await this.db.select().from(schema.permissions);
    for (const perm of allPermissions) {
      await this.db.insert(schema.rolePermissions).values({ roleId: adminRole.id, permissionId: perm.id });
    }

    const passwordHash = bcrypt.hashSync(dto.adminPassword, 10);
    const [user] = await this.db
      .insert(schema.users)
      .values({ name: dto.adminName, email: dto.adminEmail, passwordHash })
      .returning();

    await this.db.insert(schema.memberships).values({
      userId: user.id, organizationId: org.id, roleId: adminRole.id, branchId: branch.id, isOwner: true,
    });

    // Aplica pipeline default do template da vertical (Pipeline Builder, seção 19)
    if (config.pipeline?.stages?.length) {
      const [pipeline] = await this.db
        .insert(schema.pipelines)
        .values({ organizationId: org.id, name: config.pipeline.name ?? 'Comercial', type: 'sales', isDefault: true })
        .returning();
      let order = 0;
      for (const stage of config.pipeline.stages) {
        await this.db.insert(schema.pipelineStages).values({
          pipelineId: pipeline.id,
          name: stage.name,
          order: order++,
          color: stage.color,
          probability: stage.probability ?? 0,
          isWon: !!stage.isWon,
        });
      }
    }

    // Aplica objetos dinâmicos do template (Dynamic Object Engine, seção 17)
    if (config.customObjects?.length) {
      for (const co of config.customObjects) {
        const [customObject] = await this.db
          .insert(schema.customObjects)
          .values({ organizationId: org.id, key: co.key, name: co.name })
          .returning();
        let fieldOrder = 0;
        for (const f of co.fields ?? []) {
          await this.db.insert(schema.customObjectFields).values({
            customObjectId: customObject.id,
            key: f.key,
            label: f.label,
            fieldType: f.fieldType,
            required: !!f.required,
            order: fieldOrder++,
          });
        }
      }
    }

    // Aplica campos personalizados default do template (Custom Field Builder, seção 18)
    if (config.customFields?.length) {
      let cfOrder = 0;
      for (const cf of config.customFields) {
        await this.db.insert(schema.customFields).values({
          organizationId: org.id,
          entityType: cf.entityType,
          key: cf.key,
          label: cf.label,
          fieldType: cf.fieldType,
          order: cfOrder++,
        });
      }
    }

    return this.buildSession(user, org, adminRole, branch, allPermissions.map((p) => `${p.module}:${p.action}`), true);
  }

  // ------------------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------------------
  async login(dto: LoginDto) {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.email, dto.email) });
    if (!user || !user.isActive) throw new UnauthorizedException('E-mail ou senha inválidos.');

    const valid = bcrypt.compareSync(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('E-mail ou senha inválidos.');

    const membership = await this.db.query.memberships.findFirst({ where: eq(schema.memberships.userId, user.id) });
    if (!membership) throw new UnauthorizedException('Este usuário não está vinculado a nenhuma organização.');

    const [org] = await this.db.select().from(schema.organizations).where(eq(schema.organizations.id, membership.organizationId));
    const [role] = await this.db.select().from(schema.roles).where(eq(schema.roles.id, membership.roleId));

    const permissions = await this.db
      .select({ module: schema.permissions.module, action: schema.permissions.action })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
      .where(eq(schema.rolePermissions.roleId, role.id));

    return this.buildSession(
      user,
      org,
      role,
      membership.branchId ? { id: membership.branchId } : null,
      permissions.map((p) => `${p.module}:${p.action}`),
      membership.isOwner,
    );
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    const { iat, exp, ...rest } = payload;
    const accessToken = this.jwt.sign(rest, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    return { accessToken };
  }

  async me(userId: string, orgId: string) {
    const [user] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId));
    const [org] = await this.db.select().from(schema.organizations).where(eq(schema.organizations.id, orgId));
    const orgModules = await this.db
      .select()
      .from(schema.organizationModules)
      .where(eq(schema.organizationModules.organizationId, orgId));

    let templateConfig: any = null;
    if (org.verticalId) {
      const template = await this.db.query.verticalTemplates.findFirst({
        where: eq(schema.verticalTemplates.verticalId, org.verticalId),
        orderBy: desc(schema.verticalTemplates.version),
      });
      templateConfig = template?.config ?? null;
    }

    return {
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      organization: { id: org.id, name: org.name, segmentKey: org.segmentKey, logoUrl: org.logoUrl, primaryColor: org.primaryColor },
      enabledModules: orgModules.filter((m) => m.enabled).map((m) => m.moduleKey),
      verticalTemplate: templateConfig,
    };
  }

  private buildSession(user: any, org: any, role: any, branch: any, permissions: string[], isOwner: boolean) {
    const payload = {
      sub: user.id,
      orgId: org.id,
      branchId: branch?.id ?? null,
      roleKey: role.key,
      isOwner,
      permissions,
      name: user.name,
      email: user.email,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email },
      organization: { id: org.id, name: org.name, segmentKey: org.segmentKey },
    };
  }
}
