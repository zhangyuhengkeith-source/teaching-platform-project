# Teaching Platform MVP Foundation

## Environment setup

Copy `.env.example` to `.env.local` and fill in the values for your target environment.

### Current default setup

Required:

- `NEXT_PUBLIC_TP_AUTH_MODE=supabase`
- `NEXT_PUBLIC_TP_STORAGE_MODE=supabase`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY` for trusted server-side writes such as task submissions and attachment metadata updates
- `NEXT_PUBLIC_APP_BASE_URL`
- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS`
- `NEXT_PUBLIC_TP_ENABLE_DEMO_MODE=true` for local-only demo access

The application fails closed by default when Supabase credentials are missing. Protected routes redirect back to `/login`, authenticated forms show a configuration error, and seed-backed demo behavior is only available when `NEXT_PUBLIC_TP_ENABLE_DEMO_MODE=true` is explicitly set for local development. Do not enable demo mode in production.

## Migration-oriented config matrix

The runtime config center now supports these migration seams:

- `NEXT_PUBLIC_TP_DEPLOYMENT_FLAVOR`
  - `default`: current hosted path
  - `production-cn`: reserved for mainland China deployments
- `NEXT_PUBLIC_TP_AUTH_MODE`
  - `supabase`: current implementation
  - `custom-api`: future self-hosted or mainland auth service
- `NEXT_PUBLIC_TP_STORAGE_MODE`
  - `supabase`: current implementation
  - `object-storage`: future COS/OSS or self-hosted file service
- `NEXT_PUBLIC_API_BASE_URL`
  - reserved for future custom API gateways
- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS`
  - temporary compatibility path for bootstrap admin access
  - long-term target is `profiles.role = super_admin`

At the moment, only the `supabase` provider paths are implemented. If you switch `NEXT_PUBLIC_TP_AUTH_MODE` to `custom-api` or `NEXT_PUBLIC_TP_STORAGE_MODE` to `object-storage`, the app will now fail at explicit provider boundaries instead of silently continuing with Supabase-specific behavior.

## Suggested environment profiles

### Local development with Supabase

- `NEXT_PUBLIC_TP_DEPLOYMENT_FLAVOR=default`
- `NEXT_PUBLIC_TP_AUTH_MODE=supabase`
- `NEXT_PUBLIC_TP_STORAGE_MODE=supabase`
- `NEXT_PUBLIC_SUPABASE_URL=<your project url>`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<your service role key>`

### Local demo mode without Supabase

- leave `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty
- set `NEXT_PUBLIC_TP_ENABLE_DEMO_MODE=true`

### Future mainland deployment preparation

- `NEXT_PUBLIC_TP_DEPLOYMENT_FLAVOR=production-cn`
- `NEXT_PUBLIC_TP_AUTH_MODE=custom-api`
- `NEXT_PUBLIC_TP_STORAGE_MODE=object-storage`
- `NEXT_PUBLIC_API_BASE_URL=https://api.example.cn`
- `NEXT_PUBLIC_APP_BASE_URL=https://app.example.cn`

That mainland profile is a preparation target, not a fully implemented runtime today. The purpose of these variables is to keep migration entry points explicit and centralized before the real provider replacements are added.
