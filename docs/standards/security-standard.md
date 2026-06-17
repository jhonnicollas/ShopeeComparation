# Security Standard

## Auth

- Email/password authentication.
- Password hashing using WebCrypto PBKDF2-SHA-256.
- Password salt per user.
- Iteration count configurable.
- Session token generated using cryptographically secure random bytes.
- Session token stored as hash in D1.
- Session cookie name: `shSession`.
- Cookie flags: HttpOnly, Secure, SameSite=Lax.

## Authorization

- Every protected endpoint must check session.
- User can only access own research session, jobs, comparisons, and reports.
- Admin-only endpoints require role `admin`.

## Secrets

- No secret in frontend.
- 9router key only in Worker environment variables.
- Do not log raw secrets.

## Shopee Compliance

- No Shopee user login.
- No cart/checkout/order/user page access.
- No CAPTCHA bypass.
- No aggressive scraping.
