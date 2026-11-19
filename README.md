# Roofing Company Website Template: built on Whop

A production-ready website template for US roofing contractors, hosted on **Whop Websites** and using **Whop Payments** end to end:
deposit → job → final invoice.

**Live demo:** https://rooftpl-x7k2q.whop.site (Whop sandbox, so no real money moves)
Add `?debug=1` to any URL to open a live panel of the custom `whop.track` events.

## What's inside

| Requirement | Where |
|---|---|
| Services (repair, replacement, inspection, maintenance), service area, financing callout, reviews/trust, contact | `src/components/Sections.tsx`, `src/components/EstimateForm.tsx` |
| Real plans: $149 inspection, $500 project deposit, $349 flat-rate tune-up | `src/site.config.ts` → `npm run setup:plans` → `src/whop.plans.json` |
| Checkout with **CheckoutElement** + **ExpressCheckoutElement** (Apple Pay / Google Pay) | `src/components/WhopCheckout.tsx` → `PlanCheckout` |
| **PaymentElement + AddressElement + BrandingElement** in setup mode → **setup intent** (card on file) | `WhopCheckout.tsx` → `CardOnFile`; server `saveCardOnFile` |
| "Request an Estimate" → **lead on the Whop account** | `src/server/functions.ts` → `submitEstimate` |
| Final balance via the **Invoices API** (auto-charge stored card or email for manual payment) | `/admin` page → `adminCreateFinalInvoice` |
| Custom pixel events `estimate_requested`, `service_viewed`, `deposit_started` | `src/lib/track.ts` (+ call sites) |

No card data ever touches this app. Every payment surface is a Whop element, so financing options (Klarna, Afterpay, Splitit…)
appear automatically inside the CheckoutElement for approved merchants.

### The flows

1. **Estimate form.** It calls `POST /members` (Whop's Leads API was folded into Members: a person who joins without buying is a lead,
   `most_recent_action: "joined"`), then records a standard `lead` conversion with `POST /events`. The browser fires `whop.track("estimate_requested")`.
2. **Deposit.** On *Continue to secure checkout* the browser fires `whop.track("deposit_started")`. The buyer pays the $500 deposit plan in the
   CheckoutElement (or one tap with the ExpressCheckoutElement). The page then mounts `<Payments mode="setup">` with PaymentElement,
   AddressElement and BrandingElement. `createConfirmationToken()` → server `POST /setup_intents` → a saved `payt_` payment method, with the job reference in its metadata.
3. **Final balance.** `/admin` (PIN-protected) lists succeeded setup intents. Pick the customer, enter the balance, and choose:
   - **Auto-charge**: `POST /invoices` with `payment_method_id` → `POST /invoices/{id}/issue` (Whop charges the stored card off-session).
   - **Manual**: `POST /invoices` with `due_at` → `POST /invoices/{id}/send` (Whop emails the invoice with a hosted pay link).
4. **Pixel.** Page views and checkout events are automatic on `*.whop.site`. `service_viewed` fires when a service card scrolls into view
   (or its Book button is clicked), once per service per page load.

## Re-brand it for a new roofer (no structural changes)

1. Edit **`src/site.config.ts`**: company name, phone, colors, services, cities, reviews, financing copy, plan titles and prices.
2. `npm run setup:plans` creates the products and plans in that company's Whop account and rewrites `src/whop.plans.json`.
3. `whop apps deploy`

## Setup from scratch

```bash
npm install -g @whop/cli        # Node 22+
whop login                       # production account that hosts the site
npm install

# .env (this folder or its parent)
WHOP_SANDBOX_API_KEY=apik_...    # sandbox.whop.com → Developer → API keys
WHOP_SANDBOX_COMPANY_ID=biz_...

npm run setup:plans              # add -- --prod for production

whop apps secrets set --secret WHOP_ENV=sandbox --secret WHOP_SANDBOX_API_KEY=apik_... --secret ADMIN_PIN=123456
whop apps deploy
```

Going live with real payments: create production plans (`npm run setup:plans -- --prod`), then set
`WHOP_ENV=production` and `WHOP_PROD_API_KEY` as app secrets and redeploy. Elements switch environment automatically
from `src/whop.plans.json`.

**Sandbox test card:** `4242 4242 4242 4242`, any future expiry, any CVC (choose **United States** as the billing country).

## Stack

TanStack Start (React 19) on Whop Websites (Cloudflare Workers), Tailwind CSS v4, `@whop/elements` + `@whop/elements-react` 1.10,
Whop REST API v1 via server functions (the API key never reaches the browser).
