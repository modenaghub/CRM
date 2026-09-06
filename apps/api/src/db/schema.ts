// ============================================================================
// CRM PLATFORM — SCHEMA (Drizzle ORM / PostgreSQL)
// Núcleo (CRM Core) + Camada Estratégica (Module Engine / Vertical Engine /
// Dynamic Object Engine / Feature Flags / Planos)
//
// Regra arquitetural fundamental (prompt-mestre, seção 33): nenhuma coluna
// específica de um segmento deve ser adicionada às tabelas core abaixo.
// Campos e objetos de vertical são sempre modelados via customFields /
// customObjects (Dynamic Object Engine).
// ============================================================================

import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

const cid = () => text('id').primaryKey().$defaultFn(() => createId());
const orgCol = () => text('organization_id').notNull();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

// ----------------------------------------------------------------------------
// PLATAFORMA
// ----------------------------------------------------------------------------

export const organizations = pgTable('organizations', {
  id: cid(),
  name: text('name').notNull(),
  tradeName: text('trade_name'),
  document: text('document'),
  segmentKey: text('segment_key'),
  verticalId: text('vertical_id'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color'),
  domain: text('domain'),
  status: text('status').notNull().default('active'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const branches = pgTable('branches', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  code: text('code'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  isMain: boolean('is_main').notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({ orgIdx: index('branches_org_idx').on(t.organizationId) }));

export const users = pgTable('users', {
  id: cid(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const roles = pgTable('roles', {
  id: cid(),
  organizationId: orgCol(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  isSystem: boolean('is_system').notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({
  orgKeyUnique: unique('roles_org_key_unique').on(t.organizationId, t.key),
}));

export const memberships = pgTable('memberships', {
  id: cid(),
  userId: text('user_id').notNull(),
  organizationId: orgCol(),
  branchId: text('branch_id'),
  roleId: text('role_id').notNull(),
  isOwner: boolean('is_owner').notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({
  userOrgUnique: unique('memberships_user_org_unique').on(t.userId, t.organizationId),
  orgIdx: index('memberships_org_idx').on(t.organizationId),
}));

export const permissions = pgTable('permissions', {
  id: cid(),
  module: text('module').notNull(),
  action: text('action').notNull(),
}, (t) => ({
  moduleActionUnique: unique('permissions_module_action_unique').on(t.module, t.action),
}));

export const rolePermissions = pgTable('role_permissions', {
  id: cid(),
  roleId: text('role_id').notNull(),
  permissionId: text('permission_id').notNull(),
}, (t) => ({
  roleFlagUnique: unique('role_permissions_unique').on(t.roleId, t.permissionId),
}));

export const teams = pgTable('teams', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  createdAt: createdAt(),
});

export const teamMembers = pgTable('team_members', {
  id: cid(),
  teamId: text('team_id').notNull(),
  userId: text('user_id').notNull(),
}, (t) => ({ teamUserUnique: unique('team_members_unique').on(t.teamId, t.userId) }));

// Módulos (Module Engine)
export const modules = pgTable('modules', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isCore: boolean('is_core').notNull().default(false),
});

export const organizationModules = pgTable('organization_modules', {
  id: cid(),
  organizationId: orgCol(),
  moduleKey: text('module_key').notNull(),
  enabled: boolean('enabled').notNull().default(true),
}, (t) => ({
  orgModuleUnique: unique('organization_modules_unique').on(t.organizationId, t.moduleKey),
}));

// Planos
export const plans = pgTable('plans', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
});

export const planModules = pgTable('plan_modules', {
  id: cid(),
  planKey: text('plan_key').notNull(),
  moduleKey: text('module_key').notNull(),
}, (t) => ({ planModuleUnique: unique('plan_modules_unique').on(t.planKey, t.moduleKey) }));

export const subscriptions = pgTable('subscriptions', {
  id: cid(),
  organizationId: orgCol().unique(),
  planKey: text('plan_key').notNull(),
  status: text('status').notNull().default('active'),
  startedAt: createdAt(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
});

// Feature flags
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  description: text('description'),
  defaultOn: boolean('default_on').notNull().default(false),
});

export const organizationFeatureFlags = pgTable('organization_feature_flags', {
  id: cid(),
  organizationId: orgCol(),
  flagKey: text('flag_key').notNull(),
  enabled: boolean('enabled').notNull(),
}, (t) => ({ orgFlagUnique: unique('org_feature_flags_unique').on(t.organizationId, t.flagKey) }));

// Verticais (Vertical Engine)
export const verticals = pgTable('verticals', {
  id: cid(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isCustom: boolean('is_custom').notNull().default(false),
});

export const verticalTemplates = pgTable('vertical_templates', {
  id: cid(),
  verticalId: text('vertical_id').notNull(),
  version: integer('version').notNull().default(1),
  config: jsonb('config').notNull().$type<Record<string, any>>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: createdAt(),
}, (t) => ({ verticalIdx: index('vertical_templates_vertical_idx').on(t.verticalId) }));

// ----------------------------------------------------------------------------
// CRM CORE — CADASTROS
// ----------------------------------------------------------------------------

export const prospects = pgTable('prospects', {
  id: cid(),
  organizationId: orgCol(),
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  document: text('document'),
  companyType: text('company_type'),
  segment: text('segment'),
  subsegment: text('subsegment'),
  size: text('size'),
  estimatedRevenue: numeric('estimated_revenue', { precision: 14, scale: 2 }),
  employeesCount: integer('employees_count'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('Brasil'),
  website: text('website'),
  instagram: text('instagram'),
  facebook: text('facebook'),
  linkedin: text('linkedin'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  origin: text('origin'),
  ownerId: text('owner_id'),
  region: text('region'),
  potential: text('potential'),
  productsOfInterest: text('products_of_interest'),
  observations: text('observations'),
  score: integer('score').notNull().default(0),
  status: text('status').notNull().default('open'),
  convertedToCustomerId: text('converted_to_customer_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  orgIdx: index('prospects_org_idx').on(t.organizationId),
  orgStatusIdx: index('prospects_org_status_idx').on(t.organizationId, t.status),
}));

export const customers = pgTable('customers', {
  id: cid(),
  organizationId: orgCol(),
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  document: text('document'),
  stateRegistration: text('state_registration'),
  municipalRegistration: text('municipal_registration'),
  cnae: text('cnae'),
  taxRegime: text('tax_regime'),
  segment: text('segment'),
  size: text('size'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  country: text('country').default('Brasil'),
  website: text('website'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  ownerId: text('owner_id'),
  priceTable: text('price_table'),
  paymentTerms: text('payment_terms'),
  creditLimit: numeric('credit_limit', { precision: 14, scale: 2 }),
  commercialRegion: text('commercial_region'),
  abcClassification: text('abc_classification'),
  score: integer('score').notNull().default(0),
  status: text('status').notNull().default('active'),
  firstPurchaseAt: timestamp('first_purchase_at', { withTimezone: true }),
  lastPurchaseAt: timestamp('last_purchase_at', { withTimezone: true }),
  ticketAverage: numeric('ticket_average', { precision: 14, scale: 2 }),
  ltv: numeric('ltv', { precision: 14, scale: 2 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  orgIdx: index('customers_org_idx').on(t.organizationId),
  orgStatusIdx: index('customers_org_status_idx').on(t.organizationId, t.status),
}));

export const suppliers = pgTable('suppliers', {
  id: cid(),
  organizationId: orgCol(),
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  document: text('document'),
  segment: text('segment'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  categories: text('categories'),
  commercialTerms: text('commercial_terms'),
  leadTimeDays: integer('lead_time_days'),
  rating: integer('rating'),
  performanceScore: integer('performance_score'),
  slaDays: integer('sla_days'),
  status: text('status').notNull().default('active'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ orgIdx: index('suppliers_org_idx').on(t.organizationId) }));

export const contacts = pgTable('contacts', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  jobTitle: text('job_title'),
  department: text('department'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  birthday: timestamp('birthday', { withTimezone: true }),
  observations: text('observations'),
  isPrimary: boolean('is_primary').notNull().default(false),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  supplierId: text('supplier_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  orgIdx: index('contacts_org_idx').on(t.organizationId),
  customerIdx: index('contacts_customer_idx').on(t.customerId),
  prospectIdx: index('contacts_prospect_idx').on(t.prospectId),
  supplierIdx: index('contacts_supplier_idx').on(t.supplierId),
}));

export const productCategories = pgTable('product_categories', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  parentId: text('parent_id'),
});

export const products = pgTable('products', {
  id: cid(),
  organizationId: orgCol(),
  code: text('code'),
  sku: text('sku'),
  ean: text('ean'),
  name: text('name').notNull(),
  description: text('description'),
  categoryId: text('category_id'),
  brand: text('brand'),
  unit: text('unit'),
  weight: numeric('weight', { precision: 10, scale: 3 }),
  dimensions: text('dimensions'),
  ncm: text('ncm'),
  origin: text('origin'),
  cost: numeric('cost', { precision: 14, scale: 2 }),
  price: numeric('price', { precision: 14, scale: 2 }),
  stock: numeric('stock', { precision: 14, scale: 3 }),
  minStock: numeric('min_stock', { precision: 14, scale: 3 }),
  supplierId: text('supplier_id'),
  status: text('status').notNull().default('active'),
  photos: jsonb('photos').$type<string[]>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ orgIdx: index('products_org_idx').on(t.organizationId) }));

export const services = pgTable('services', {
  id: cid(),
  organizationId: orgCol(),
  code: text('code'),
  name: text('name').notNull(),
  categoryId: text('category_id'),
  description: text('description'),
  value: numeric('value', { precision: 14, scale: 2 }),
  cost: numeric('cost', { precision: 14, scale: 2 }),
  durationMinutes: integer('duration_minutes'),
  responsibleId: text('responsible_id'),
  status: text('status').notNull().default('active'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ orgIdx: index('services_org_idx').on(t.organizationId) }));

// ----------------------------------------------------------------------------
// PIPELINE BUILDER + FUNIL
// ----------------------------------------------------------------------------

export const pipelines = pgTable('pipelines', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  type: text('type').notNull().default('sales'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({ orgIdx: index('pipelines_org_idx').on(t.organizationId) }));

export const pipelineStages = pgTable('pipeline_stages', {
  id: cid(),
  pipelineId: text('pipeline_id').notNull(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
  color: text('color'),
  probability: integer('probability').notNull().default(0),
  slaHours: integer('sla_hours'),
  isWon: boolean('is_won').notNull().default(false),
  isLost: boolean('is_lost').notNull().default(false),
}, (t) => ({ pipelineIdx: index('pipeline_stages_pipeline_idx').on(t.pipelineId) }));

export const opportunities = pgTable('opportunities', {
  id: cid(),
  organizationId: orgCol(),
  title: text('title').notNull(),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  ownerId: text('owner_id'),
  pipelineId: text('pipeline_id').notNull(),
  stageId: text('stage_id').notNull(),
  value: numeric('value', { precision: 14, scale: 2 }),
  discount: numeric('discount', { precision: 14, scale: 2 }),
  probability: integer('probability').notNull().default(0),
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  origin: text('origin'),
  status: text('status').notNull().default('open'),
  lostReason: text('lost_reason'),
  stageChangedAt: timestamp('stage_changed_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  orgIdx: index('opportunities_org_idx').on(t.organizationId),
  orgStatusIdx: index('opportunities_org_status_idx').on(t.organizationId, t.status),
  stageIdx: index('opportunities_stage_idx').on(t.pipelineId, t.stageId),
}));

export const opportunityItems = pgTable('opportunity_items', {
  id: cid(),
  opportunityId: text('opportunity_id').notNull(),
  productId: text('product_id'),
  serviceId: text('service_id'),
  quantity: numeric('quantity', { precision: 14, scale: 3 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }).notNull(),
  discount: numeric('discount', { precision: 14, scale: 2 }).notNull().default('0'),
});

export const opportunityStageHistory = pgTable('opportunity_stage_history', {
  id: cid(),
  opportunityId: text('opportunity_id').notNull(),
  fromStageId: text('from_stage_id'),
  toStageId: text('to_stage_id').notNull(),
  changedById: text('changed_by_id'),
  changedAt: createdAt(),
});

// ----------------------------------------------------------------------------
// VENDAS / COMPRAS (schema pronto — API completa prevista para próxima fase)
// ----------------------------------------------------------------------------

export const quotes = pgTable('quotes', {
  id: cid(),
  organizationId: orgCol(),
  opportunityId: text('opportunity_id'),
  customerId: text('customer_id'),
  status: text('status').notNull().default('draft'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  totalValue: numeric('total_value', { precision: 14, scale: 2 }),
  createdAt: createdAt(),
});

export const salesOrders = pgTable('sales_orders', {
  id: cid(),
  organizationId: orgCol(),
  customerId: text('customer_id'),
  status: text('status').notNull().default('pending'),
  totalValue: numeric('total_value', { precision: 14, scale: 2 }),
  createdAt: createdAt(),
});

export const purchaseOrders = pgTable('purchase_orders', {
  id: cid(),
  organizationId: orgCol(),
  supplierId: text('supplier_id'),
  status: text('status').notNull().default('pending'),
  totalValue: numeric('total_value', { precision: 14, scale: 2 }),
  createdAt: createdAt(),
});

// ----------------------------------------------------------------------------
// AGENDA / ATIVIDADES
// ----------------------------------------------------------------------------

export const activityTasks = pgTable('activity_tasks', {
  id: cid(),
  organizationId: orgCol(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: timestamp('due_at', { withTimezone: true }),
  priority: text('priority').notNull().default('normal'),
  status: text('status').notNull().default('pending'),
  assigneeId: text('assignee_id'),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  opportunityId: text('opportunity_id'),
  reminderAt: timestamp('reminder_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({
  orgIdx: index('activity_tasks_org_idx').on(t.organizationId),
  orgStatusIdx: index('activity_tasks_org_status_idx').on(t.organizationId, t.status),
  assigneeIdx: index('activity_tasks_assignee_idx').on(t.assigneeId),
}));

export const meetings = pgTable('meetings', {
  id: cid(),
  organizationId: orgCol(),
  title: text('title').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  location: text('location'),
  meetingLink: text('meeting_link'),
  customerId: text('customer_id'),
  createdAt: createdAt(),
});

// ----------------------------------------------------------------------------
// NOTAS, ANEXOS, TAGS
// ----------------------------------------------------------------------------

export const notes = pgTable('notes', {
  id: cid(),
  organizationId: orgCol(),
  body: text('body').notNull(),
  authorId: text('author_id'),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  opportunityId: text('opportunity_id'),
  createdAt: createdAt(),
});

export const attachments = pgTable('attachments', {
  id: cid(),
  organizationId: orgCol(),
  fileName: text('file_name').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type'),
  size: integer('size'),
  uploadedById: text('uploaded_by_id'),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  supplierId: text('supplier_id'),
  opportunityId: text('opportunity_id'),
  createdAt: createdAt(),
});

export const tags = pgTable('tags', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  color: text('color'),
}, (t) => ({ orgNameUnique: unique('tags_org_name_unique').on(t.organizationId, t.name) }));

export const tagLinks = pgTable('tag_links', {
  id: cid(),
  tagId: text('tag_id').notNull(),
  entityType: text('entity_type').notNull(),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  supplierId: text('supplier_id'),
  productId: text('product_id'),
  opportunityId: text('opportunity_id'),
}, (t) => ({ tagIdx: index('tag_links_tag_idx').on(t.tagId) }));

// ----------------------------------------------------------------------------
// CUSTOM FIELD BUILDER
// ----------------------------------------------------------------------------

export const customFields = pgTable('custom_fields', {
  id: cid(),
  organizationId: orgCol(),
  entityType: text('entity_type').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  fieldType: text('field_type').notNull(),
  required: boolean('required').notNull().default(false),
  visible: boolean('visible').notNull().default(true),
  editable: boolean('editable').notNull().default(true),
  defaultValue: text('default_value'),
  validationRule: text('validation_rule'),
  options: jsonb('options').$type<any[]>(),
  order: integer('order').notNull().default(0),
  createdAt: createdAt(),
}, (t) => ({
  orgEntityKeyUnique: unique('custom_fields_unique').on(t.organizationId, t.entityType, t.key),
}));

export const customFieldValues = pgTable('custom_field_values', {
  id: cid(),
  customFieldId: text('custom_field_id').notNull(),
  entityType: text('entity_type').notNull(),
  customerId: text('customer_id'),
  prospectId: text('prospect_id'),
  supplierId: text('supplier_id'),
  productId: text('product_id'),
  value: jsonb('value').$type<any>(),
});

// ----------------------------------------------------------------------------
// DYNAMIC OBJECT ENGINE
// ----------------------------------------------------------------------------

export const customObjects = pgTable('custom_objects', {
  id: cid(),
  organizationId: orgCol(),
  key: text('key').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  createdAt: createdAt(),
}, (t) => ({ orgKeyUnique: unique('custom_objects_org_key_unique').on(t.organizationId, t.key) }));

export const customObjectFields = pgTable('custom_object_fields', {
  id: cid(),
  customObjectId: text('custom_object_id').notNull(),
  key: text('key').notNull(),
  label: text('label').notNull(),
  fieldType: text('field_type').notNull(),
  required: boolean('required').notNull().default(false),
  options: jsonb('options').$type<any[]>(),
  order: integer('order').notNull().default(0),
}, (t) => ({ objectKeyUnique: unique('custom_object_fields_unique').on(t.customObjectId, t.key) }));

export const customObjectRecords = pgTable('custom_object_records', {
  id: cid(),
  customObjectId: text('custom_object_id').notNull(),
  data: jsonb('data').notNull().$type<Record<string, any>>(),
  relatedCustomerId: text('related_customer_id'),
  relatedProspectId: text('related_prospect_id'),
  relatedSupplierId: text('related_supplier_id'),
  createdById: text('created_by_id'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => ({ objectIdx: index('custom_object_records_object_idx').on(t.customObjectId) }));

// ----------------------------------------------------------------------------
// WORKFLOW BUILDER / EVENT BUS (config persistida) + NOTIFICAÇÕES
// ----------------------------------------------------------------------------

export const automations = pgTable('automations', {
  id: cid(),
  organizationId: orgCol(),
  name: text('name').notNull(),
  triggerEvent: text('trigger_event').notNull(),
  conditions: jsonb('conditions').$type<any[]>(),
  actions: jsonb('actions').notNull().$type<any[]>(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: createdAt(),
}, (t) => ({ orgIdx: index('automations_org_idx').on(t.organizationId) }));

export const notifications = pgTable('notifications', {
  id: cid(),
  organizationId: orgCol(),
  userId: text('user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  read: boolean('read').notNull().default(false),
  createdAt: createdAt(),
}, (t) => ({ orgUserIdx: index('notifications_org_user_idx').on(t.organizationId, t.userId) }));

// ----------------------------------------------------------------------------
// METAS / AUDITORIA
// ----------------------------------------------------------------------------

export const goals = pgTable('goals', {
  id: cid(),
  organizationId: orgCol(),
  scopeType: text('scope_type').notNull(),
  scopeId: text('scope_id'),
  metric: text('metric').notNull(),
  targetValue: numeric('target_value', { precision: 14, scale: 2 }).notNull(),
  achievedValue: numeric('achieved_value', { precision: 14, scale: 2 }).notNull().default('0'),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: cid(),
  organizationId: orgCol(),
  userId: text('user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  before: jsonb('before').$type<any>(),
  after: jsonb('after').$type<any>(),
  createdAt: createdAt(),
}, (t) => ({
  orgIdx: index('audit_logs_org_idx').on(t.organizationId),
  entityIdx: index('audit_logs_entity_idx').on(t.entityType, t.entityId),
}));

// ----------------------------------------------------------------------------
// RELATIONS (para queries aninhadas via db.query.*)
// ----------------------------------------------------------------------------

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  customers: many(customers),
  prospects: many(prospects),
  suppliers: many(suppliers),
  products: many(products),
  pipelines: many(pipelines),
  opportunities: many(opportunities),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
  role: one(roles, { fields: [memberships.roleId], references: [roles.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  memberships: many(memberships),
  rolePermissions: many(rolePermissions),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  contacts: many(contacts),
  opportunities: many(opportunities),
  tasks: many(activityTasks),
  notes: many(notes),
}));

export const prospectsRelations = relations(prospects, ({ many }) => ({
  contacts: many(contacts),
  opportunities: many(opportunities),
  tasks: many(activityTasks),
  notes: many(notes),
}));

export const pipelinesRelations = relations(pipelines, ({ many }) => ({
  stages: many(pipelineStages),
  opportunities: many(opportunities),
}));

export const pipelineStagesRelations = relations(pipelineStages, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [pipelineStages.pipelineId], references: [pipelines.id] }),
  opportunities: many(opportunities),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  pipeline: one(pipelines, { fields: [opportunities.pipelineId], references: [pipelines.id] }),
  stage: one(pipelineStages, { fields: [opportunities.stageId], references: [pipelineStages.id] }),
  customer: one(customers, { fields: [opportunities.customerId], references: [customers.id] }),
  prospect: one(prospects, { fields: [opportunities.prospectId], references: [prospects.id] }),
  items: many(opportunityItems),
  stageHistory: many(opportunityStageHistory),
}));

export const verticalsRelations = relations(verticals, ({ many }) => ({
  templates: many(verticalTemplates),
}));

export const verticalTemplatesRelations = relations(verticalTemplates, ({ one }) => ({
  vertical: one(verticals, { fields: [verticalTemplates.verticalId], references: [verticals.id] }),
}));

export const customObjectsRelations = relations(customObjects, ({ many }) => ({
  fields: many(customObjectFields),
  records: many(customObjectRecords),
}));

export const customObjectFieldsRelations = relations(customObjectFields, ({ one }) => ({
  customObject: one(customObjects, { fields: [customObjectFields.customObjectId], references: [customObjects.id] }),
}));

export const customObjectRecordsRelations = relations(customObjectRecords, ({ one }) => ({
  customObject: one(customObjects, { fields: [customObjectRecords.customObjectId], references: [customObjects.id] }),
}));
