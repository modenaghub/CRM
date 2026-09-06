import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const MODULE_CATALOG: Array<{ key: string; name: string; isCore?: boolean }> = [
  { key: 'customers', name: 'Clientes', isCore: true },
  { key: 'prospects', name: 'Prospects', isCore: true },
  { key: 'suppliers', name: 'Fornecedores' },
  { key: 'contacts', name: 'Contatos', isCore: true },
  { key: 'products', name: 'Produtos' },
  { key: 'services', name: 'Serviços' },
  { key: 'opportunities', name: 'Oportunidades', isCore: true },
  { key: 'pipelines', name: 'Pipelines', isCore: true },
  { key: 'sales', name: 'Vendas' },
  { key: 'purchases', name: 'Compras' },
  { key: 'whatsapp', name: 'WhatsApp' },
  { key: 'email', name: 'E-mail' },
  { key: 'calendar', name: 'Agenda' },
  { key: 'tasks', name: 'Tarefas', isCore: true },
  { key: 'automation', name: 'Automação' },
  { key: 'bi', name: 'Relatórios & BI' },
  { key: 'ai', name: 'Inteligência Artificial' },
  { key: 'custom_objects', name: 'Objetos Personalizados' },
];

const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'];

const PLAN_MODULES: Record<string, string[]> = {
  starter: ['customers', 'prospects', 'contacts', 'pipelines', 'opportunities', 'tasks', 'calendar'],
  professional: [
    'customers', 'prospects', 'contacts', 'pipelines', 'opportunities', 'tasks', 'calendar',
    'whatsapp', 'email', 'automation', 'bi', 'sales', 'purchases', 'suppliers', 'products', 'services',
  ],
  business: [
    'customers', 'prospects', 'contacts', 'pipelines', 'opportunities', 'tasks', 'calendar',
    'whatsapp', 'email', 'automation', 'bi', 'sales', 'purchases', 'suppliers', 'products', 'services',
    'ai', 'custom_objects',
  ],
  enterprise: MODULE_CATALOG.map((m) => m.key),
};

const FEATURE_FLAGS = [
  { key: 'whatsapp', description: 'Central de WhatsApp', defaultOn: false },
  { key: 'ai_copilot', description: 'Copiloto Comercial (IA)', defaultOn: false },
  { key: 'custom_objects', description: 'Dynamic Object Engine', defaultOn: false },
  { key: 'multi_branch', description: 'Múltiplas filiais', defaultOn: false },
  { key: 'api_access', description: 'API pública / API Keys', defaultOn: false },
  { key: 'white_label', description: 'White label', defaultOn: false },
];

// Template completo — Vertical Indústria (prompt-mestre, Parte I, seção 6)
const INDUSTRIA_TEMPLATE = {
  modules: PLAN_MODULES.business,
  menu: [
    'dashboard', 'customers', 'prospects', 'contacts', 'opportunities', 'products',
    'suppliers', 'purchases', 'sales', 'whatsapp', 'email', 'calendar', 'tasks', 'bi', 'ai', 'settings',
  ],
  pipeline: {
    name: 'Comercial Indústria',
    stages: [
      { name: 'Prospecção', probability: 5, color: '#94a3b8' },
      { name: 'Contato', probability: 15, color: '#60a5fa' },
      { name: 'Qualificação', probability: 30, color: '#38bdf8' },
      { name: 'Amostra/Teste', probability: 45, color: '#22d3ee' },
      { name: 'Proposta', probability: 60, color: '#a78bfa' },
      { name: 'Negociação', probability: 75, color: '#f59e0b' },
      { name: 'Pedido', probability: 90, color: '#fb923c' },
      { name: 'Cliente ativo', probability: 100, color: '#22c55e', isWon: true },
    ],
  },
  customFields: [
    { entityType: 'customer', key: 'territorio', label: 'Território', fieldType: 'text' },
    { entityType: 'customer', key: 'representante', label: 'Representante', fieldType: 'text' },
  ],
  dashboardKpis: ['faturamento', 'volume', 'margem', 'clientes_ativos', 'positivacao', 'mix', 'ticket', 'frequencia'],
  terminologies: { customer: 'Cliente B2B', prospect: 'Prospect Industrial' },
};

// Template completo — Vertical Oficina (prompt-mestre, Parte I, seção 14)
const OFICINA_TEMPLATE = {
  modules: ['customers', 'prospects', 'contacts', 'pipelines', 'opportunities', 'tasks', 'calendar', 'products', 'custom_objects', 'whatsapp', 'bi'],
  menu: ['dashboard', 'customers', 'custom_objects.veiculo', 'opportunities', 'products', 'calendar', 'tasks', 'whatsapp', 'bi', 'settings'],
  pipeline: {
    name: 'Ordens de Serviço',
    stages: [
      { name: 'Orçamento solicitado', probability: 10, color: '#94a3b8' },
      { name: 'Orçamento enviado', probability: 30, color: '#60a5fa' },
      { name: 'Aprovado', probability: 60, color: '#a78bfa' },
      { name: 'Em execução', probability: 80, color: '#f59e0b' },
      { name: 'Concluído', probability: 100, color: '#22c55e', isWon: true },
    ],
  },
  customObjects: [
    {
      key: 'veiculo',
      name: 'Veículo',
      fields: [
        { key: 'placa', label: 'Placa', fieldType: 'text', required: true },
        { key: 'modelo', label: 'Modelo', fieldType: 'text' },
        { key: 'marca', label: 'Marca', fieldType: 'text' },
        { key: 'ano', label: 'Ano', fieldType: 'number' },
        { key: 'quilometragem', label: 'Quilometragem', fieldType: 'number' },
      ],
    },
  ],
  dashboardKpis: ['ordens_abertas', 'ticket_medio_os', 'retorno', 'veiculos_ativos'],
  terminologies: { customer: 'Cliente', opportunity: 'Ordem de Serviço' },
};

async function main() {
  console.log('Seed: catálogo de módulos...');
  for (const m of MODULE_CATALOG) {
    await db.insert(schema.modules).values(m).onConflictDoNothing();
  }

  console.log('Seed: permissões...');
  for (const m of MODULE_CATALOG) {
    for (const action of PERMISSION_ACTIONS) {
      await db.insert(schema.permissions).values({ module: m.key, action }).onConflictDoNothing();
    }
  }

  console.log('Seed: planos...');
  const planRows = [
    { key: 'starter', name: 'Starter', order: 1 },
    { key: 'professional', name: 'Professional', order: 2 },
    { key: 'business', name: 'Business', order: 3 },
    { key: 'enterprise', name: 'Enterprise', order: 4 },
  ];
  for (const p of planRows) {
    await db.insert(schema.plans).values(p).onConflictDoNothing();
  }
  for (const [planKey, moduleKeys] of Object.entries(PLAN_MODULES)) {
    for (const moduleKey of moduleKeys) {
      await db.insert(schema.planModules).values({ planKey, moduleKey }).onConflictDoNothing();
    }
  }

  console.log('Seed: feature flags...');
  for (const f of FEATURE_FLAGS) {
    await db.insert(schema.featureFlags).values(f).onConflictDoNothing();
  }

  console.log('Seed: verticais + templates...');
  const verticalRows = [
    { key: 'industria', name: 'Indústria' },
    { key: 'distribuidora', name: 'Distribuidora' },
    { key: 'foodservice', name: 'Foodservice' },
    { key: 'varejo', name: 'Varejo' },
    { key: 'servicos', name: 'Serviços' },
    { key: 'representante', name: 'Representação Comercial' },
    { key: 'imobiliario', name: 'Imobiliário' },
    { key: 'autoescola', name: 'Autoescola' },
    { key: 'oficina', name: 'Oficina' },
    { key: 'agencia', name: 'Agência' },
    { key: 'personalizado', name: 'Personalizado', isCustom: true },
  ];
  const insertedVerticals: Record<string, string> = {};
  for (const v of verticalRows) {
    const [row] = await db
      .insert(schema.verticals)
      .values(v)
      .onConflictDoUpdate({ target: schema.verticals.key, set: { name: v.name } })
      .returning();
    insertedVerticals[v.key] = row.id;
  }

  await db.insert(schema.verticalTemplates).values({
    verticalId: insertedVerticals['industria'],
    config: INDUSTRIA_TEMPLATE,
  });
  await db.insert(schema.verticalTemplates).values({
    verticalId: insertedVerticals['oficina'],
    config: OFICINA_TEMPLATE,
  });
  console.log('  -> templates completos: industria, oficina (demais verticais com catálogo básico, template detalhado fica para próxima fase)');

  console.log('Seed: organização demo (Indústria)...');
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: 'VPJ Alimentos Ltda (Demo)',
      tradeName: 'VPJ Alimentos',
      document: '12.345.678/0001-90',
      segmentKey: 'industria',
      verticalId: insertedVerticals['industria'],
      primaryColor: '#4f46e5',
      status: 'active',
    })
    .returning();

  await db.insert(schema.subscriptions).values({ organizationId: org.id, planKey: 'business' });

  for (const moduleKey of INDUSTRIA_TEMPLATE.modules) {
    await db.insert(schema.organizationModules).values({ organizationId: org.id, moduleKey, enabled: true });
  }

  const [mainBranch] = await db
    .insert(schema.branches)
    .values({ organizationId: org.id, name: 'Matriz', isMain: true, city: 'São Paulo', state: 'SP' })
    .returning();

  console.log('Seed: roles + permissões...');
  const [adminRole] = await db
    .insert(schema.roles)
    .values({ organizationId: org.id, key: 'admin', name: 'Administrador', isSystem: true })
    .returning();
  const [sellerRole] = await db
    .insert(schema.roles)
    .values({ organizationId: org.id, key: 'vendedor', name: 'Vendedor', isSystem: true })
    .returning();

  const allPermissions = await db.select().from(schema.permissions);
  for (const perm of allPermissions) {
    await db.insert(schema.rolePermissions).values({ roleId: adminRole.id, permissionId: perm.id }).onConflictDoNothing();
  }
  const sellerModules = ['customers', 'prospects', 'contacts', 'opportunities', 'pipelines', 'tasks', 'products'];
  for (const perm of allPermissions) {
    if (sellerModules.includes(perm.module) && perm.action !== 'delete') {
      await db.insert(schema.rolePermissions).values({ roleId: sellerRole.id, permissionId: perm.id }).onConflictDoNothing();
    }
  }

  console.log('Seed: usuários...');
  const passwordHash = bcrypt.hashSync('Demo@123', 10);
  const [adminUser] = await db
    .insert(schema.users)
    .values({ name: 'Giovani Módena', email: 'admin@vpjalimentos.com.br', passwordHash })
    .returning();
  const [sellerUser] = await db
    .insert(schema.users)
    .values({ name: 'Ana Vendedora', email: 'ana@vpjalimentos.com.br', passwordHash })
    .returning();

  await db.insert(schema.memberships).values({
    userId: adminUser.id, organizationId: org.id, roleId: adminRole.id, branchId: mainBranch.id, isOwner: true,
  });
  await db.insert(schema.memberships).values({
    userId: sellerUser.id, organizationId: org.id, roleId: sellerRole.id, branchId: mainBranch.id, isOwner: false,
  });

  console.log('Seed: pipeline comercial...');
  const [pipeline] = await db
    .insert(schema.pipelines)
    .values({ organizationId: org.id, name: INDUSTRIA_TEMPLATE.pipeline.name, type: 'sales', isDefault: true })
    .returning();
  const stageRows: (typeof schema.pipelineStages.$inferSelect)[] = [];
  let order = 0;
  for (const s of INDUSTRIA_TEMPLATE.pipeline.stages) {
    const [row] = await db
      .insert(schema.pipelineStages)
      .values({
        pipelineId: pipeline.id,
        name: s.name,
        order: order++,
        color: s.color,
        probability: s.probability,
        isWon: !!(s as any).isWon,
      })
      .returning();
    stageRows.push(row);
  }

  console.log('Seed: fornecedores, produtos...');
  const [supplier1] = await db.insert(schema.suppliers).values({
    organizationId: org.id, companyName: 'Embalagens São Paulo Ltda', segment: 'Embalagens',
    city: 'Guarulhos', state: 'SP', phone: '(11) 4002-8922', email: 'contato@embalagenssp.com.br',
    rating: 4, status: 'active',
  }).returning();
  await db.insert(schema.suppliers).values({
    organizationId: org.id, companyName: 'Matéria-Prima Nordeste S.A.', segment: 'Insumos',
    city: 'Recife', state: 'PE', phone: '(81) 3222-1010', rating: 5, status: 'active',
  });

  const productNames = [
    { name: 'Molho de Tomate Premium 2kg', sku: 'MT-2KG', price: 18.9, cost: 11.2 },
    { name: 'Azeite Extra Virgem 500ml', sku: 'AZ-500', price: 32.5, cost: 19.0 },
    { name: 'Farinha Especial 25kg', sku: 'FE-25KG', price: 89.9, cost: 61.0 },
    { name: 'Conserva de Palmito 1kg', sku: 'CP-1KG', price: 24.7, cost: 14.5 },
    { name: 'Óleo de Soja 900ml (caixa 20un)', sku: 'OS-900-CX20', price: 145.0, cost: 98.0 },
  ];
  const products: (typeof schema.products.$inferSelect)[] = [];
  for (const p of productNames) {
    const [row] = await db.insert(schema.products).values({
      organizationId: org.id, name: p.name, sku: p.sku, price: String(p.price), cost: String(p.cost),
      unit: 'UN', stock: '500', minStock: '50', supplierId: supplier1.id, status: 'active',
    }).returning();
    products.push(row);
  }

  console.log('Seed: prospects...');
  const prospectData = [
    { companyName: 'Distribuidora Boa Mesa', city: 'Campinas', state: 'SP', potential: 'alto', origin: 'indicacao' },
    { companyName: 'Rede Supermix Atacado', city: 'Belo Horizonte', state: 'MG', potential: 'alto', origin: 'feira' },
    { companyName: 'Empório Sabor & Cia', city: 'Curitiba', state: 'PR', potential: 'medio', origin: 'site' },
    { companyName: 'Atacadão Litoral Norte', city: 'Santos', state: 'SP', potential: 'medio', origin: 'indicacao' },
    { companyName: 'Foodservice Brasil Distrib.', city: 'Rio de Janeiro', state: 'RJ', potential: 'alto', origin: 'linkedin' },
    { companyName: 'Mercadinho Central', city: 'Sorocaba', state: 'SP', potential: 'baixo', origin: 'whatsapp' },
  ];
  const prospects: (typeof schema.prospects.$inferSelect)[] = [];
  for (const p of prospectData) {
    const [row] = await db.insert(schema.prospects).values({
      organizationId: org.id, companyName: p.companyName, city: p.city, state: p.state,
      potential: p.potential, origin: p.origin, ownerId: sellerUser.id, segment: 'industria', status: 'open',
      score: Math.floor(Math.random() * 100),
    }).returning();
    prospects.push(row);
  }

  console.log('Seed: clientes...');
  const customerData = [
    { companyName: 'Rede Mineira de Supermercados', city: 'Belo Horizonte', state: 'MG', abcClassification: 'A' },
    { companyName: 'Distribuidora Sul Alimentos', city: 'Porto Alegre', state: 'RS', abcClassification: 'A' },
    { companyName: 'Comercial Paulista de Alimentos', city: 'São Paulo', state: 'SP', abcClassification: 'B' },
    { companyName: 'Atacado Nordeste Ltda', city: 'Salvador', state: 'BA', abcClassification: 'C' },
  ];
  const customers: (typeof schema.customers.$inferSelect)[] = [];
  for (const c of customerData) {
    const [row] = await db.insert(schema.customers).values({
      organizationId: org.id, companyName: c.companyName, city: c.city, state: c.state,
      abcClassification: c.abcClassification, ownerId: sellerUser.id, status: 'active',
      ticketAverage: String((Math.random() * 5000 + 1000).toFixed(2)),
      lastPurchaseAt: new Date(Date.now() - Math.floor(Math.random() * 40) * 24 * 3600 * 1000),
    }).returning();
    customers.push(row);
  }

  console.log('Seed: contatos...');
  await db.insert(schema.contacts).values({
    organizationId: org.id, name: 'Carlos Menezes', jobTitle: 'Comprador', isPrimary: true,
    email: 'carlos@redemineira.com.br', phone: '(31) 99888-1122', customerId: customers[0].id,
  });
  await db.insert(schema.contacts).values({
    organizationId: org.id, name: 'Fernanda Lima', jobTitle: 'Gerente de Compras', isPrimary: true,
    email: 'fernanda@boamesa.com.br', phone: '(19) 99777-3344', prospectId: prospects[0].id,
  });

  console.log('Seed: oportunidades...');
  const oppData = [
    { title: 'Rede Mineira — reposição trimestral', stageIdx: 6, value: 42000, customerId: customers[0].id },
    { title: 'Distribuidora Sul — novo contrato anual', stageIdx: 5, value: 96000, customerId: customers[1].id },
    { title: 'Boa Mesa — proposta inicial', stageIdx: 4, value: 18000, prospectId: prospects[0].id },
    { title: 'Supermix Atacado — amostragem linha completa', stageIdx: 3, value: 25000, prospectId: prospects[1].id },
    { title: 'Empório Sabor — primeiro contato', stageIdx: 1, value: 6000, prospectId: prospects[2].id },
    { title: 'Foodservice Brasil — qualificação', stageIdx: 2, value: 31000, prospectId: prospects[4].id },
  ];
  const opportunities: (typeof schema.opportunities.$inferSelect)[] = [];
  for (const o of oppData) {
    const stage = stageRows[o.stageIdx];
    const [row] = await db.insert(schema.opportunities).values({
      organizationId: org.id, title: o.title, pipelineId: pipeline.id, stageId: stage.id,
      customerId: (o as any).customerId ?? null, prospectId: (o as any).prospectId ?? null,
      ownerId: sellerUser.id, value: String(o.value), probability: stage.probability,
      status: stage.isWon ? 'won' : 'open',
    }).returning();
    opportunities.push(row);
    await db.insert(schema.opportunityStageHistory).values({ opportunityId: row.id, toStageId: stage.id, changedById: sellerUser.id });
    await db.insert(schema.opportunityItems).values({
      opportunityId: row.id, productId: products[Math.floor(Math.random() * products.length)].id,
      quantity: String(Math.floor(Math.random() * 100) + 10), unitPrice: String((o.value / 50).toFixed(2)),
    });
  }

  console.log('Seed: tarefas...');
  await db.insert(schema.activityTasks).values([
    {
      organizationId: org.id, type: 'followup', title: 'Follow-up proposta Boa Mesa', priority: 'high',
      status: 'pending', assigneeId: sellerUser.id, prospectId: prospects[0].id, opportunityId: opportunities[2].id,
      dueAt: new Date(Date.now() + 1 * 24 * 3600 * 1000),
    },
    {
      organizationId: org.id, type: 'call', title: 'Ligar para Supermix Atacado', priority: 'normal',
      status: 'pending', assigneeId: sellerUser.id, prospectId: prospects[1].id,
      dueAt: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    },
    {
      organizationId: org.id, type: 'visit', title: 'Visita técnica — Rede Mineira', priority: 'normal',
      status: 'pending', assigneeId: sellerUser.id, customerId: customers[0].id,
      dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    },
    {
      organizationId: org.id, type: 'whatsapp', title: 'Enviar catálogo — Empório Sabor', priority: 'low',
      status: 'overdue', assigneeId: sellerUser.id, prospectId: prospects[2].id,
      dueAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    },
    {
      organizationId: org.id, type: 'internal', title: 'Atualizar tabela de preços Q4', priority: 'normal',
      status: 'pending', assigneeId: adminUser.id, dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  ]);

  console.log('Seed: automação de exemplo (Workflow Builder)...');
  await db.insert(schema.automations).values({
    organizationId: org.id,
    name: 'Boas-vindas a novo cliente',
    triggerEvent: 'customer.created',
    conditions: [],
    actions: [{ type: 'create_task', params: { title: 'Ligar de boas-vindas para o novo cliente', type: 'call', priority: 'high', dueInDays: 1 } }],
    enabled: true,
  });

  console.log('\nSeed concluído.');
  console.log('Organização demo:', org.name, `(id: ${org.id})`);
  console.log('Login admin -> admin@vpjalimentos.com.br / Demo@123');
  console.log('Login vendedor -> ana@vpjalimentos.com.br / Demo@123');

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
