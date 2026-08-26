# Retro Drip — Vintage & Streetwear

This is a responsive storefront for Retro Drip, aligned to the supplied logo and the dark archival streetwear brief. It includes a public landing experience, browsable catalog, product detail views, a persistent local bag, and a **no-payment order request** flow. The checkout collects delivery details and submits an order request for follow-up; it does not charge the customer and does not claim payment success.

## Run locally

The managed project uses the included React, TypeScript, Vite, Express, tRPC, and Drizzle setup. Install dependencies with `pnpm install`, then start development with `pnpm dev`. Use `pnpm check` for TypeScript validation, `pnpm test` for Vitest, and `pnpm build` for a production build.

The production storefront reads active catalog records through the `catalog.list` procedure. If the database has no active products, the public pages show a deliberate empty state rather than masking the missing catalog with hardcoded products. For local visual review only, append `?demo=1` to a storefront URL to opt into the isolated reference catalog; this switch is explicit and is not enabled by default. `client/src/data/products.ts` remains an isolated visual reference only.

## Data and order requests

The project schema includes categories, products, product images, orders, order items, and order status history. The validated server mutation is `orders.request`. It stores the customer details, item snapshot, subtotal, `paymentStatus = not_applicable`, and `status = pending`. The client never accepts or displays a fake payment result.

A portable PostgreSQL reference schema is provided at `supabase/schema.sql`. The managed preview database uses the scaffold’s Drizzle dialect and generated migration under `drizzle/`.

## Asset and brand setup

The supplied Retro Drip logo is referenced by the storefront header, footer, and accessibility labels. Replace `LOGO` in `client/src/App.tsx` with your deployment asset URL if you move the project outside the managed asset store. Product imagery is currently visual preview content; production imagery should be uploaded through the planned product image workflow and stored by URL in the database.

## Business policy

The storefront displays only the policy information supplied in the brief: **No COD · No Return · No Refund**. No additional business claims, history, contact details, reviews, or testimonials have been invented.

## Production hardening checklist

Before public launch, connect the product editor to the database, add server-side stock checks inside `orders.request`, add admin authorization for product and order management, configure rate limiting and secure upload validation, and set the real brand contact/social settings. Payment integration is intentionally not enabled.
