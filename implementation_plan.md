# Goal Description
Build a Mobile-First PWA named "JK Restaurant" using React, Tailwind CSS, and Supabase. The goal is to deliver a robust food delivery application supporting a dual-pricing model (regular/student), geofencing within a 10km delivery radius, a manual student verification flow, dynamic UPI intent capabilities, and a dedicated admin dashboard with real-time order updates.

## User Review Required

> [!IMPORTANT]  
> The backend for this workflow heavily relies on Supabase. We must confirm the environment before provisioning database resources.

## Proposed Changes

### Frontend Infrastructure (Vite + React)
- **Scaffolding:** Create a Vite React Application directly in this directory natively tailored with `vite-plugin-pwa` for "Add to Home Screen" support.
- **Styling:** Configure Tailwind CSS with the main brand color (Green `#22c55e`) and a modern aesthetic.
- **Routing:** Use `react-router-dom` for easy navigation between main menu, cart, checkout, profile, and merchant dashboard.

### Supabase Backend Configuration (Database & Storage)
- **Setup Tables:** Execute DDL migrations to set up `profiles`, `products`, and `orders`. Verify RLS policies to make sure the data is secure. 
- **Setup Storage:** Provision `id-cards` and `payment-proofs` buckets.

### Frontend Features
- **Geofencing Engine:** Automatically map user location via `navigator.geolocation` and enforce a 10km maximum distance using Haversine formula against the restaurant coordinates.
- **Student Dual-Pricing Logic:** Provide conditional rendering UI to display `student_price` solely for verified users.
- **Payment & Checkout:** Generate dynamic UPI intent links (e.g. PhonePe/GPay), and create an interface to handle manual screenshot uploads.
- **Realtime Dashboard:** Set up a separate path (e.g. `/admin`) using `supabase.channel()` to intercept incoming orders on the fly, allowing admins to approve/reject.

## Open Questions

> [!WARNING]  
> Please answer the following before we begin execution:

1. **Supabase Environment:** Do you have an existing Supabase project with credentials (URL / Anon Key) or would you like me to create a new one using the Supabase MCP integration?
2. **Coordinates:** What are the exact GPS coordinates `[Latitude, Longitude]` and UPI ID (`VPA`) of the restaurant? Should I use mock coordinates/VPA for testing initially?
3. **Colleges Checklist:** Do you have the specific names of the 5 targeted colleges, or should I start with placeholders?

## Verification Plan
1. **Automated / Manual Build Check:** Verify Vite runs gracefully and components render without hydration/module errors.
2. **Simulated GPS:** Use browser spoofing to verify that orders exceeding 10km are cleanly rejected.
3. **Supabase Webhooks:** Test real-time connections by fulfilling an order as a mock customer and seeing it pop up instantly in the Merchant Dashboard.
