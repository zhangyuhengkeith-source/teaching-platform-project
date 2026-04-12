# Teaching Platform MVP Foundation

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional local-only environment variable:

- `NEXT_PUBLIC_TP_ENABLE_DEMO_MODE=true`

The application now fails closed by default when Supabase credentials are missing. Protected routes redirect back to `/login`, authenticated forms show a configuration error, and seed-backed demo behavior is only available when `NEXT_PUBLIC_TP_ENABLE_DEMO_MODE=true` is explicitly set for local development. Do not enable demo mode in production.
