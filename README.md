# Madras Sparkle Web Platform & Code-Free CMS

Showcase website, virtual try-on studio and admin CMS for **Madras Sparkle**, a bespoke jeweller of fine gold, natural diamonds and lab-grown diamonds serving South Chennai (Adyar, Besant Nagar, Mylapore, Mandaveli, Velachery, OMR, RA Puram). Built to BRD V0.2.

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router), TypeScript, Server Actions, Route Handlers |
| UI | Tailwind CSS, Lucide icons, Cinzel + Plus Jakarta Sans. Dark luxury theme (`#121212`, `#1a1a1a`, `#D4AF37`) |
| Data & auth | Supabase Postgres with RLS, Supabase Auth, Supabase Storage |
| Try-on | HTML5 Canvas 2D + Gemini image model (`gemini-3.1-flash-image`) |
| Deploy | Vercel (CI/CD from `main`) |

## Features

- **Public showcase** (`/`, `/collections`, `/collections/[category]`, `/products/[sku]`): hero banners managed in the CMS, navigation across 7 categories, featured designs, an image and video media gallery, and a WhatsApp appointment modal. The modal sends a pre-filled `wa.me` message with the product title, SKU, the customer's locality, and their preferred date and time slot.
- **Visitor registration** (`components/VisitorRegisterModal.tsx`): collects name, mobile number and area (dropdown), plus a mandatory photo-processing consent checkbox. It is backed by a Supabase anonymous session and the `register_visitor` RPC.
- **Dual Virtual Try-On Studio** (`/try-on`)
  - The visitor must be registered, and the per-phone quota (`system_settings.max_tryon_per_user`) is enforced server-side by the `consume_tryon` RPC. Trying the same SKU again within 2 hours is not counted again.
  - Manual 2D canvas: drag, pinch or scroll to scale, two-finger twist to rotate, and sliders for scale, rotation and vertical position.
  - "AI Photorealistic Blend": `POST /api/tryon/blend` sends the visitor's photo and the product's transparent PNG to Gemini.
  - Privacy: the photo lives only in React state and `sessionStorage`, and it is never uploaded to Storage. "Download Composite Photo" and "Delete My Uploaded Photo" take effect immediately.
- **Admin CMS** (`/admin`, login at `/admin/login`)
  - Role-based access: `SUPER_ADMINISTRATOR`, `ADMINISTRATOR`, `CONTENT_EDITOR`. `middleware.ts` protects `/admin/*`. Settings, Users and Audit are restricted to administrators.
  - Products & SKUs: create, edit and delete products, with validation of the mandatory alphanumeric SKU (e.g. `MS-NK-916-001`), drag-and-drop uploads (JPG, PNG, WEBP, MP4), and a toggle between "Show Indicative Price" and "Hide Price".
  - Banners, Media Library, Users & Roles (only a super administrator can change roles).
  - Quota & Settings: the maximum number of try-ons per phone number and the WhatsApp business number.
  - Audit & Backup: an automatic audit trail (database triggers on products, banners and settings, including a dedicated `UPDATE_PRICE` action). CSV exports cover the audit log, catalogue and try-on log. A full JSON backup is available, and a super administrator can restore from it.

## Environment variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | yes | Supabase anon (public) key. It is exposed to the browser as `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `next.config.mjs`, which is safe because RLS enforces all access |
| `GEMINI_API_KEY` | for AI blend | Google AI Studio API key. It is used only server-side in `app/api/tryon/blend` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | optional | Fallback WhatsApp number (digits only, e.g. `919876543210`). The CMS setting takes precedence |
| `GEMINI_IMAGE_MODEL` | optional | Override for the Gemini image model id (default `gemini-3.1-flash-image`) |

> **Demo mode:** without the Supabase variables, the site runs on built-in sample products (`lib/demo-data.ts`) with a browser-local quota. This lets you preview the showcase and try-on studio immediately. The admin CMS requires Supabase.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000
```

### Supabase

1. Create a project, then run the migrations in order in the SQL editor (or use `supabase db push`):
   - `supabase/migrations/01_init.sql`: schema, enums, base RLS (from the BRD)
   - `supabase/migrations/02_policies_functions.sql`: remaining RLS policies, `register_visitor` and `consume_tryon` RPCs, audit triggers, the public `media` storage bucket, and the default settings row
2. **Authentication → Providers**: enable **Email** for staff and **Anonymous sign-ins** for visitor registration.
3. Create the first super administrator. Add a user under Authentication → Users (email and password), then run:

   ```sql
   insert into profiles (id, full_name, phone_number, city_area, role, photo_authorization_consent)
   select id, 'Suresh', '919800000000', 'Adyar', 'SUPER_ADMINISTRATOR', true
   from auth.users where email = 'owner@madrassparkle.in';
   ```

   That super administrator can then promote other staff (who must already have a profile) from **Admin → Users & Roles**. To add new staff, create the auth user first and insert a profile the same way, using `ADMINISTRATOR` or `CONTENT_EDITOR`.

### Vercel

1. Import the GitHub repo into Vercel (framework: Next.js) and set the environment variables above for Production and Preview.
2. Every push to `main` deploys automatically. `/api/tryon/blend` declares `maxDuration = 60`, so a plan that allows 60-second functions is recommended for AI blends.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (type-check + lint) |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

## Project structure

```
app/
  page.tsx, collections/, products/[sku]/   Public showcase
  try-on/                                    Virtual Try-On Studio
  admin/login/                               Staff login
  admin/(cms)/                               Dashboard, products, banners, media, settings, users, audit
  api/admin/export/                          CSV / JSON backup exports
  api/tryon/blend/                           Gemini AI blend
components/                                  UI (VisitorRegisterModal, TryOnStudio, WhatsAppModal, admin/*)
lib/                                         Supabase clients, data access, types, constants
middleware.ts                                Session refresh + RBAC for /admin
supabase/migrations/                         Database schema, RLS, RPCs, triggers
```

## Notes

- Mobile numbers are not OTP-verified, as the BRD does not require it. Because quota is counted per phone number in `tryon_logs`, re-registering on another device does not reset the quota.
- Indicative prices are shown only when "Show Indicative Price" is enabled for a product.
