# EA Trade Link SIS

**China–Tanzania Education and Business Service Platform**

A full-stack SaaS application built with Next.js 15, Prisma, PostgreSQL (Neon), NextAuth v5, and shadcn/ui.

---

## Features

- **Scholarship Module** — Browse, filter, and apply for China scholarships
- **Business Visa Module** — Apply for China business visas
- **Product Sourcing** — Request product sourcing from Chinese suppliers
- **Factory Visits** — Organize and book factory visits in China
- **Money Exchange** — RMB ↔ TZS offline exchange with calculator
- **Admin Dashboard** — Full management of all modules with analytics
- **Role-based Access** — USER, ADMIN, SUPER_ADMIN roles
- **Interactive Globe** — COBE.js globe showing China–Tanzania connections

---

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required:
```
DATABASE_URL="postgresql://..."  # Neon PostgreSQL connection string
AUTH_SECRET="..."                # Run: openssl rand -base64 32
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

After seeding, use these accounts to test:

| Account | Email | Password |
|---------|-------|----------|
| Admin | admin@eatradelink.com | admin123! |
| Student | student@demo.com | student123! |
| Business | business@demo.com | business123! |

---

## Project Structure

```
├── app/
│   ├── (auth)/           # Login, Register
│   ├── (dashboard)/      # User dashboard + all modules
│   │   ├── dashboard/
│   │   ├── scholarships/
│   │   ├── visa/
│   │   ├── sourcing/
│   │   ├── factory-visits/
│   │   ├── exchange/
│   │   ├── messages/
│   │   └── profile/
│   ├── admin/            # Admin panel
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── scholarships/
│   │   ├── visa/
│   │   ├── sourcing/
│   │   ├── factory-visits/
│   │   ├── exchange/
│   │   ├── messages/
│   │   └── analytics/
│   └── api/              # API routes
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Sidebar, Header
│   ├── shared/           # Reusable components
│   └── admin/            # Admin-specific components
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Full database schema
│   └── seed.ts           # Seed data
└── actions/              # Server actions
```

---

## Deployment (Vercel)

1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Vercel will auto-run `npm run build`
4. Run migrations: `npm run db:migrate --production`

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Auth**: NextAuth v5 with credentials provider
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Globe**: COBE.js
