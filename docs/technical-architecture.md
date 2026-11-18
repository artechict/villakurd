# VillaKurd - معماری تکنیکی جزئی

> **نسخه:** 1.0  
> **تاریخ:** ۲۰۲۶-۱۱-۱۸  
> **معماری:** Domain-Driven Design (DDD) + Modular Monolith → Microservices (مرحله‌ای)

---

## ۱. اصول معماری (Architectural Principles)

| اصل | توضیح | پیاده‌سازی |
|------|---------|------------|
| **Domain-Driven Design** | کد حول دامنه‌های کسب‌وکار (Booking, Property, User) سازماندهی شده | ماژول‌های `src/modules/*` با bounded contexts |
| **Type Safety End-to-End** | TypeScript از دیتابیس تا UI | Prisma + Zod + TanStack Query + Shared types |
| **Modular Monolith First** | شروع با ماژولار منولیت، تجزیه به مایکروسرویس در مقیاس | Fastify plugins به عنوان ماژول‌های جدا شده |
| **API-First Design** | قرارداد API قبل از پیاده‌سازی | OpenAPI 3.1 Spec → Code generation |
| **Observability by Default** | لاگینگ، متریک، تریسینگ از روز اول | Pino + Prometheus + OpenTelemetry |
| **Security by Design** | احراز هویت، авториزاسیون، ولیدیشن در لایه‌ها | NextAuth + JWT + Zod + Rate limiting |
| **Database per Service (Logical)** | هر ماژول 스کیما/مиграشن مخصوص خود | Prisma schema پر ماژول (shared client) |
| **Event-Driven Communication** | ارتباط بین ماژول‌ها از طریق رویدادها | Event emitter داخلی → Kafka/RabbitMQ در مقیاس |

---

## ۲. معماری کلی سیستم (System Architecture)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SYSTEMS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ AsiaHawala  │  │  Qi Card    │  │  ZainCash   │  │  SMS/Email  │        │
│  │  Payment    │  │  Payment    │  │  Payment    │  │  Providers  │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API GATEWAY (Kong/Traefik)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Rate Limit  │  │   Auth      │  │   SSL/TLS   │  │  Routing    │        │
│  │ (Per IP/User)│  │  (JWT/OAuth)│  │  Termination│  │  (Path Based)│       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Booking API    │   │  Property API   │   │   User API      │
│  (Fastify)      │   │  (Fastify)      │   │  (Fastify)      │
│  Port: 4001     │   │  Port: 4002     │   │  Port: 4003     │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               ▼
              ┌─────────────────────────────────────┐
              │        SHARED INFRASTRUCTURE        │
              │  ┌─────────┐ ┌─────────┐ ┌───────┐  │
              │  │PostgreSQL│ │  Redis  │ │MinIO  │  │
              │  │  (Main)  │ │ (Cache/ │ │(S3    │  │
              │  │          │ │  Queue) │ │Compat)│  │
              │  └─────────┘ └─────────┘ └───────┘  │
              │  ┌─────────────────────────────────┐ │
              │  │      Elasticsearch Cluster      │ │
              │  │   (Search, Analytics, Logs)     │ │
              │  └─────────────────────────────────┘ │
              └─────────────────────────────────────┘
```

---

## ۳. بک‌اند (Backend) - Fastify Modular Monolith

### ۳.۱ ساختار ماژول‌ها (Module Structure)

```
backend/src/
├── app.ts                    # Entry point - Fastify instance + plugins
├── config/
│   ├── index.ts             # Config loader (env-based, Zod validated)
│   ├── database.ts          # Prisma client singleton
│   ├── redis.ts             # Redis client (ioredis)
│   ├── elasticsearch.ts     # Elasticsearch client
│   ├── storage.ts           # MinIO client
│   └── features.ts          # Feature flags
├── plugins/
│   ├── cors.ts              # CORS configuration
│   ├── helmet.ts            # Security headers
│   ├── rate-limit.ts        # Rate limiting (per IP, per user)
│   ├── auth.ts              # JWT verification, user attachment
│   ├── validation.ts        # Zod schema validation hook
│   ├── swagger.ts           # OpenAPI documentation
│   ├── metrics.ts           # Prometheus metrics
│   ├── tracing.ts           # OpenTelemetry tracing
│   └── error-handler.ts     # Global error handling
├── modules/
│   ├── auth/
│   │   ├── routes.ts        # POST /auth/login, /register, /refresh, /logout
│   │   ├── service.ts       # Password hashing, token generation, OTP
│   │   ├── schemas.ts       # Zod schemas for auth
│   │   ├── guards.ts        # Role guards, permission checks
│   │   └── index.ts         # Module exports
│   ├── users/
│   │   ├── routes.ts        # GET/PUT /users/me, /users/:id
│   │   ├── service.ts       # Profile, verification, preferences
│   │   ├── schemas.ts
│   │   ├── repository.ts    # Database queries
│   │   └── events.ts        # UserCreated, UserVerified, UserSuspended
│   ├── properties/
│   │   ├── routes.ts        # CRUD + search, availability, calendar
│   │   ├── service.ts       # Business logic, pricing, validation
│   │   ├── schemas.ts
│   │   ├── repository.ts
│   │   ├── search.ts        # Elasticsearch integration
│   │   ├── events.ts        # PropertyCreated, PropertyUpdated, PropertyApproved
│   │   └── pricing.ts       # Dynamic pricing engine
│   ├── bookings/
│   │   ├── routes.ts        # CRUD + confirm, cancel, modify
│   │   ├── service.ts       # Booking logic, conflict detection, pricing calc
│   │   ├── schemas.ts
│   │   ├── repository.ts
│   │   ├── availability.ts  # Calendar availability checking
│   │   ├── events.ts        # BookingCreated, BookingConfirmed, BookingCancelled
│   │   └── saga.ts          # Booking saga orchestrator
│   ├── payments/
│   │   ├── routes.ts        # Webhooks, refunds, payouts
│   │   ├── service.ts       # Payment processing, gateway integration
│   │   ├── gateways/
│   │   │   ├── asia-hawala.ts
│   │   │   ├── qi-card.ts
│   │   │   └── zain-cash.ts
│   │   ├── schemas.ts
│   │   ├── repository.ts
│   │   ├── escrow.ts        # Escrow logic, auto-release
│   │   └── events.ts        # PaymentSucceeded, PaymentFailed, RefundProcessed
│   ├── reviews/
│   │   ├── routes.ts        # CRUD, host response
│   │   ├── service.ts       # Review logic, validation
│   │   ├── schemas.ts
│   │   └── events.ts        # ReviewSubmitted, ReviewPublished
│   ├── messages/
│   │   ├── routes.ts        # Conversations, messages, attachments
│   │   ├── service.ts       # Real-time via WebSocket/SSE
│   │   ├── schemas.ts
│   │   ├── websocket.ts     # Socket.io integration
│   │   └── events.ts        # MessageSent, MessageRead
│   ├── notifications/
│   │   ├── service.ts       # Email, SMS, Push, In-app
│   │   ├── templates/       # MJML email templates
│   │   ├── providers/
│   │   │   ├── email.ts     # Nodemailer / SendGrid
│   │   │   ├── sms.ts       # Local SMS gateway (AsiaCell, Korek)
│   │   │   └── push.ts      # Firebase / Expo Push
│   │   └── queue.ts         # BullMQ job processing
│   ├── analytics/
│   │   ├── routes.ts        # Dashboards, reports, exports
│   │   ├── service.ts       # Aggregations, cohort analysis
│   │   ├── events.ts        # Event tracking, funnel analysis
│   │   └── repository.ts    # ClickHouse / PostgreSQL analytics views
│   └── admin/
│       ├── routes.ts        # Admin-only endpoints
│       ├── service.ts       # User mgmt, property moderation, disputes
│       ├── schemas.ts
│       └── guards.ts        # Admin role guard
├── shared/
│   ├── database/
│   │   ├── prisma.ts        # Prisma client extension (soft delete, logging)
│   │   ├── transactions.ts  # Transaction helpers
│   │   └── migrations/      # Migration utilities
│   ├── redis/
│   │   ├── client.ts        # Redis client with connection pooling
│   │   ├── cache.ts         # Cache helpers (get/set/invalidate)
│   │   ├── session.ts       # Session management
│   │   └── rate-limit.ts    # Sliding window rate limiter
│   ├── elasticsearch/
│   │   ├── client.ts        # ES client with retry logic
│   │   ├── indices.ts       # Index definitions, mappings
│   │   ├── search.ts        # Search helpers (filters, geo, fuzzy)
│   │   └── sync.ts          # PostgreSQL → ES sync (CDC)
│   ├── storage/
│   │   ├── client.ts        # MinIO client
│   │   ├── upload.ts        # Presigned URLs, multipart upload
│   │   ├── transform.ts     # Image optimization (Sharp)
│   │   └── cdn.ts           # Cloudflare R2 / CDN integration
│   ├── errors/
│   │   ├── AppError.ts      # Base error class with code, status, metadata
│   │   ├── NotFoundError.ts
│   │   ├── ValidationError.ts
│   │   ├── AuthorizationError.ts
│   │   ├── ConflictError.ts
│   │   └── ExternalServiceError.ts
│   ├── validation/
│   │   ├── zod.ts           # Zod config, custom types
│   │   ├── common.ts        # Reusable schemas (pagination, IDs, dates)
│   │   └── sanitize.ts      # Input sanitization
│   ├── utils/
│   │   ├── date.ts          # Date helpers (jalali, gregorian)
│   │   ├── currency.ts      # IQD/USD formatting, conversion
│   │   ├── geo.ts           # Distance, bounding box, geohash
│   │   ├── slug.ts          # URL-friendly slug generation
│   │   └── crypto.ts        # Hashing, encryption, JWT helpers
│   ├── events/
│   │   ├── emitter.ts       # Typed event emitter
│   │   ├── events.ts        # Event type definitions
│   │   └── handlers.ts      # Event handler registration
│   └── middleware/
│       ├── request-id.ts    # Request correlation ID
│       ├── logging.ts       # Structured logging (Pino)
│       └── tenant.ts        # Multi-tenancy (future)
└── types/
    ├── express.d.ts         # Fastify type extensions
    ├── prisma.d.ts          # Prisma type extensions
    └── global.d.ts          # Global type declarations
```

### ۳.۲ جریان درخواست (Request Flow)

```
Request → API Gateway → Fastify
  → [CORS] → [Helmet] → [RateLimit] → [RequestID] → [Logging]
  → [Auth: JWT verify + User attach] → [Validation: Zod]
  → Route Handler (Module)
    → Service (Business Logic)
      → Repository (Data Access)
        → Prisma / Redis / Elasticsearch / MinIO
      → Event Emitter (Domain Events)
    → Response Serialization
  → [Error Handler] → Response
```

### ۳.۳ پیاده‌سازی Saga Pattern برای رزرو (Booking Saga)

```typescript
// modules/bookings/saga.ts
export class BookingSaga {
  private steps: SagaStep[] = [
    { name: 'checkAvailability', execute: this.checkAvailability, compensate: null },
    { name: 'createBooking', execute: this.createBooking, compensate: this.deleteBooking },
    { name: 'holdPayment', execute: this.holdPayment, compensate: this.releaseHold },
    { name: 'notifyHost', execute: this.notifyHost, compensate: null },
    { name: 'confirmBooking', execute: this.confirmBooking, compensate: this.cancelBooking },
  ];

  async execute(input: BookingInput): Promise<Booking> {
    const context = new SagaContext();
    for (const step of this.steps) {
      try {
        await step.execute(context, input);
      } catch (error) {
        await this.compensate(context, step);
        throw error;
      }
    }
    return context.booking;
  }
}
```

---

## ۴. فرانت‌اند (Frontend) - Next.js 14 App Router

### ۴.۱ معماری صفحات (Page Architecture)

```
frontend/src/app/
├── (auth)/                    # Route group: Auth pages (no layout)
│   ├── login/
│   │   └── page.tsx           # Server Component + Client Form
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   └── verify-email/
├── (main)/                    # Route group: Public pages (with PublicLayout)
│   ├── layout.tsx             # PublicLayout: Header, Footer, SEO
│   ├── page.tsx               # Homepage: Hero, Search, Featured, Cities
│   ├── villas/
│   │   ├── page.tsx           # Listing: SSR + SearchParams, Filters sidebar
│   │   ├── [slug]/
│   │   │   ├── page.tsx       # Detail: SSR, Gallery, Map, Reviews, BookingWidget
│   │   │   ├── layout.tsx     # PropertyLayout: Sticky booking, Share
│   │   │   └── loading.tsx    # Skeleton
│   │   └── map/
│   │       └── page.tsx       # Map view: Leaflet/Mapbox, clustering
│   ├── cities/
│   │   ├── [governorate]/
│   │   │   ├── page.tsx       # City landing: SEO, Top villas, Areas
│   │   │   └── [district]/
│   │   │       └── page.tsx   # Area landing
│   ├── about/
│   ├── help/
│   └── terms/
├── dashboard/                 # Protected: Authenticated users only
│   ├── layout.tsx             # DashboardLayout: Sidebar, Header, UserMenu
│   ├── (guest)/               # Guest dashboard
│   │   ├── layout.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx       # Upcoming, Past, Cancelled tabs
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx   # Booking detail: Timeline, Receipt, Chat
│   │   │   │   └── cancel/
│   │   ├── favorites/
│   │   │   └── page.tsx
│   │   ├── trips/
│   │   │   └── page.tsx       # Trip planner, itinerary
│   │   ├── wallet/
│   │   │   └── page.tsx       # Credits, Gift cards, Payment methods
│   │   └── profile/
│   │       ├── page.tsx
│   │       ├── security/
│   │       └── notifications/
│   └── (host)/                # Host dashboard
│       ├── layout.tsx
│       ├── properties/
│       │   ├── page.tsx       # List: Status badges, Actions, Bulk ops
│       │   ├── new/
│       │   │   └── page.tsx   # Multi-step wizard: Basic → Details → Photos → Pricing → Calendar → Publish
│       │   ├── [id]/
│       │   │   ├── page.tsx   # Property detail: Analytics, Calendar, Reviews
│       │   │   ├── edit/
│       │   │   ├── calendar/
│       │   │   │   └── page.tsx # Interactive calendar: Pricing, Blocks, Min nights
│       │   │   ├── pricing/
│       │   │   │   └── page.tsx # Dynamic pricing rules, Seasonal, Weekend, Events
│       │   │   └── photos/
│       │   │       └── page.tsx # Drag-drop, Reorder, Captions, Cover
│       ├── bookings/
│       │   ├── page.tsx       # All bookings: Filter by status, date, property
│       │   ├── [id]/
│       │   │   └── page.tsx   # Booking management: Confirm, Message, Check-in/out
│       │   └── calendar/
│       │       └── page.tsx   # Master calendar: All properties, Drag blocks
│       ├── earnings/
│       │   ├── page.tsx       # Overview: GMV, Net, Commission, Trends (Recharts)
│       │   ├── payouts/
│       │   │   └── page.tsx   # Payout history, Schedule, Bank details
│       │   └── analytics/
│       │       └── page.tsx   # Occupancy, ADR, RevPAR, Conversion funnel
│       ├── messages/
│       │   └── page.tsx       # Conversations list, Real-time chat
│       ├── reviews/
│       │   └── page.tsx       # Received reviews, Response management
│       └── settings/
│           ├── page.tsx
│           ├── profile/
│           ├── banking/
│           ├── notifications/
│           └── subscription/
├── admin/                     # Admin only (role: ADMIN)
│   ├── layout.tsx             # AdminLayout: Sidebar, Topbar
│   ├── dashboard/
│   │   └── page.tsx           # KPIs, Charts, Recent activity
│   ├── users/
│   ├── properties/
│   ├── bookings/
│   ├── payments/
│   ├── disputes/
│   ├── analytics/
│   └── settings/
├── api/                       # API Routes (Next.js API - for webhooks, etc.)
│   ├── auth/[...nextauth]/
│   ├── webhooks/
│   │   ├── payments/
│   │   └── sms/
│   └── search/
│       └── suggest/
├── globals.css                # Tailwind + CSS Variables
├── layout.tsx                 # Root layout: Providers, Fonts, Toasters
├── loading.tsx                # Global loading
├── error.tsx                  # Global error boundary
├── not-found.tsx              # 404 page
└── robots.ts                  # Robots.txt generation
```

### ۴.۲ مدیریت حالت (State Management)

| لایه | ابزار | کاربرد |
|------|-------|--------|
| **Server State** | TanStack Query (React Query) | Data fetching, caching, mutations, invalidation |
| **Client State (Global)** | Zustand | Auth user, UI state (modals, sidebar), Cart/Booking flow |
| **Form State** | React Hook Form + Zod | Validation, submission, error handling |
| **URL State** | Next.js SearchParams | Filters, pagination, sorting (shareable URLs) |
| **Real-time** | Socket.io Client / SSE | Messages, Notifications, Booking updates |

### ۴.۳ بستر کامپوننت (Component Architecture)

```
components/
├── ui/                        # Base UI primitives (shadcn-inspired)
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── date-picker.tsx        # Custom: Jalali + Gregorian
│   ├── modal.tsx
│   ├── toast.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── skeleton.tsx
│   └── index.ts
├── forms/                     # Form-specific components
│   ├── property-wizard/       # Multi-step property creation
│   ├── booking-form/          # Booking flow steps
│   ├── review-form/
│   └── search-form/
├── villa/                     # Villa-specific components
│   ├── villa-card.tsx         # Listing card (horizontal/vertical)
│   ├── villa-gallery.tsx      # Image gallery with lightbox
│   ├── villa-map.tsx          # Mapbox/Leaflet integration
│   ├── amenities-list.tsx     # Categorized icons
│   ├── availability-calendar.tsx # Interactive calendar
│   ├── price-breakdown.tsx    # Transparent pricing
│   └── host-badge.tsx         # Verified, Superhost, Response rate
├── booking/                   # Booking flow components
│   ├── steps/                 # Step1: Dates, Step2: Guests, Step3: Payment
│   ├── payment-methods.tsx    # Gateway selection
│   ├── escrow-info.tsx
│   └── confirmation.tsx
├── layout/
│   ├── header.tsx             # Logo, Search, Auth, Language, Currency
│   ├── footer.tsx
│   ├── sidebar.tsx            # Dashboard sidebar
│   ├── mobile-nav.tsx
│   └── cookie-banner.tsx
├── dashboard/
│   ├── stats-card.tsx
│   ├── chart-wrapper.tsx      # Recharts wrapper
│   ├── data-table.tsx         # TanStack Table wrapper
│   └── empty-state.tsx
└── providers/
    ├── query-provider.tsx     # TanStack Query Provider
    ├── auth-provider.tsx      # NextAuth Provider
    ├── theme-provider.tsx     # next-themes
    └── socket-provider.tsx    # Socket.io Provider
```

---

## ۵. موبایل (Mobile) - React Native + Expo

### ۵.۱ استراتژی اشتراک کد (Code Sharing Strategy)

```
shared/                        # Shared package (npm workspace)
├── types/                     # TypeScript types (API, Domain)
├── constants/                 # Enums, Config, Amenities list
├── utils/                     # Date, Currency, Geo, Validation
├── schemas/                   # Zod schemas (shared validation)
├── api/                       # API client (TanStack Query + Axios)
│   ├── client.ts
│   ├── endpoints/
│   └── hooks/                 # useQuery, useMutation hooks
└── components/                # Shared UI primitives (React Native Web compatible)
    ├── Button.tsx
    ├── Input.tsx
    ├── Card.tsx
    └── ...
```

### ۵.۲ ساختار اپلیکیشن موبایل

```
mobile/src/
├── app/                       # Expo Router (file-based routing)
│   ├── _layout.tsx            # Root layout: Providers, Auth guard
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify-phone.tsx
│   ├── (tabs)/                # Main tab navigation
│   │   ├── _layout.tsx        # Tab bar config
│   │   ├── explore.tsx        # Search + Map + List
│   │   ├── trips.tsx          # My bookings / Upcoming
│   │   ├── messages.tsx       # Conversations
│   │   └── profile.tsx        # Settings, Wallet, Help
│   ├── villa/
│   │   ├── [id].tsx           # Villa detail (shared with web logic)
│   │   └── booking.tsx        # Booking flow
│   ├── host/
│   │   ├── dashboard.tsx
│   │   ├── properties.tsx
│   │   ├── calendar.tsx
│   │   └── earnings.tsx
│   └── +not-found.tsx
├── components/                # Mobile-specific components
│   ├── Explore/
│   │   ├── SearchBar.tsx
│   │   ├── FilterSheet.tsx    # Bottom sheet filters
│   │   ├── VillaList.tsx      # FlashList for performance
│   │   └── MapView.tsx        # React Native Maps
│   ├── Villa/
│   │   ├── ImageCarousel.tsx  # Reanimated carousel
│   │   ├── AmenitiesGrid.tsx
│   │   ├── HostProfile.tsx
│   │   └── BookingCTA.tsx
│   ├── Booking/
│   │   ├── DatePicker.tsx     # React Native Calendars
│   │   ├── GuestPicker.tsx
│   │   ├── PaymentSheet.tsx   # Native payment sheet
│   │   └── ConfirmationScreen.tsx
│   └── UI/
│       ├── LoadingSkeleton.tsx
│       ├── EmptyState.tsx
│       └── ErrorBoundary.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useVillas.ts
│   ├── useBookings.ts
│   ├── useMessages.ts
│   └── useLocation.ts         # GPS, Permissions
├── services/
│   ├── api.ts                 # Shared API client
│   ├── storage.ts             # SecureStore (tokens), AsyncStorage
│   ├── notifications.ts       # Expo Push Notifications
│   ├── location.ts            # Location services
│   └── analytics.ts           # Expo Analytics / Amplitude
├── stores/
│   ├── authStore.ts           # Zustand: user, tokens, permissions
│   ├── uiStore.ts             # Modals, sheets, tabs
│   └── bookingStore.ts        # Multi-step booking flow state
├── utils/
│   ├── platform.ts            # Platform-specific helpers
│   ├── haptics.ts             # Haptic feedback
│   └── deeplinking.ts         # Universal links handling
└── constants/
    ├── colors.ts
    ├── spacing.ts
    ├── amenities.ts
    └── cities.ts
```

---

## ۶. دیتابیس (Database) - PostgreSQL 16 + Prisma

### ۶.۱ استراتژی ایندکس‌گذاری (Indexing Strategy)

```sql
-- جستجوی جغرافیایی (PostGIS extension)
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "Property" ADD COLUMN "location" geometry(Point, 4326);
CREATE INDEX "Property_location_idx" ON "Property" USING GIST ("location");

-- جستجوی متنی کامل
CREATE INDEX "Property_search_idx" ON "Property" 
USING GIN (to_tsvector('arabic', "title" || ' ' || "description"));

-- فیلترهای رایج
CREATE INDEX "Property_governorate_district_status_idx" 
ON "Property" ("governorate", "district", "status");
CREATE INDEX "Property_host_status_idx" ON "Property" ("hostId", "status");
CREATE INDEX "Property_featured_status_idx" ON "Property" ("featured", "status") WHERE "featured" = true;

-- رزروها - تداخل تاریخ
CREATE INDEX "Booking_property_dates_idx" ON "Booking" ("propertyId", "checkIn", "checkOut")
WHERE "status" IN ('CONFIRMED', 'PENDING');

-- کاربران
CREATE INDEX "User_phone_idx" ON "User" ("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX "User_email_idx" ON "User" ("email");
```

### ۶.۲ Soft Delete Pattern

```prisma
// همه مدل‌ها
model BaseModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  @@index([deletedAt])
}

// Query helper
prisma.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
    },
  },
});
```

### ۶.۳ Partitioning Strategy (برای مقیاس)

```sql
-- پارتیشن‌بندی ماهانه برای Booking (مقیاس بالا)
CREATE TABLE "Booking" (
  ...
) PARTITION BY RANGE (DATE_TRUNC('month', "checkIn"));

-- ایجاد پارتیشن‌ها هر ماه
CREATE TABLE "Booking_2026_01" PARTITION OF "Booking"
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## ۷. جستجو (Search) - Elasticsearch 8

### ۷.۱ Mapping ایندکس Villa

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": { 
        "type": "text", 
        "analyzer": "arabic",
        "fields": { "keyword": { "type": "keyword" } }
      },
      "description": { "type": "text", "analyzer": "arabic" },
      "governorate": { "type": "keyword" },
      "district": { "type": "keyword" },
      "neighborhood": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "maxGuests": { "type": "integer" },
      "bedrooms": { "type": "integer" },
      "bathrooms": { "type": "integer" },
      "basePriceNightly": { "type": "long" },
      "currency": { "type": "keyword" },
      "amenities": { "type": "keyword" },
      "images": { "type": "keyword" },
      "coverImage": { "type": "keyword" },
      "status": { "type": "keyword" },
      "featured": { "type": "boolean" },
      "hostId": { "type": "keyword" },
      "hostVerified": { "type": "boolean" },
      "averageRating": { "type": "float" },
      "reviewCount": { "type": "integer" },
      "viewCount": { "type": "integer" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  },
  "settings": {
    "analysis": {
      "analyzer": {
        "arabic": { "type": "arabic" },
        "kurdish": { "type": "custom", "tokenizer": "standard", "filter": ["lowercase", "asciifolding"] }
      }
    },
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}
```

### ۷.۲ Query DSL برای جستجوی پیشرفته

```json
{
  "bool": {
    "must": [
      { "term": { "status": "ACTIVE" } },
      { "range": { "maxGuests": { "gte": 4 } } },
      { "terms": { "amenities": ["pool", "bbq", "garden"] } },
      { "geo_distance": { "distance": "50km", "location": { "lat": 36.19, "lon": 44.01 } } }
    ],
    "should": [
      { "term": { "featured": true } },
      { "range": { "averageRating": { "gte": 4.5 } } }
    ],
    "filter": [
      { "range": { "basePriceNightly": { "gte": 50000, "lte": 500000 } } }
    ]
  },
  "sort": [
    { "_score": "desc" },
    { "featured": { "order": "desc" } },
    { "averageRating": { "order": "desc" } }
  ],
  "highlight": {
    "fields": { "title": {}, "description": {} }
  },
  "aggs": {
    "governorates": { "terms": { "field": "governorate" } },
    "price_ranges": { "histogram": { "field": "basePriceNightly", "interval": 50000 } },
    "amenities": { "terms": { "field": "amenities", "size": 20 } }
  }
}
```

---

## ۸. احراز هویت و مجوز (Auth & Authorization)

### ۸.۱ مدل توکن (Token Model)

```typescript
// Access Token (JWT) - 15 min
interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;
  role: UserRole;        // GUEST | HOST | ADMIN
  permissions: string[]; // Fine-grained permissions
  sessionId: string;     // For revocation
  type: 'access';
  iat: number;
  exp: number;
}

// Refresh Token - 30 days (stored in Redis + HttpOnly Cookie)
interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: 'refresh';
  deviceId: string;      // For device management
  iat: number;
  exp: number;
}
```

### ۸.۲ مجوزها (Permissions Matrix)

| Permission | GUEST | HOST | ADMIN |
|------------|-------|------|-------|
| `villa:create` | ❌ | ✅ | ✅ |
| `villa:read:own` | ❌ | ✅ | ✅ |
| `villa:read:any` | ✅ (public) | ✅ | ✅ |
| `villa:update:own` | ❌ | ✅ | ✅ |
| `villa:update:any` | ❌ | ❌ | ✅ |
| `villa:delete:own` | ❌ | ✅ | ✅ |
| `villa:approve` | ❌ | ❌ | ✅ |
| `booking:create` | ✅ | ✅ | ✅ |
| `booking:read:own` | ✅ | ✅ | ✅ |
| `booking:read:host` | ❌ | ✅ | ✅ |
| `booking:confirm` | ❌ | ✅ (own) | ✅ |
| `booking:cancel:own` | ✅ | ✅ | ✅ |
| `booking:cancel:any` | ❌ | ❌ | ✅ |
| `payment:process` | ✅ | ✅ | ✅ |
| `payment:refund` | ❌ | ❌ | ✅ |
| `payout:manage` | ❌ | ✅ (own) | ✅ |
| `user:manage` | ❌ | ❌ | ✅ |
| `analytics:view:own` | ✅ | ✅ | ✅ |
| `analytics:view:all` | ❌ | ❌ | ✅ |
| `admin:access` | ❌ | ❌ | ✅ |

### ۸.۳ RBAC Implementation

```typescript
// shared/auth/guards.ts
export const requirePermission = (...permissions: Permission[]) => 
  async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!user) throw new UnauthorizedError();
    
    const userPermissions = getPermissionsForRole(user.role);
    const hasPermission = permissions.every(p => userPermissions.includes(p));
    
    if (!hasPermission) throw new ForbiddenError('Insufficient permissions');
  };

// Usage in routes
fastify.post('/villas', {
  preHandler: [requirePermission('villa:create')],
  schema: { body: CreateVillaSchema }
}, async (request, reply) => {
  // Handler
});
```

---

## ۹. پردازش غیرهمگام (Async Processing) - BullMQ + Redis

### ۹.۱ очередه‌های کار (Queues)

| Queue | Job Types | Concurrency | Priority |
|-------|-----------|-------------|----------|
| `emails` | Welcome, Booking confirmation, Reminders, Marketing | 10 | Normal |
| `sms` | OTP, Booking alerts, Payment notifications | 5 | High |
| `push` | Push notifications (mobile) | 20 | Normal |
| `images` | Optimization, Thumbnails, CDN upload | 3 | Low |
| `search-sync` | PostgreSQL → Elasticsearch sync | 2 | Normal |
| `payouts` | Host payout processing, Bank transfers | 1 | High |
| `analytics` | Event aggregation, Report generation | 2 | Low |
| `webhooks` | Payment gateway callbacks, External APIs | 5 | High |
| `cleanup` | Expired bookings, Old sessions, Temp files | 1 | Low |

### ۹.۲ Job Example: Booking Confirmation Email

```typescript
// modules/notifications/queue.ts
export const bookingConfirmationJob = {
  name: 'booking:confirmation',
  processor: async (job: Job<BookingConfirmationData>) => {
    const { bookingId, guestEmail, guestName, propertyTitle, checkIn, checkOut } = job.data;
    
    await emailService.send({
      to: guestEmail,
      template: 'booking-confirmation',
      data: { guestName, propertyTitle, checkIn, checkOut, bookingUrl: `${config.appUrl}/dashboard/bookings/${bookingId}` }
    });
    
    // Schedule reminder job (24h before check-in)
    await reminderQueue.add('booking:reminder', { bookingId }, {
      delay: Date.parse(checkIn) - Date.now() - 24 * 60 * 60 * 1000
    });
  }
};
```

---

## ۱۰. مانیتورینگ و مشاهده‌پذیری (Observability)

### ۱۰.۱ متریک‌های کلیدی (Key Metrics - RED Method)

| Метод | Metrics | Target |
|-------|---------|--------|
| **Rate** | `http_requests_total` (by endpoint, method, status) | >1000 req/s |
| **Errors** | `http_requests_errors_total` (5xx rate) | <0.1% |
| **Duration** | `http_request_duration_seconds` (p50, p95, p99) | p95 < 500ms |

### ۱۰.۲ Business Metrics

```prometheus
# Custom business metrics
villa_bookings_total{status="confirmed"} 1234
villa_gmv_iqd_total 1250000000
villa_active_hosts 150
villa_active_guests 5000
villa_conversion_rate{step="search_to_booking"} 0.032
villa_host_churn_rate 0.05
villa_avg_response_time_hours 2.5
```

### ۱۰.۳ Distributed Tracing (OpenTelemetry)

```typescript
// plugins/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export const tracingPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    const tracer = trace.getTracer('villakurd-api');
    const span = tracer.startSpan(`${request.method} ${request.routeOptions?.url || request.url}`);
    
    request.span = span;
    context.with(trace.setSpan(context.active(), span), () => {
      // Request processing
    });
  });
  
  fastify.addHook('onResponse', async (request, reply) => {
    request.span?.setAttribute('http.status_code', reply.statusCode);
    request.span?.setStatus({ 
      code: reply.statusCode >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK 
    });
    request.span?.end();
  });
};
```

### ۱۰.۴ Logging Structure (Pino)

```json
{
  "level": 30,
  "time": 1700000000000,
  "pid": 1234,
  "hostname": "api-1",
  "req": {
    "id": "req-abc123",
    "method": "POST",
    "url": "/api/v1/bookings",
    "headers": { "user-agent": "..." },
    "remoteAddress": "192.168.1.1",
    "remotePort": 54321
  },
  "user": { "id": "usr-123", "role": "GUEST" },
  "span": { "traceId": "abc", "spanId": "def" },
  "msg": "Booking created",
  "bookingId": "bkg-456",
  "propertyId": "prop-789",
  "amount": 250000
}
```

---

## ۱۱. استقرار (Deployment) - Docker + Kubernetes

### ۱۱.۱ Docker Compose (Development)

```yaml
# docker-compose.yml (root)
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: villakurd
      POSTGRES_USER: villakurd
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U villakurd"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes: [redis_data:/data]
    ports: ["6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes: [es_data:/usr/share/elasticsearch/data]
    ports: ["9200:9200", "9300:9300"]
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes: [minio_data:/data]
    ports: ["9000:9000", "9001:9001"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 5

  backend:
    build: ./backend
    ports: ["4000:4000"]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://villakurd:${DB_PASSWORD}@postgres:5432/villakurd
      - REDIS_URL=redis://redis:6379
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - MINIO_ENDPOINT=http://minio:9000
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
      elasticsearch: { condition: service_healthy }
      minio: { condition: service_healthy }
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - NEXTAUTH_URL=http://localhost:3000
    depends_on: [backend]
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  postgres_data:
  redis_data:
  es_data:
  minio_data:
```

### ۱۱.۲ Kubernetes Manifests (Production Ready)

```yaml
# infrastructure/kubernetes/base/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: villakurd-backend
  labels:
    app: villakurd-backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: villakurd-backend
  template:
    metadata:
      labels:
        app: villakurd-backend
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "4000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: backend
        image: villakurd/backend:${VERSION}
        ports:
        - containerPort: 4000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: villakurd-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: villakurd-secrets
              key: redis-url
        - name: ELASTICSEARCH_URL
          value: "http://elasticsearch:9200"
        - name: MINIO_ENDPOINT
          value: "http://minio:9000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: villakurd-backend
spec:
  selector:
    app: villakurd-backend
  ports:
  - port: 4000
    targetPort: 4000
  type: ClusterIP
```

---

## ۱۲. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9, run_install: false }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run linting
        run: pnpm lint
      
      - name: Run type checking
        run: pnpm typecheck
      
      - name: Run unit tests
        run: pnpm test --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env: { POSTGRES_DB: test, POSTGRES_USER: test, POSTGRES_PASSWORD: test }
        ports: [5432:5432]
        options: --health-cmd="pg_isready" --health-interval=10s --health-timeout=5s --health-retries=5
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
        options: --health-cmd="redis-cli ping" --health-interval=10s --health-timeout=5s --health-retries=5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: cd backend && pnpm prisma migrate deploy
      - run: cd backend && pnpm test:e2e

  build-and-push:
    needs: [lint-and-test, backend-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with: { registry: ${{ env.REGISTRY }}, username: ${{ github.actor }}, password: ${{ secrets.GITHUB_TOKEN }} }
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          kubectl set image deployment/villakurd-backend backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }} -n staging
          kubectl set image deployment/villakurd-frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }} -n staging
      - name: Run smoke tests
        run: pnpm test:smoke --env=staging

  deploy-production:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production (Blue/Green)
        run: |
          # ArgoCD / Flux / Manual approval
          kubectl set image deployment/villakurd-backend backend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }} -n production
          kubectl set image deployment/villakurd-frontend frontend=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }} -n production
      - name: Run smoke tests
        run: pnpm test:smoke --env=production
      - name: Notify
        run: curl -X POST $SLACK_WEBHOOK -d '{"text":"🚀 VillaKurd deployed to production"}'
```

---

## ۱۳. امنیت (Security)

### ۱۳.۱ Security Headers (Helmet)

```typescript
// plugins/helmet.ts
export const helmetPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js needs unsafe-eval in dev
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", process.env.NEXT_PUBLIC_API_URL],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false, // Next.js compatibility
  });
};
```

### ۱۳.۲ Rate Limiting Strategy

```typescript
// plugins/rate-limit.ts
export const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  // Global rate limit
  await fastify.register(import('@fastify/rate-limit'), {
    global: true,
    max: 1000,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    skipOnError: true,
  });

  // Auth endpoints - stricter
  await fastify.register(import('@fastify/rate-limit'), {
    max: 10,
    timeWindow: '15 minutes',
    keyGenerator: (req) => `auth:${req.ip}`,
    scope: ['/auth/login', '/auth/register', '/auth/forgot-password'],
  });

  // Search API - moderate
  await fastify.register(import('@fastify/rate-limit'), {
    max: 60,
    timeWindow: '1 minute',
    keyGenerator: (req) => `search:${req.user?.id || req.ip}`,
    scope: ['/api/v1/villas/search'],
  });

  // Booking creation - per user
  await fastify.register(import('@fastify/rate-limit'), {
    max: 5,
    timeWindow: '1 hour',
    keyGenerator: (req) => `booking:${req.user?.id}`,
    scope: ['/api/v1/bookings'],
    method: ['POST'],
  });
};
```

### ۱۳.۳ Input Validation & Sanitization

```typescript
// shared/validation/zod.ts
import { z } from 'zod';

// Custom types
export const CuidSchema = z.string().cuid();
export const PhoneIQSchema = z.string().regex(/^(\+964|0)?7\d{9}$/);
export const PriceIQDSchema = z.number().int().positive().max(10_000_000_000);
export const CoordinatesSchema = z.object({
  lat: z.number().min(29).max(38), // Iraq bounds
  lng: z.number().min(38).max(50),
});

// Sanitization
export const sanitizeHtml = (input: string): string => 
  DOMPurify.sanitize(input, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'] });

export const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
```

---

## ۱۴. تست (Testing Strategy)

### ۱۴.۱ Pyramide تست

```
                    ┌─────────────┐
                    │   E2E (10%) │  ← Playwright (Web), Detox (Mobile)
                    │  Critical   │     Happy paths, Payment flows
                    │   Paths     │
                   ┌┴─────────────┴┐
                  ┌┴───────────────┴┐
                 ┌┴── Integration ───┴┐  ← 20% - Testcontainers + Supertest
                │  (API, DB, Redis)  │     Module boundaries, Contracts
               ┌┴────────────────────┴┐
              ┌┴──── Unit Tests ──────┴┐   ← 70% - Vitest/Jest
             │  (Pure functions,      │      Services, Utils, Validators
             │   Business logic)      │
            └─────────────────────────┘
```

### ۱۴.۲ Contract Testing (Pact)

```typescript
// tests/contracts/booking-consumer.test.ts
import { pactWith } from 'jest-pact';
import { BookingApiClient } from '@/api/clients/booking';

pactWith({ consumer: 'Frontend', provider: 'BookingAPI' }, provider => {
  let client: BookingApiClient;
  
  beforeEach(() => {
    client = new BookingApiClient(provider.mockService.baseUrl);
  });

  test('creates a booking', async () => {
    await provider.addInteraction({
      state: 'property exists and is available',
      uponReceiving: 'a request to create a booking',
      withRequest: {
        method: 'POST',
        path: '/api/v1/bookings',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
        body: { propertyId: 'prop-123', checkIn: '2026-06-15', checkOut: '2026-06-17', guests: 4 },
      },
      willRespondWith: {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: like({ id: 'booking-456', status: 'PENDING', totalPrice: 250000 }),
      },
    });

    const booking = await client.createBooking({ propertyId: 'prop-123', checkIn: '2026-06-15', checkOut: '2026-06-17', guests: 4 });
    expect(booking.id).toBeDefined();
    expect(booking.status).toBe('PENDING');
  });
});
```

---

## ۱۵. چک‌لیست تولید (Production Checklist)

### پیش از لانچ (Pre-Launch)
- [ ] **Security**: Penetration test انجام شده، تمام Critical/High fix شده
- [ ] **Performance**: Load test (1000 concurrent users)، p95 < 500ms
- [ ] **Payments**: تمام درگاه‌ها در Sandbox تست شده، Webhook‌ها کار می‌کنند
- [ ] **Database**: Backup strategy، Point-in-time recovery، Read replica
- [ ] **Monitoring**: Alerts تنظیم شده (PagerDuty/Slack)، Dashboardها ساخته شده
- [ ] **Legal**: Privacy Policy، Terms of Service، Cookie Policy (عربی/کوردی/انگلیسی)
- [ ] **Compliance**: Data residency確認، PCI DSS SAQ-A، Iraq data protection law
- [ ] **SEO**: Sitemap، Robots.txt، Meta tags، Structured data (Schema.org)
- [ ] **Accessibility**: WCAG 2.1 AA compliance (axe-core automated + manual)
- [ ] **Mobile**: TestFlight/Play Console Internal testing، Push notifications 작동

### پس از لانچ (Post-Launch - Week 1)
- [ ] Daily: Error rates، Performance، Business metrics review
- [ ] Daily: Support tickets review، User feedback triage
- [ ] Week 1: A/B test homepage variants
- [ ] Week 1: Collect NPS survey از کاربران اولیه
- [ ] Week 2: First retrospective، Technical debt prioritization

---

## ۱۶. تکنولوژی‌ها و نسخه‌ها (Tech Stack Versions)

| دسته | تکنولوژی | نسخه | دلیل |
|------|-----------|-------|------|
| **Runtime** | Node.js | 20 LTS (Iron) | پشتیبانی طولانی، عملکرد بالا |
| **Package Manager** | pnpm | 9.x | سریع، disk-efficient، monorepo support |
| **Language** | TypeScript | 5.4+ | Type safety، پیشرفته‌ترین ویژگی‌ها |
| **Backend Framework** | Fastify | 4.26+ | عملکرد بالا، schema-based، plugin ecosystem |
| **Frontend Framework** | Next.js | 14.2+ (App Router) | SSR/SSG/ISR، SEO، React 18 features |
| **Mobile Framework** | Expo SDK | 50+ | Entwicklung schnell، EAS Build، OTA updates |
| **Database** | PostgreSQL | 16 | ACID، JSONB، PostGIS، Partitioning |
| **ORM** | Prisma | 5.12+ | Type-safe، Migrations، Middleware |
| **Cache/Queue** | Redis | 7.2+ | Cluster، Streams، Lua scripting |
| **Search** | Elasticsearch | 8.11+ | Vector search، Arabic analyzer، Security |
| **Object Storage** | MinIO | RELEASE.2024 | S3-compatible، On-prem، Erasure coding |
| **API Gateway** | Kong | 3.4+ | Plugin ecosystem، Kubernetes native |
| **Container Orchestration** | Kubernetes | 1.28+ | Industry standard، Auto-scaling |
| **CI/CD** | GitHub Actions | - | رایگان، Integrated، Matrix builds |
| **Monitoring** | Prometheus + Grafana | 2.47+ / 10.1+ | Open standard، Powerful queries |
| **Error Tracking** | Sentry | - | Release tracking، Performance، Replay |
| **Logging** | Pino | 8.19+ | سریع، JSON، Child loggers |
| **Testing** | Vitest / Playwright | 1.5+ / 1.44+ | Fast، ESM native، Browser automation |
| **Validation** | Zod | 3.22+ | TypeScript-first، Schema composition |
| **State Management** | TanStack Query + Zustand | 5.28+ / 4.5+ | Server/Client state separation |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first، JIT، Dark mode |
| **UI Components** | Radix UI + Custom | 1.0+ | Accessible، Unstyled، Composable |
| **Forms** | React Hook Form | 7.51+ | Performance، Validation integration |
| **Date Handling** | date-fns + jalali-moment | 3.6+ / 3.3+ | Gregorian + Jalali support |
| **Charts** | Recharts | 2.12+ | React-native، Composable، Responsive |
| **Maps** | Mapbox GL JS / Leaflet | 3.2+ / 1.9+ | Vector tiles، Offline support |
| **Image Optimization** | Sharp | 0.33+ | سریع، WebP/AVIF، Responsive |

---

> **نکته:** این معماری برای مقیاس ۱۰,۰۰۰+ ویلا و ۱۰۰,۰۰۰+ کاربر طراحی شده است. با رشد، ماژول‌ها می‌توانند به مایکروسرویس‌های مستقل تبدیل شوند (Strangler Fig pattern).