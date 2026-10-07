# Market Fusion — Frontend

Next.js 15 (App Router) storefront, vendor dashboard and admin panel for the
Market Fusion hybrid multi-vendor marketplace.

## Stack

- **Next.js 15** with the App Router and React 19
- **TypeScript** in strict mode
- **Tailwind CSS 3** for styling
- No component library and no state library — React Context covers auth and the
  cart, and every list page reads straight from the API

## Getting started

The backend must be running first (see `../server`).

```sh
npm install
cp .env.example .env.local   # already created for local dev
npm run dev
```

The app runs on <http://localhost:3000> and talks to the API at
`NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:5000/api/v2`).

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Routes

### Storefront (public)

| Route | Purpose |
| --- | --- |
| `/` | Landing page: shop by type, categories, latest products, featured stores |
| `/products` | Catalogue with search, type/category/price filters and sorting |
| `/products/[slug]` | Product detail with a type-aware add-to-cart form |
| `/stores` | All approved stores |
| `/stores/[slug]` | Storefront with that vendor's published products |

### Buyer (requires login)

| Route | Purpose |
| --- | --- |
| `/login`, `/register` | Authentication, plus read-only Buyer/Vendor/Admin demo logins |
| `/cart` | Cart, grouped by vendor the way the order will be split |
| `/checkout` | Address, coupon code, then place the order |
| `/orders` | Order history with status filter |
| `/orders/[id]` | Order detail, per-vendor breakdown, pay or cancel |
| `/reviews` | Items awaiting a review, and reviews already written |
| `/bookings` | Rentals and service appointments, with deposit status |
| `/messages` | Chat with any store, live over a socket |
| `/wallet` | Balance, ledger and refunds |
| `/notifications` | Order, review and payout activity |
| `/addresses` | Saved addresses |
| `/payment/success`, `/payment/cancel` | Stripe return pages |

### Vendor

| Route | Purpose |
| --- | --- |
| `/vendor/store/new` | Become a vendor by opening a store |
| `/vendor` | Store dashboard: stats, commission rate, editable details |
| `/vendor/products` | Own catalogue, submit for review, delete |
| `/vendor/products/new` | Create a product of any of the four types |
| `/vendor/inventory` | Stock levels, adjustments, low-stock alerts, movement history |
| `/vendor/orders` | Incoming orders, earnings after commission, status updates |
| `/vendor/coupons` | Create and manage store discount codes |
| `/vendor/reviews` | Reviews received, and replies |
| `/vendor/wallet` | Earnings, ledger and withdrawal requests |
| `/vendor/rentals` | Rental diary: collect, take back, settle the deposit |
| `/vendor/bookings` | Appointment diary, weekly opening hours, closures |
| `/vendor/messages` | The store inbox |
| `/vendor/analytics` | Sales, earnings, best sellers, revenue by type |
| `/vendor/team` | Invite staff and choose exactly what they can touch |

### Admin

| Route | Purpose |
| --- | --- |
| `/admin/stores` | Approve, reject, suspend stores and set commission rates |
| `/admin/products` | Review the publish queue |
| `/admin/categories` | Manage the category tree |
| `/admin/orders` | Every order plus platform commission |
| `/admin/coupons` | Every coupon; create platform-wide codes |
| `/admin/reviews` | Moderate reviews (removal recalculates ratings) |
| `/admin/withdrawals` | Approve, reject and settle payouts; adjust wallets |
| `/admin/inventory` | Low stock across the whole marketplace |
| `/admin/analytics` | GMV, commission, top stores, platform snapshot |

## How it is put together

```
src/
  app/                 App Router pages, grouped by audience
  components/
    ui/index.tsx       Button, Input, Field, Card, Badge, Alert, EmptyState…
    layout/            Navbar, Footer, Pagination, DashboardNav, RequireAuth
    product/           ProductCard, ProductFilters, ProductGallery, AddToCartForm
  lib/
    api.ts             fetch wrapper, ApiError, multipart upload helper
    types.ts           API response types
    format.ts          money, dates, status colours
  providers/
    AuthProvider.tsx   JWT in localStorage, role helpers
    CartProvider.tsx   Cart state and the navbar badge count
```

A few decisions worth knowing:

- **Public pages are server components.** The catalogue, product detail and
  storefronts render on the server, so they are fast and indexable. Anything
  behind a login is a client component, because the JWT lives in `localStorage`.
- **Filters live in the URL.** Every filter and page on `/products` is a real
  query string, so results are shareable and the back button behaves.
- **Prices always go through `toNumber`.** Postgres returns `NUMERIC` as a
  string, so raw values are never used in arithmetic.
- **`RequireAuth` is a convenience, not security.** The API enforces every rule;
  the guard only stops the UI showing pages the user cannot use.
- **The Test User buttons are a real login, not a mock.** `/login` offers
  Buyer / Vendor / Admin buttons that call `POST /demo/login` and get a normal JWT
  for a seeded account. Those accounts are flagged `is_demo`, and the API refuses
  every non-GET request from them, so the read-only promise is kept by the server
  rather than by hiding buttons. `DemoBanner` says so on every page. See
  `../server/DEMO.md`.
- **`Field` wraps its control in the `<label>`.** That associates the two without
  generating ids, so screen readers (and tests querying by label) resolve every
  input correctly.
- **The coupon field prices against the live cart** via `/coupon/preview` before
  checkout, so the discount shown is the discount charged.
- **The notification bell polls once a minute.** Cheap enough to leave running,
  frequent enough that a vendor sees a new order without reloading.
- **Chat is a socket, with HTTP as the floor.** `ChatProvider` holds one
  authenticated socket.io connection; if it cannot connect, messages still send
  over REST and the header simply says "Offline".
- **A buyer starts a chat from a store, product or order page.** One
  `StartConversationButton` serves all three: it creates-or-reuses the thread and
  lands on `/messages?c=<id>` with it open. Creation is idempotent server side, so
  clicking twice opens the same thread rather than piling up duplicates, and the
  product and store buttons share one thread per store. The order button passes
  `order_id`, which gives that order a thread of its own — labelled with the order
  number, because the thread header cannot show one. A vendor's own store hides
  the button. `/messages` reads `?c=` as a **server** component and passes it down,
  keeping `useSearchParams` (and its prerender bailout) out of `ChatView`.
- **A message that arrives in an open thread is marked read.** Opening a thread
  clears its counter, but a socket-delivered message would otherwise keep the
  badge climbing on a thread the reader is looking straight at, so `ChatView`
  posts to `/chat/conversations/:id/read` when one lands.
- **Services are booked by picking an offered slot**, never by typing a time —
  the server generates slots from the vendor's hours, buffer, closures and diary,
  and re-checks the choice at checkout.
- **Charts follow one method.** Form is chosen by the data's job (headline numbers
  are stat tiles, trends are lines, magnitude comparisons are one-hue bars), the
  two-series palette was run through a CVD validator against the real card surface
  (worst adjacent ΔE 24.7), every chart ships a hover tooltip and a data-table
  view, and identity is never carried by colour alone.
- **The add-to-cart form mirrors the server's rules** (rental minimums, service
  booking in the future, single-unit digital items) so buyers see errors before
  submitting. The server re-validates everything.

## Known gaps

- **Image upload needs S3 credentials** on the backend (`S3_*` in
  `server/.env`). Product and store forms work without images until then.
- **Payment needs Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
  Until they are set, the pay button surfaces the backend's 503 message.
- **Shipping and tax show as zero**, matching the backend.
- **Wallet balance cannot be spent at checkout** — it holds earnings, refunds and
  deposit returns, and can be withdrawn, but it is not a payment method.
- **Review image upload** needs S3, so the review form is text and rating only.
- **Wishlist has no UI.** It was never built in any phase.
- **Chat has no attachments.** The API and schema accept `attachments`, but the
  composer cannot pick a file until S3 credentials exist. Read receipts are
  tracked server-side and are not drawn in the transcript either.
- **Only buyers open threads.** The server refuses to let a store cold-message a
  customer, so a vendor can reply but never start a conversation.
- **A cart is not a reservation.** Rental dates and service slots are only held
  once an order exists, so two buyers can hold the same slot in their carts and
  the second is refused at checkout.
