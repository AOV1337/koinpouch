# Koinpouch

A marketplace for collectibles — trading cards, figurines, coins, and stamps. Built for verified sellers and serious collectors.

---

## Overview

Koinpouch is a full-stack web marketplace where verified sellers can list collectible items and buyers can browse, bookmark, and purchase them securely. The platform includes identity verification (KYC), a seller reputation system with tier badges, editorial content (guides and a Hall of Fame), an AI assistant, and a full admin panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Inline styles + CSS custom properties |
| Backend | Node.js + Express |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (email/password + JWT) |
| Storage | Supabase Storage (listing images, KYC docs, avatars) |
| Payments | Stripe (Payment Intents + Webhooks) |
| AI | Google Gemini API |
| Routing | React Router v6 |

---

## Project Structure

```
koinpouch/
├── client/                   # React frontend
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── Avatar.tsx
│       │   ├── ListingCard.tsx
│       │   ├── NotificationBell.tsx
│       │   ├── Pagination.tsx
│       │   ├── ReportListingModal.tsx
│       │   ├── ReviewForm.tsx
│       │   ├── SellerBadge.tsx
│       │   └── ChatWidget.tsx
│       ├── hooks/            # Custom React hooks
│       │   ├── useAuth.ts
│       │   ├── useAvatarUrl.ts
│       │   ├── useProfile.ts
│       │   └── useTheme.ts
│       ├── layouts/          # Page layout wrappers
│       │   ├── MainLayout.tsx
│       │   └── DashboardLayout.tsx
│       ├── lib/              # Shared utilities and constants
│       │   ├── supabase.ts   # Supabase client (single source)
│       │   ├── adminSidebar.ts
│       │   ├── buyerSidebar.ts
│       │   ├── listingMeta.ts
│       │   ├── notifications.ts
│       │   └── storage.ts
│       └── pages/            # Route-level components
│           ├── Home.tsx
│           ├── Browse.tsx
│           ├── ItemDetail.tsx
│           ├── SellerProfile.tsx
│           ├── Guides.tsx / GuideDetail.tsx / GuideEditor.tsx
│           ├── HallOfFame.tsx / HallOfFameDetail.tsx / HallOfFameEditor.tsx
│           ├── BuyerDashboard.tsx / BuyerOrders.tsx / ...
│           ├── SellerDashboard.tsx / SellerListings.tsx / ...
│           ├── AdminDashboard.tsx / AdminListingsManager.tsx / ...
│           └── ...
└── server/                   # Node.js + Express backend
    └── index.ts              # Stripe payment intents + webhook handler
```

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Environment variables

Create `client/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Create `server/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Install and run

```bash
# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install

# Run frontend (dev)
cd ../client && npm run dev

# Run backend (separate terminal)
cd ../server && npm run dev
```

### Database setup

Run the SQL migration files in order from the `migrations/` folder in the Supabase SQL editor. Each file is numbered and self-documented.

---

## Key Design Decisions

**RLS everywhere.** All data access is controlled by PostgreSQL Row Level Security policies, not just frontend guards. Every role (buyer, seller, admin) has explicit policies for every operation it needs. Missing a policy results in silent empty data, not an error — so this was tested carefully.

**No rich-text editor dependency.** The Guide and Hall of Fame editors use a plain `<textarea>` with a custom Markdown renderer built in-house. Supports headings, bold, italic, paragraphs, and inline images — sufficient for editorial content without adding a heavy dependency.

**Live aggregates over cached columns.** The `seller_profiles` table has `reputation_score` and `total_sales` columns that were intended to be kept up to date by triggers. In practice these proved unreliable, so every part of the UI that displays these values computes them live from the `reviews` and `orders` tables instead.

**Stripe webhooks for order finalization.** Orders are created and listing status is set to `sold` only after receiving and verifying a Stripe webhook, not on the client's `confirmCardPayment` response. This correctly handles edge cases where the browser closes before the client-side success handler runs.

---

Private project, all rights reserved
