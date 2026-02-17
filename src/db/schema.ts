import {
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  integer,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// Enums
export const propertyTypeEnum = pgEnum("property_type", [
  "single_family",
  "condo",
  "townhouse",
  "multi_family",
  "apartment",
]);

export const managementTypeEnum = pgEnum("management_type", [
  "self_managed",
  "property_manager",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "advertising", // Line 5
  "auto_travel", // Line 6
  "cleaning_maintenance", // Line 7
  "commissions", // Line 8
  "insurance", // Line 9
  "legal_professional", // Line 10
  "management_fees", // Line 11
  "mortgage_interest", // Line 12
  "other_interest", // Line 13
  "repairs", // Line 14
  "supplies", // Line 15
  "property_taxes", // Line 16
  "utilities", // Line 17
  "depreciation", // Line 18
  "other", // Line 19
]);

export const frequencyEnum = pgEnum("frequency", [
  "one_time",
  "monthly",
  "quarterly",
  "annual"
]);

// Users table (Clerk integration)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(), // Clerk user ID
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


// PropOwl domain tables
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Address
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),

  // Property details
  propertyType: propertyTypeEnum("property_type").notNull(),
  purchaseDate: date("purchase_date").notNull(),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull(),
  landValue: decimal("land_value", { precision: 12, scale: 2 }).notNull(),
  customDepreciation: decimal("custom_depreciation", { precision: 10, scale: 2 }),

  // Management
  managementType: managementTypeEnum("management_type").notNull(),

  // Wizard progress (1-7)
  wizardStep: integer("wizard_step").default(1).notNull(),
  wizardComplete: boolean("wizard_complete").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mortgages = pgTable("mortgages", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  lenderName: text("lender_name"),
  loanBalance: decimal("loan_balance", { precision: 12, scale: 2 }),
  interestRate: decimal("interest_rate", { precision: 5, scale: 3 }),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }),

  // Annual totals (from 1098 or statements)
  annualInterest: decimal("annual_interest", { precision: 10, scale: 2 }),
  annualPropertyTax: decimal("annual_property_tax", { precision: 10, scale: 2 }),
  annualInsurance: decimal("annual_insurance", { precision: 10, scale: 2 }),

  taxYear: integer("tax_year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const incomeTypeEnum = pgEnum("income_type", [
  "rental",
  "other"
]);

export const incomeEntries = pgTable("income_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  taxYear: integer("tax_year").notNull(),
  type: incomeTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: frequencyEnum("frequency").notNull().default("annual"),
  description: text("description"),

  // Order preservation
  sortOrder: integer("sort_order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Keep old table for backward compatibility during migration
export const rentalIncome = pgTable("rental_income", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  taxYear: integer("tax_year").notNull(),

  // Self-managed
  grossRent: decimal("gross_rent", { precision: 10, scale: 2 }),

  // PM-managed (from PM statement)
  pmGrossRent: decimal("pm_gross_rent", { precision: 10, scale: 2 }),
  pmFees: decimal("pm_fees", { precision: 10, scale: 2 }),
  pmRepairs: decimal("pm_repairs", { precision: 10, scale: 2 }),
  pmOtherDeductions: decimal("pm_other_deductions", { precision: 10, scale: 2 }),
  pmNetIncome: decimal("pm_net_income", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  taxYear: integer("tax_year").notNull(),
  date: date("date").notNull(),
  category: expenseCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: frequencyEnum("frequency").notNull().default("one_time"),
  description: text("description"),
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"),

  // Order preservation
  sortOrder: integer("sort_order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),

  taxYear: integer("tax_year").notNull(),
  documentType: text("document_type").notNull(), // mortgage_statement, tax_bill, insurance, pm_statement, receipt
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Mortgage = typeof mortgages.$inferSelect;
export type NewMortgage = typeof mortgages.$inferInsert;
export type IncomeEntry = typeof incomeEntries.$inferSelect;
export type NewIncomeEntry = typeof incomeEntries.$inferInsert;
export type RentalIncome = typeof rentalIncome.$inferSelect;
export type NewRentalIncome = typeof rentalIncome.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
