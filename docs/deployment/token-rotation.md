# Token Rotation Runbook

## Why

`CLOUDFLARE_API_TOKEN`, `NINEROUTER_API_KEY`, and `key.md` containing all secrets have appeared in plain text in:

- Conversation history (this assistant session)
- The `key.md` file in the working tree (gitignored but exists on disk)
- `git status` output in earlier commands

**Treat all secrets as exposed. Rotate immediately.**

## What to Rotate

| Secret | Where used | How to rotate |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `workers/queueConsumer` (Cloudflare Browser Rendering REST API) | Cloudflare dashboard → My Profile → API Tokens → Roll on existing token, or create new with `Browser Rendering - Edit` template |
| `NINEROUTER_API_KEY` | `workers/api`, `workers/queueConsumer` | 9router dashboard → Settings → API Keys → Revoke old, create new |
| `PASSWORD_PEPPER` | `workers/api` (password hashing) | Generate random 32+ char string. See "Coordinated Pepper Rotation" below — requires DB migration. |
| `SESSION_SECRET` | `workers/api` (if used in future JWT) | Same as PASSWORD_PEPPER — generate random 32+ char string |
| GitHub PAT | Repository access | GitHub → Settings → Developer settings → Personal access tokens → Revoke, regenerate |

## Cloudflare API Token Rotation

```bash
# 1. Open Cloudflare dashboard
#    https://dash.cloudflare.com/profile/api-tokens
# 2. Click "Create Token" → use "Edit Cloudflare Pages" template OR
#    "Custom token" with permissions:
#    - Account: Browser Rendering:Edit
#    - Account: Workers Scripts:Edit
#    - Account: Workers KV Storage:Edit (if used)
#    - Account: D1:Edit
#    - Account: R2:Edit
#    - Account: Queues:Edit
#    - Account: Account Settings:Read
# 3. Copy the new token to your password manager (it will only be shown once)
# 4. Update the secrets in each affected Worker
```

```bash
# Update queue consumer
echo "<NEW_TOKEN>" | wrangler secret put CLOUDFLARE_API_TOKEN --config workers/queueConsumer/wrangler.toml
# ^ Paste the new token. Never commit the actual value.
```

```bash
# Update queue consumer
echo "<NEW_TOKEN>" | wrangler secret put CLOUDFLARE_API_TOKEN --config workers/queueConsumer/wrangler.toml

# Verify
pnpm exec wrangler secret list --config workers/queueConsumer/wrangler.toml
```

The Cloudflare Pages Functions (`_worker.js`) does NOT use this token — it only proxies to the API Worker. The Pages deployment does not need to be redeployed when secrets change (Pages Function is stateless).

## 9router API Key Rotation

```bash
# 1. Open 9router dashboard
# 2. Revoke old key, create new key
# 3. Update secrets in BOTH workers that use it
echo "<NEW_KEY>" | wrangler secret put NINEROUTER_API_KEY --config workers/api/wrangler.toml
echo "<NEW_KEY>" | wrangler secret put NINEROUTER_API_KEY --config workers/queueConsumer/wrangler.toml
```

## Coordinated Pepper Rotation (Requires Downtime)

`PASSWORD_PEPPER` is used in PBKDF2-SHA-256 hashing. Rotating it invalidates all existing password hashes. Procedure:

```bash
# 1. Announce downtime (15 min)
# 2. Read current pepper (last 4 chars)
echo "current: shopee-research-pepper-v1-2026"
# 3. Choose new pepper (e.g. shopee-research-pepper-v2-2026-Q3)
NEW_PEPPER="shopee-research-pepper-v2-2026-Q3-7f3a"
# 4. Update secret
echo "$NEW_PEPPER" | wrangler secret put PASSWORD_PEPPER --config workers/api/wrangler.toml
# 5. Force re-login: every user must reset their password
#    OR: bulk rehash all users (one-time migration script — see below)
```

**Bulk rehash script** (run after step 4):

```javascript
// scripts/rotate-pepper.ts
import { hashPassword, verifyPassword } from "@shopee-research/auth";

const OLD_PEPPER = "shopee-research-pepper-v1-2026";
const NEW_PEPPER = process.env.NEW_PEPPER!;

for (const user of allUsers) {
  const isValid = verifyPassword(user.lastKnownPassword, user.passwordHash, user.passwordSalt, OLD_PEPPER);
  if (!isValid) {
    console.warn(`Cannot rehash user ${user.email} — old password unknown`);
    continue;
  }
  const { hash, salt } = await hashPassword(user.lastKnownPassword, NEW_PEPPER);
  await db.update(user.id, { passwordHash: hash, passwordSalt: salt });
}
```

This requires knowing every user's plaintext password, which is not realistic. **Practical alternative**: add a "reset password" admin action and force all users through it.

## Verification After Rotation

```bash
# Test login with new secret
curl -sS -X POST https://shopee-product-research-api.indiehomesungairaya.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shopee-research.local","password":"21kxsove7usbeeGo5ya9eG"}'
# Expected: 200 OK with user object
```

## Local Development `.env`

After rotation, update your local `key.md` (or your real env file, NOT this one) with the new values. The token is now only stored in:
- Cloudflare secret store (production)
- Your password manager (you)
- Local `.env` file (NOT committed)

## Old Token Audit

```bash
# Find references to the (now-revoked) old token pattern in the repo
rg "cfut_[A-Za-z0-9_-]{20,}" --type-not log
# Expected: 0 results (only old git history may have the rotated value)
```

## Rollback Plan

If the new token fails after rotation:
1. Roll back via Cloudflare dashboard (re-enable old token)
2. Repeat `wrangler secret put` with the old token
3. Test login again
4. Investigate why new token doesn't work (likely missing permission)
