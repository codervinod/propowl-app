# PropOwl - The Wise Way to Manage Rentals

> **AI-powered rental property accounting that eliminates manual data entry and generates tax-ready Schedule E reports.**

## 🏗️ System Architecture

### Technology Stack

| Layer | Technology | Purpose | Configuration |
|-------|------------|---------|---------------|
| **Frontend** | Next.js 14 (App Router) | React framework with SSR | TypeScript, Tailwind CSS |
| **UI Components** | shadcn/ui | Professional component library | Radix UI primitives |
| **Authentication** | Clerk | User management & auth | Social login, email/password |
| **Database** | Neon PostgreSQL | Serverless SQL database | Drizzle ORM, connection pooling |
| **Hosting** | Vercel | Serverless deployment | Auto-deploy, preview branches |
| **File Storage** | Cloudflare R2 | Document storage | S3-compatible, $0 egress |
| **PDF Generation** | Puppeteer | Schedule E PDF export | Headless Chrome rendering |

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PropOwl Production Stack                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GitHub (codervinod/propowl-app)                            │
│         │                                                   │
│         ▼ (push to main)                                    │
│  ┌─────────────────┐                                        │
│  │     Vercel      │───▶ propowl.ai (production)            │
│  │   (Next.js)     │───▶ staging.propowl.ai (staging)       │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │      Neon       │    │  Cloudflare R2  │                │
│  │   PostgreSQL    │    │  (Documents)    │                │
│  │   + Branching   │    │   $0 egress     │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           ▼                       ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │     Clerk       │    │   Puppeteer     │                │
│  │  Authentication │    │  PDF Generation │                │
│  │   Social Auth   │    │  Schedule E     │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Features & Implementation

### 1. Property Management System

#### Property Setup Wizard
**Location**: `src/components/property/PropertyWizard.tsx`

**Flow**:
```
Step 1: Property Basics
├── Address (Google Places API autocomplete)
├── Property type (single family, condo, multi-family)
├── Purchase date & price
└── Land value (for depreciation calculation)

Step 2: Mortgage Information (Optional)
├── Has mortgage: Yes/No
├── Lender information
├── Interest rate & monthly payment
└── Escrow details (taxes, insurance)

Step 3: Save & Complete
├── Review entered data
├── Save to properties table
└── Redirect to Tax Year Dashboard
```

**Key Components**:
- `PropertyBasicsStep.tsx` - Property details & Google Places integration
- `MortgageStep.tsx` - Financing information
- `AddressTypeahead.tsx` - Google Places autocomplete

### 2. Multi-Year Tax Data Architecture

#### Annual Tax Year Workflow
**Location**: `src/components/tax-year/TaxYearDataEntry.tsx`

**Per Property, Per Tax Year**:
```
1. Income Collection
   ├── Rental income (monthly/quarterly/annual)
   ├── Other income sources
   └── Frequency preservation

2. Expense Tracking
   ├── 15+ IRS Schedule E categories
   ├── Mortgage interest, property taxes
   ├── Repairs, maintenance, utilities
   └── Receipt storage (Cloudflare R2)

3. Auto-save & Validation
   ├── Real-time data persistence
   ├── Form validation
   └── Data integrity checks

4. Report Generation
   ├── Property P&L summary
   ├── Schedule E tax form
   └── Export capabilities
```

### 3. Schedule E Tax Form System

#### Complete IRS Schedule E Implementation
**Location**: `src/lib/schedule-e/` & `src/components/reports/`

**Core Components**:

1. **Calculation Engine** (`calculations.ts`)
   ```typescript
   // Maps raw expense data to IRS Schedule E lines 3-21
   export function calculateScheduleEExpenses(expenses: ExpenseData[]): ScheduleEExpenses

   // Generates complete Schedule E data for single property
   export function generateScheduleEData(property, taxYear, income, expenses): ScheduleEData

   // Aggregates multiple properties for portfolio reporting
   export function generateScheduleESummary(properties: ScheduleEData[]): ScheduleESummary
   ```

2. **Type Definitions** (`types.ts`)
   ```typescript
   interface ScheduleEData {
     property: ScheduleEProperty;
     taxYear: number;
     income: ScheduleEIncome;
     expenses: ScheduleEExpenses;
     depreciation?: DepreciationData;
     totals: ScheduleETotals;
   }
   ```

3. **User Interface** (`ScheduleEForm.tsx` + `ScheduleETable.tsx`)
   - Professional IRS-compliant display
   - Multi-property selector
   - Fixed header table (custom implementation)
   - Validation warnings
   - Export options

#### IRS Schedule E Line Mapping

| Schedule E Line | Database Source | Implementation |
|----------------|----------------|----------------|
| **Line 3** - Rents received | `incomeEntries` | Annualized based on frequency |
| **Line 5** - Advertising | `expenses.advertising` | Direct mapping |
| **Line 6** - Auto and travel | `expenses.autoAndTravel` | Direct mapping |
| **Line 7** - Cleaning and maintenance | `expenses.cleaningAndMaintenance` | Direct mapping |
| **Line 8** - Commissions | `expenses.commissions` | Direct mapping |
| **Line 9** - Insurance | `expenses.insurance` | Direct mapping |
| **Line 10** - Legal and professional fees | `expenses.legal` | Direct mapping |
| **Line 11** - Management fees | `expenses.managementFees` | Direct mapping |
| **Line 12** - Mortgage interest | `expenses.mortgageInterest` | Direct mapping |
| **Line 13** - Other interest | `expenses.otherInterest` | Direct mapping |
| **Line 14** - Repairs | `expenses.repairs` | Direct mapping |
| **Line 15** - Supplies | `expenses.supplies` | Direct mapping |
| **Line 16** - Taxes | `expenses.taxes` | Direct mapping |
| **Line 17** - Utilities | `expenses.utilities` | Direct mapping |
| **Line 18** - Depreciation | Calculated | IRS mid-month convention |
| **Line 19** - Other | `expenses.other` | Direct mapping |
| **Line 20** - Total expenses | Calculated | Sum of lines 5-19 |
| **Line 21** - Net income/loss | Calculated | Line 3 minus Line 20 |

### 4. Depreciation Calculation System

#### IRS-Compliant Depreciation Engine
**Location**: `src/lib/depreciation.ts`

**Key Functions**:
```typescript
// Calculate depreciable basis (purchase price - land value)
export function calculateDepreciableBasis(purchasePrice: number, landValue: number): number

// First year depreciation using IRS mid-month convention
export function calculateFirstYearDepreciation(
  depreciableBasis: number,
  monthPlacedInService: number
): number

// Annual depreciation (27.5 year straight-line for residential)
export function calculateAnnualDepreciation(depreciableBasis: number): number

// Multi-year depreciation calculation
export function calculateDepreciationForTaxYear(
  purchasePrice: number,
  landValue: number,
  purchaseDate: string,
  taxYear: number
): number
```

**IRS Mid-Month Convention Table**:
| Month | First Year % | Subsequent Years % |
|-------|-------------|-------------------|
| January | 3.485% | 3.636% |
| February | 3.182% | 3.636% |
| March | 2.879% | 3.636% |
| ... | ... | 3.636% |
| December | 0.152% | 3.636% |

### 5. Export & Reporting System

#### PDF Generation (Puppeteer-based)
**Location**: `src/app/api/reports/pdf/route.ts`

**Implementation**:
```typescript
// API Endpoint: GET /api/reports/pdf?propertyId=X&taxYear=2024
export async function GET(request: NextRequest) {
  // 1. Fetch Schedule E data from /api/schedule-e
  // 2. Generate professional HTML using scheduleEToHTML() or summaryToHTML()
  // 3. Convert HTML to PDF using Puppeteer
  // 4. Return PDF with proper headers and filename
}
```

**Features**:
- IRS-compliant Schedule E formatting
- Professional styling suitable for CPA submission
- Multi-property portfolio summaries
- Proper PDF metadata and filenames

#### CSV Export System
**Location**: `src/lib/schedule-e/csv-exporter.ts`

**Export Formats**:
1. **Standard CSV** - Basic property and expense data
2. **TurboTax Format** - Compatible with TurboTax import
3. **QuickBooks Format** - Compatible with QuickBooks import

**API Endpoint**:
```typescript
// GET /api/reports/csv?propertyId=X&taxYear=2024&format=turbotax
export function exportPropertyToCSV(data: ScheduleEData, format: ScheduleEExportFormat): string
```

## 🗄️ Database Schema

### Core Tables

#### Properties Table (Master Data)
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL, -- Clerk user ID
  street VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  property_type VARCHAR NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL,
  land_value DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Income Entries (Per Property, Per Tax Year)
```sql
CREATE TABLE income_entries (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  tax_year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR NOT NULL, -- 'monthly', 'quarterly', 'annual', 'one_time'
  description VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Expenses (Per Property, Per Tax Year)
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  tax_year INTEGER NOT NULL,
  category VARCHAR NOT NULL, -- Maps to Schedule E lines
  amount DECIMAL(10,2) NOT NULL,
  description VARCHAR,
  vendor VARCHAR,
  date_incurred DATE,
  receipt_url VARCHAR, -- Cloudflare R2 URL
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Data Architecture Benefits

1. **Multi-Year Support**: Each property can have data for multiple tax years
2. **Frequency Preservation**: Income frequencies stored and preserved for accurate annualization
3. **Receipt Storage**: Document URLs stored in database, files in Cloudflare R2
4. **Schedule E Mapping**: Expense categories directly map to IRS Schedule E line numbers
5. **Audit Trail**: Created/updated timestamps for all records

## 🔧 API Architecture

### Core API Endpoints

#### Authentication (Clerk Integration)
```
POST /api/auth/signup        # User registration
POST /api/auth/login         # User login
GET  /api/auth/user          # Current user info
POST /api/webhooks/clerk     # Clerk webhook handling
```

#### Property Management
```
GET    /api/properties                    # List user properties
POST   /api/properties                    # Create new property
GET    /api/properties/[id]              # Get property details
PUT    /api/properties/[id]              # Update property
DELETE /api/properties/[id]              # Delete property
POST   /api/properties/fetch-data        # Google Places data fetch
```

#### Tax Year Data
```
GET    /api/tax-year?propertyId=X&year=2024    # Get tax year data
POST   /api/tax-year                           # Create/update tax year data
PUT    /api/tax-year/[id]                     # Update specific entry
DELETE /api/tax-year/[id]                     # Delete entry
```

#### Schedule E & Reports
```
GET    /api/schedule-e?propertyId=X&taxYear=2024              # Generate Schedule E data
GET    /api/schedule-e?taxYear=2024&includeAllProperties=true # Multi-property summary
GET    /api/reports/pdf?propertyId=X&taxYear=2024            # PDF export
GET    /api/reports/csv?propertyId=X&taxYear=2024&format=csv # CSV export
```

### API Design Patterns

1. **Consistent Error Handling**: All endpoints return standardized error responses
2. **Authentication Middleware**: Clerk authentication required for all protected routes
3. **Input Validation**: Zod schemas for request validation
4. **Database Transactions**: Ensure data consistency for complex operations
5. **Response Caching**: Appropriate cache headers for static data

## 🚀 Deployment & Infrastructure

### Environment Configuration

| Environment | URL | Branch | Database | Purpose |
|-------------|-----|--------|----------|---------|
| **Production** | propowl.ai | `main` | propowl-db (main) | Live application |
| **Staging** | staging.propowl.ai | `staging` | propowl-db-staging | Pre-production testing |
| **Development** | localhost:3000 | feature branches | propowl-db-staging | Local development |

### Git Workflow

```
main (production) ← staging ← feature branches
     │                 │
     │                 └── staging.propowl.ai
     └── propowl.ai
```

**Branch Protection Rules**:
- `main`: Requires PR, status checks, no direct pushes
- `staging`: Requires PR, status checks, no direct pushes
- Feature branches: Follow naming convention `feature/GH-<issue>-<description>`

### Continuous Integration

**GitHub Actions** (`.github/workflows/ci.yml`):
```yaml
- ESLint (code quality)
- TypeScript type checking
- Next.js build verification
- Vitest unit tests
- Automatic deployment (Vercel)
```

### Database Management

**Neon PostgreSQL Features**:
- **Database Branching**: Separate databases for prod/staging
- **Connection Pooling**: Optimized for serverless
- **Automatic Backups**: Point-in-time recovery
- **Scaling**: Auto-scale based on usage

**Drizzle ORM Benefits**:
- Type-safe database queries
- Migration management
- Schema validation
- Performance optimization

## 🧪 Testing Strategy

### Test Coverage

1. **Unit Tests** (`src/__tests__/`)
   - Depreciation calculation functions (10 tests)
   - Tax calculation logic
   - Data transformation functions

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Authentication flows

3. **Manual Testing Checklist**
   - Schedule E generation accuracy
   - PDF export functionality
   - CSV export formats
   - Multi-property aggregation

### Quality Assurance

- **TypeScript**: Compile-time type safety
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Drizzle Kit**: Database schema validation

## 🔒 Security Implementation

### Authentication & Authorization

**Clerk Integration**:
- Social login (Google, GitHub, etc.)
- Email/password authentication
- Session management
- User profile management

**Data Protection**:
- All routes protected with Clerk middleware
- User data isolation (user_id filtering)
- Input validation and sanitization
- SQL injection prevention (Drizzle ORM)

### Document Security

**Cloudflare R2**:
- Pre-signed URLs for uploads
- Access control per user
- Secure file storage
- 7-year retention policy (IRS requirement)

## 📊 Key Performance Metrics

### Application Performance

- **Page Load Time**: < 2 seconds
- **PDF Generation**: < 5 seconds per property
- **Database Queries**: Optimized with proper indexing
- **Memory Usage**: Serverless auto-scaling

### Business Metrics

- **Tax Accuracy**: Schedule E matches CPA calculations
- **User Experience**: One-click Schedule E generation
- **Time Savings**: Eliminate manual Schedule E preparation
- **Professional Quality**: CPA-approved formatting

## 🔮 Future Enhancements

### Planned Features

1. **Bank Integration** (Plaid API)
   - Automatic transaction import
   - Bank account reconciliation
   - Real-time expense categorization

2. **Receipt Processing** (OCR)
   - Mobile receipt capture
   - Automatic data extraction
   - Expense categorization

3. **Advanced Reporting**
   - Multi-year trend analysis
   - Property performance comparisons
   - Cash flow projections

4. **Mobile Application**
   - React Native implementation
   - Offline data entry
   - Push notifications

### Technical Improvements

1. **Performance Optimization**
   - React Server Components
   - Edge runtime for API routes
   - Advanced caching strategies

2. **Monitoring & Analytics**
   - Error tracking (Sentry)
   - Performance monitoring
   - User analytics

## 📚 Development Guidelines

### Code Organization

```
src/
├── app/                     # Next.js App Router pages
│   ├── (dashboard)/         # Dashboard layout group
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── property/            # Property management
│   ├── tax-year/            # Tax data entry
│   └── reports/             # Schedule E & reporting
├── lib/                     # Utility libraries
│   ├── schedule-e/          # Tax calculation logic
│   ├── depreciation.ts      # IRS depreciation functions
│   └── utils.ts             # Helper functions
├── db/                      # Database configuration
│   └── schema.ts            # Drizzle schema definition
└── __tests__/               # Test files
```

### Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint check
npm run type-check       # TypeScript validation
npm test                 # Run unit tests

# Database
npm run db:generate      # Generate migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio
```

### Contributing Guidelines

1. **Issue-Driven Development**: All work starts with GitHub issues
2. **Branch Naming**: `feature/GH-<issue>-<description>` or `fix/GH-<issue>-<description>`
3. **Commit Messages**: `[GH-<issue>] Brief description`
4. **Pull Requests**: Target `staging` branch, include issue reference
5. **Code Review**: Required before merge to `staging` or `main`

## 🏆 Business Value

### For Landlords

- **Tax-Ready Reports**: Generate IRS-compliant Schedule E forms instantly
- **Time Savings**: Eliminate hours of manual Schedule E preparation
- **Professional Quality**: CPA-approved formatting and calculations
- **Multi-Property Support**: Handle entire rental portfolio efficiently
- **Export Flexibility**: PDF for filing, CSV for tax software integration

### For Development

- **Scalable Architecture**: Support 1 to 1000+ properties per user
- **Maintainable Codebase**: TypeScript, proper separation of concerns
- **Cost-Effective Stack**: Serverless, pay-per-use infrastructure
- **Future-Ready**: Foundation for advanced features (bank integration, OCR, mobile)

## 📞 Support & Documentation

### Resources

- **Production**: https://propowl.ai
- **Staging**: https://staging.propowl.ai
- **GitHub**: https://github.com/codervinod/propowl-app
- **Issues**: Use GitHub Issues for bug reports and feature requests

### Getting Started

1. **New Developers**: See README.md for setup instructions
2. **Feature Requests**: Create GitHub issue with detailed requirements
3. **Bug Reports**: Include reproduction steps and environment details
4. **Questions**: Use GitHub Discussions or create an issue

---

**PropOwl** - Transforming rental property accounting from manual drudgery to automated excellence. 🦉✨