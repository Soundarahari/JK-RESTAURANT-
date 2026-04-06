# 🔒 JK Restaurant — Security Audit Report

**Date**: April 6, 2026  
**Scope**: Full client-side codebase + Supabase integration

---

## 🚨 CRITICAL Issues

### 1. Hardcoded Supabase Credentials in Source Code
**File**: [supabase.ts](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/lib/supabase.ts#L11-L12)
**Severity**: 🔴 CRITICAL

```typescript
// EXPOSED: Supabase URL and anon key hardcoded as fallback
supabaseUrl || 'https://bhuyjcbsqatrruixpwao.supabase.co',
supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIs...'
```

> [!CAUTION]
> The anon key is hardcoded directly in the source code as a fallback. While Supabase anon keys are designed to be public, having them hardcoded means anyone who clones your repo or inspects the built JS bundle gets direct access to your Supabase API. **This is especially dangerous if RLS policies are misconfigured.**

**Fix**: Remove the hardcoded fallback. Only use env variables. If they're missing, show an error — don't silently connect.

---

### 2. Admin Authorization is Client-Side Only
**File**: [store/index.ts](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/store/index.ts#L34-L39)
**Severity**: 🔴 CRITICAL

```typescript
export const ADMIN_EMAILS = ['soundarahari050@gmail.com'];

export function isAdmin(user: UserProfile | null): boolean {
  if (!user) return false;
  return ADMIN_EMAILS.includes(user.email) || user.email.startsWith('admin@');
}
```

> [!CAUTION]
> Admin checks happen **only on the client**. There is NO server-side enforcement via Supabase RLS. This means:
> - Any logged-in user can call `updateProduct()`, `addProduct()`, `updateOrderStatus()` directly from the browser console
> - The admin email list is visible in the JS bundle
> - `user.email.startsWith('admin@')` allows **anyone** with an email like `admin@anything.com` to gain admin access

**Fix**:
1. Remove `admin@` prefix check entirely
2. Add a `role` column to your Supabase `auth.users` or a separate `user_roles` table
3. Enforce admin-only operations via RLS policies on the server

---

### 3. Hardcoded Admin Phone Number (PII Exposure)
**File**: [store/index.ts](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/store/index.ts#L336)
**Severity**: 🔴 CRITICAL

```typescript
phone: "+917603814898", // Admin number for notification
```

> [!WARNING]
> Your personal phone number is hardcoded in the client-side code. Anyone viewing the source/bundle can see it. This is a **privacy violation** and could be exploited for spam/social engineering.

**Fix**: Move notification logic to a Supabase Edge Function. The phone number should only exist server-side.

---

### 4. Hardcoded Edge Function URL (Wrong Project!)
**File**: [store/index.ts](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/store/index.ts#L332)
**Severity**: 🟡 HIGH

```typescript
await fetch("https://hquuimozjttqfyloskhf.supabase.co/functions/v1/send-otp", {
```

This references project `hquuimozjttqfyloskhf` but your app uses project `bhuyjcbsqatrruixpwao`. The notification is silently failing. Also, this endpoint has **no authentication header** — it's an unauthenticated POST request to a publicly accessible function.

**Fix**: Use the correct project URL from env vars and include the authorization header.

---

## 🟠 HIGH Issues

### 5. Hardcoded UPI Payment ID
**File**: [Checkout.tsx](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/pages/Checkout.tsx#L295-L305)
**Severity**: 🟠 HIGH

```typescript
href={`upi://pay?pa=soundarahari@fam&pn=JKRestaurant&am=${grandTotal}&cu=INR`}
// Also displayed and copyable:
<p>soundarahari@fam</p>
navigator.clipboard.writeText('soundarahari@fam');
```

Your personal UPI ID is hardcoded in the client. Should be configurable via environment variable or admin settings.

---

### 6. No Input Sanitization
**Severity**: 🟠 HIGH

| Field | File | Issue |
|-------|------|-------|
| Cooking instructions | Checkout.tsx:201 | No length limit, no sanitization |
| Promo code | Checkout.tsx:238 | No length limit |
| Dish name/description | Admin.tsx:926-930 | No sanitization, potential XSS via product names |
| Category name | Admin.tsx:830 | No validation |
| UTR number | Checkout.tsx:321 | Only strips non-digits — no length enforcement beyond `>= 6` |

> [!WARNING]
> User inputs are rendered directly in the DOM without sanitization. If a malicious product name like `<img src=x onerror=alert(1)>` is stored in Supabase, it could trigger XSS for all users including admin.

**Fix**: Add `maxLength` attributes, sanitize inputs before database writes, and use text content rendering instead of `innerHTML` (React does this by default, but be careful with `dangerouslySetInnerHTML`).

---

### 7. Payment Screenshot is Fake
**File**: [Checkout.tsx](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/pages/Checkout.tsx#L330)
**Severity**: 🟠 HIGH

```typescript
onClick={() => setPaymentScreenshot('https://images.pexels.com/photos/...')}
```

The "Upload Screenshot" button doesn't actually upload a file — it sets a **hardcoded stock photo URL** as the screenshot. Orders are placed with fake payment proof.

**Fix**: Implement actual file upload to Supabase Storage.

---

## 🟡 MEDIUM Issues

### 8. No Rate Limiting
**Severity**: 🟡 MEDIUM

There is no throttling on:
- Order placement (`placeOrder`)
- Product updates (`updateProduct`)
- Category syncing (`syncDerivedCategories`)
- Promo code attempts

A user could spam thousands of orders or brute-force promo codes.

**Fix**: Add client-side debouncing and implement rate limiting via Supabase Edge Functions or RLS.

---

### 9. Missing Supabase RLS Policies
**Severity**: 🟡 MEDIUM

Based on the code, ALL database operations use the **anon key** with no user-specific JWT claims:
- `products` — Anyone can read, and if no RLS, anyone can write
- `orders` — Anyone can read all orders (admin endpoint has no server-side auth)
- `customers` — All customer data (emails, phones, student status) is fetchable by any user
- `categories` — Sync is failing, likely because RLS exists but policies are misconfigured

> [!IMPORTANT]
> **Required RLS policies:**
> - `products`: Public READ, Admin-only WRITE
> - `orders`: Users can only READ their own orders, Admin can READ all
> - `customers`: Admin-only READ
> - `categories`: Public READ, Admin-only WRITE

---

### 10. Sensitive Data in localStorage
**File**: [store/index.ts](file:///c:/Users/DELL/OneDrive/Documents/GitHub/JK-RESTAURANT-/src/store/index.ts#L382-L388)
**Severity**: 🟡 MEDIUM

```typescript
partialize: (state) => ({
  user: state.user,      // Contains email, phone, name, student status
  cart: state.cart,
  promos: state.promos,   // All promo codes with discount values
  orderMode: state.orderMode,
  userPhones: state.userPhones,  // ALL user phone numbers ever logged in
})
```

All promo codes (including inactive ones) and a history of ALL phone numbers from ANY user who logged in on this device are stored in plain text in `localStorage`.

---

## 🟢 GOOD Practices Already in Place

| Practice | Status |
|----------|--------|
| `.env` in `.gitignore` | ✅ Properly excluded |
| Google OAuth (not custom passwords) | ✅ Delegated to Supabase Auth |
| Phone input sanitization | ✅ `replace(/\D/g, '')` strips non-digits |
| UTR input sanitization | ✅ `replace(/[^0-9]/g, '')` |
| Student detection by email domain | ✅ Server-side verifiable pattern |
| HTTPS for all Supabase calls | ✅ Default |

---

## 📋 Priority Fix Order

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Remove `admin@` prefix check | 🔴 Critical | 5 min |
| 2 | Remove hardcoded phone number | 🔴 Critical | 10 min |
| 3 | Remove hardcoded Supabase fallback | 🔴 Critical | 5 min |
| 4 | Fix fake payment screenshot upload | 🟠 High | 30 min |
| 5 | Add input length limits & sanitization | 🟠 High | 20 min |
| 6 | Move UPI ID to env variable | 🟠 High | 5 min |
| 7 | Set up proper Supabase RLS policies | 🟡 Medium | 45 min |
| 8 | Add client-side rate limiting | 🟡 Medium | 20 min |
| 9 | Clean up localStorage persistence | 🟡 Medium | 10 min |
| 10 | Fix notification edge function URL | 🟡 Medium | 10 min |

---

> [!IMPORTANT]
> **Would you like me to start fixing these issues?** I recommend tackling the 🔴 Critical items first (#1, #2, #3), which can be done in under 20 minutes total.
