# Yotion database isolation and launch migration

Status: planning / current-state inventory (13 November 2026). This is **not** a replayable schema migration or a data export.

## Current development environment

- Supabase project: Keroo (`ppmavvhxrwpjbrzbmzlb`), connected through the **Primary** Supabase account.
- PostgreSQL schema: `yotion`.
- Application database access: server-side `YOTION_SUPABASE_URL` and `YOTION_SUPABASE_SECRET_KEY`.
- Current tables: `yotion.demo_requests`, `yotion.access_tokens`, `yotion.status_events`.
- All three tables have RLS enabled; no table-level policies were found in the inspected schema.
- Five server-side RPC functions are currently in `public`: `yotion_create_demo_request`, `yotion_lookup_demo_request`, `yotion_admin_list_demo_requests`, `yotion_admin_get_demo_request`, `yotion_admin_update_demo_request`. Preserve signatures, implementations, grants, and search paths.
- Request status constraint now permits `received`, `reviewing`, `preparing`, `ready`, `sent`, `converted`, `declined`, plus legacy `approved` and `activated`.

## Data relationships

- `demo_requests.id` is the UUID primary key.
- `access_tokens.request_id` references `demo_requests.id` with ON DELETE CASCADE; `token_hash` is unique.
- `status_events.request_id` references `demo_requests.id` with ON DELETE CASCADE.
- Preserve all primary keys, foreign keys, timestamps, and the `status_events.id` identity/default behaviour.
- Preserve token hashes and their expiry/revocation timestamps; do not regenerate tokens during migration.
- Admin email-login tokens and cookies use application signing secrets and are separate from customer access-token rows.

## Work to complete before the first paid customer

1. Establish a complete version-controlled **baseline migration** from the actual live schema, including exact column definitions, defaults, identity sequences, constraints, indexes, RLS, permissions, and all five RPC function bodies. Use the Supabase CLI schema-diff/pull workflow against a controlled local environment; do not guess definitions.
2. Audit function privileges: privileged RPCs must not be executable by `anon`, `authenticated`, or `PUBLIC`. Review all SECURITY DEFINER functions and their `search_path`.
3. Test schema recreation in a disposable Supabase project. Verify RPCs, RLS, and Next.js application routes.
4. At first customer commitment: upgrade the Yotion Vercel team to Pro, create a dedicated Supabase project for Yotion, and apply the reviewed migrations.
5. Put demo-request submissions and admin updates into a temporary maintenance window. Export/import only Yotion-owned data in dependency order: `demo_requests`, `access_tokens`, `status_events`. Preserve IDs and reset sequences as necessary.
6. Reconcile source/target row counts, key relationships, status history, token expiry, and the exact set of functions/privileges. Test a previously issued customer progress link, new request submission, admin sign-in, request updates and email flows.
7. Change **only Yotion's** Vercel production database environment variables, redeploy and smoke-test. Do not alter Keroo's own credentials or schema.
8. Retain a secured source backup and a documented rollback window; do not immediately delete the source schema. Prevent split-brain writes during cutover.

## Current known gaps

- No complete replayable baseline SQL has yet been committed.
- The current admin workflow has no automatic demonstration email-sending action.
- Admin authentication, rate limiting and single-use link handling still need a security review.
- The production deployment and customer-specific demo routing require end-to-end testing.

Do not treat this inventory as authorisation to move or delete production data.
