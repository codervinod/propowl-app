CREATE TYPE "public"."expense_category" AS ENUM('advertising', 'auto_travel', 'cleaning_maintenance', 'commissions', 'insurance', 'legal_professional', 'management_fees', 'mortgage_interest', 'other_interest', 'repairs', 'supplies', 'property_taxes', 'utilities', 'depreciation', 'other');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('one_time', 'monthly', 'quarterly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."income_type" AS ENUM('rental', 'other');--> statement-breakpoint
CREATE TYPE "public"."management_type" AS ENUM('self_managed', 'property_manager');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'condo', 'townhouse', 'multi_family', 'apartment');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"date" date NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "frequency" DEFAULT 'one_time' NOT NULL,
	"description" text,
	"vendor" text,
	"receipt_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"type" "income_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"frequency" "frequency" DEFAULT 'annual' NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortgages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"lender_name" text,
	"loan_balance" numeric(12, 2),
	"interest_rate" numeric(5, 3),
	"monthly_payment" numeric(10, 2),
	"annual_interest" numeric(10, 2),
	"annual_property_tax" numeric(10, 2),
	"annual_insurance" numeric(10, 2),
	"tax_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"street" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip_code" text NOT NULL,
	"property_type" "property_type" NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_price" numeric(12, 2) NOT NULL,
	"land_value" numeric(12, 2) NOT NULL,
	"management_type" "management_type" NOT NULL,
	"wizard_step" integer DEFAULT 1 NOT NULL,
	"wizard_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rental_income" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"gross_rent" numeric(10, 2),
	"pm_gross_rent" numeric(10, 2),
	"pm_fees" numeric(10, 2),
	"pm_repairs" numeric(10, 2),
	"pm_other_deductions" numeric(10, 2),
	"pm_net_income" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortgages" ADD CONSTRAINT "mortgages_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_income" ADD CONSTRAINT "rental_income_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;