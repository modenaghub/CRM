CREATE TABLE IF NOT EXISTS "activity_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_at" timestamp with time zone,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"assignee_id" text,
	"customer_id" text,
	"prospect_id" text,
	"opportunity_id" text,
	"reminder_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"file_name" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text,
	"size" integer,
	"uploaded_by_id" text,
	"customer_id" text,
	"prospect_id" text,
	"supplier_id" text,
	"opportunity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "automations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"trigger_event" text NOT NULL,
	"conditions" jsonb,
	"actions" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"address" text,
	"city" text,
	"state" text,
	"is_main" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"job_title" text,
	"department" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"birthday" timestamp with time zone,
	"observations" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"customer_id" text,
	"prospect_id" text,
	"supplier_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_field_values" (
	"id" text PRIMARY KEY NOT NULL,
	"custom_field_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"customer_id" text,
	"prospect_id" text,
	"supplier_id" text,
	"product_id" text,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"editable" boolean DEFAULT true NOT NULL,
	"default_value" text,
	"validation_rule" text,
	"options" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_fields_unique" UNIQUE("organization_id","entity_type","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_object_fields" (
	"id" text PRIMARY KEY NOT NULL,
	"custom_object_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"field_type" text NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"options" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "custom_object_fields_unique" UNIQUE("custom_object_id","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_object_records" (
	"id" text PRIMARY KEY NOT NULL,
	"custom_object_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"related_customer_id" text,
	"related_prospect_id" text,
	"related_supplier_id" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_objects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_objects_org_key_unique" UNIQUE("organization_id","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"state_registration" text,
	"municipal_registration" text,
	"cnae" text,
	"tax_regime" text,
	"segment" text,
	"size" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'Brasil',
	"website" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"owner_id" text,
	"price_table" text,
	"payment_terms" text,
	"credit_limit" numeric(14, 2),
	"commercial_region" text,
	"abc_classification" text,
	"score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"first_purchase_at" timestamp with time zone,
	"last_purchase_at" timestamp with time zone,
	"ticket_average" numeric(14, 2),
	"ltv" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"description" text,
	"default_on" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"scope_type" text NOT NULL,
	"scope_id" text,
	"metric" text NOT NULL,
	"target_value" numeric(14, 2) NOT NULL,
	"achieved_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"location" text,
	"meeting_link" text,
	"customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"branch_id" text,
	"role_id" text NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_org_unique" UNIQUE("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "modules" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_core" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"body" text NOT NULL,
	"author_id" text,
	"customer_id" text,
	"prospect_id" text,
	"opportunity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"entity_type" text,
	"entity_id" text,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"customer_id" text,
	"prospect_id" text,
	"owner_id" text,
	"pipeline_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"value" numeric(14, 2),
	"discount" numeric(14, 2),
	"probability" integer DEFAULT 0 NOT NULL,
	"expected_close_date" timestamp with time zone,
	"origin" text,
	"status" text DEFAULT 'open' NOT NULL,
	"lost_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_items" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"product_id" text,
	"service_id" text,
	"quantity" numeric(14, 3) DEFAULT '1' NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "opportunity_stage_history" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"from_stage_id" text,
	"to_stage_id" text NOT NULL,
	"changed_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"flag_key" text NOT NULL,
	"enabled" boolean NOT NULL,
	CONSTRAINT "org_feature_flags_unique" UNIQUE("organization_id","flag_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"module_key" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "organization_modules_unique" UNIQUE("organization_id","module_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"segment_key" text,
	"vertical_id" text,
	"logo_url" text,
	"primary_color" text,
	"domain" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"action" text NOT NULL,
	CONSTRAINT "permissions_module_action_unique" UNIQUE("module","action")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipeline_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"pipeline_id" text NOT NULL,
	"name" text NOT NULL,
	"order" integer NOT NULL,
	"color" text,
	"probability" integer DEFAULT 0 NOT NULL,
	"sla_hours" integer,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_lost" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pipelines" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'sales' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_key" text NOT NULL,
	"module_key" text NOT NULL,
	CONSTRAINT "plan_modules_unique" UNIQUE("plan_key","module_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plans" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"parent_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" text,
	"sku" text,
	"ean" text,
	"name" text NOT NULL,
	"description" text,
	"category_id" text,
	"brand" text,
	"unit" text,
	"weight" numeric(10, 3),
	"dimensions" text,
	"ncm" text,
	"origin" text,
	"cost" numeric(14, 2),
	"price" numeric(14, 2),
	"stock" numeric(14, 3),
	"min_stock" numeric(14, 3),
	"supplier_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"photos" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"company_type" text,
	"segment" text,
	"subsegment" text,
	"size" text,
	"estimated_revenue" numeric(14, 2),
	"employees_count" integer,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text DEFAULT 'Brasil',
	"website" text,
	"instagram" text,
	"facebook" text,
	"linkedin" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"origin" text,
	"owner_id" text,
	"region" text,
	"potential" text,
	"products_of_interest" text,
	"observations" text,
	"score" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"converted_to_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"supplier_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_value" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"opportunity_id" text,
	"customer_id" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp with time zone,
	"total_value" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permissions_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_org_key_unique" UNIQUE("organization_id","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sales_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"total_value" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"category_id" text,
	"description" text,
	"value" numeric(14, 2),
	"cost" numeric(14, 2),
	"duration_minutes" integer,
	"responsible_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"plan_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"document" text,
	"segment" text,
	"address" text,
	"city" text,
	"state" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"categories" text,
	"commercial_terms" text,
	"lead_time_days" integer,
	"rating" integer,
	"performance_score" integer,
	"sla_days" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tag_links" (
	"id" text PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"customer_id" text,
	"prospect_id" text,
	"supplier_id" text,
	"product_id" text,
	"opportunity_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text,
	CONSTRAINT "tags_org_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "team_members_unique" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vertical_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"vertical_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verticals" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	CONSTRAINT "verticals_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_tasks_org_idx" ON "activity_tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_tasks_org_status_idx" ON "activity_tasks" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activity_tasks_assignee_idx" ON "activity_tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_org_idx" ON "audit_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "automations_org_idx" ON "automations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branches_org_idx" ON "branches" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_org_idx" ON "contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_customer_idx" ON "contacts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_prospect_idx" ON "contacts" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_supplier_idx" ON "contacts" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_object_records_object_idx" ON "custom_object_records" USING btree ("custom_object_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_org_idx" ON "customers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customers_org_status_idx" ON "customers" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "memberships_org_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_org_user_idx" ON "notifications" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_org_idx" ON "opportunities" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_org_status_idx" ON "opportunities" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "opportunities_stage_idx" ON "opportunities" USING btree ("pipeline_id","stage_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipeline_stages_pipeline_idx" ON "pipeline_stages" USING btree ("pipeline_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pipelines_org_idx" ON "pipelines" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_org_idx" ON "products" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_org_idx" ON "prospects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_org_status_idx" ON "prospects" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_org_idx" ON "services" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "suppliers_org_idx" ON "suppliers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_links_tag_idx" ON "tag_links" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vertical_templates_vertical_idx" ON "vertical_templates" USING btree ("vertical_id");