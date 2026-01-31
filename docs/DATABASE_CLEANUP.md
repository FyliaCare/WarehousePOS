# Database Schema Cleanup Guide

## Purpose
This document identifies deprecated SQL files that have been deleted and provides the migration order for proper database setup.

## ✅ Files DELETED (Deprecated)
These files have been removed as they were superseded by comprehensive migrations:

### From `database/` folder:
- `fix-rls.sql` - Superseded by `security-audit-fix.sql`
- `fix-products-rls.sql` - Superseded by `security-audit-fix.sql`
- `quick-fix-rls.sql` - Superseded by `security-audit-fix.sql`
- `fix-rls-signup.sql` - Superseded by `security-audit-fix.sql`
- `fix-rls-registration.sql` - Superseded by `security-audit-fix.sql`
- `fix-auth-complete.sql` - Old auth system - superseded
- `fix-phone-auth-trigger.sql` - Superseded by `phone-auth.sql`
- `fix-phone-auth-users.sql` - Superseded by `phone-auth.sql`
- `fix-trigger-simple.sql` - Old trigger fixes - superseded
- `complete-registration-fix.sql` - Old registration fix - superseded
- `setup-phone-auth-hook.sql` - Superseded by `phone-auth.sql`
- `add-missing-columns.sql` - Superseded by column migration
- `schema.sql` - Old schema - use `schema-complete.sql` instead
- `schema-column-fix.sql` - Superseded by comprehensive migration

### From `scripts/` folder:
- `fix-delivery-zones-rls.sql` - Superseded by security-audit-fix
- `fix-rls.mjs` - Old RLS fix script
- `schema.sql` - Duplicate schema file

## ✅ Files KEPT in `database/`

| File | Purpose |
|------|---------|
| `schema-complete.sql` | **PRODUCTION SCHEMA** - The single source of truth |
| `security-audit-fix.sql` | Security fixes and RLS policies |
| `phone-auth.sql` | Phone authentication setup |
| `add-category-business-type.sql` | Business category types feature |
| `phone-users-optimization.sql` | Phone user lookup optimization |
| `production-setup.sql` | Production deployment setup |
| `migrate-to-supabase-auth.sql` | Migration from old auth to Supabase |
| `phase2-migration.sql` | Phase 2 data migration |
| `phase3-migration.sql` | Phase 3 data migration |
| `cleanup-and-setup.sql` | Manual cleanup utilities |

## Files in `supabase/migrations/` (Keep All)

| File | Status |
|------|--------|
| `001_initial_schema.sql` | ✅ Keep - Initial comprehensive schema |
| `20250128170000_add_zone_mapping.sql` | ✅ Keep - Zone mapping feature |
| `20260128161320_cleanup_tables.sql` | ✅ Keep - Cleanup migration |
| `20260131000000_security_audit_fix.sql` | ✅ Keep - Security fixes |
| `20260131100000_comprehensive_column_fix.sql` | ✅ Keep - Column fixes |

## Order of Running Migrations

If setting up a fresh database:
1. `001_initial_schema.sql` (creates all tables)
2. `20250128170000_add_zone_mapping.sql`
3. `20260128161320_cleanup_tables.sql`
4. `20260131000000_security_audit_fix.sql`
5. `20260131100000_comprehensive_column_fix.sql`

Or use `supabase db push` which runs them automatically.

## Scripts Folder Cleanup

Files to DELETE from `scripts/`:
- `fix-delivery-zones-rls.sql` - Superseded by security-audit-fix
- `fix-rls.mjs` - Old RLS fix script
- `schema.sql` - Duplicate schema file

Files to KEEP in `scripts/`:
- `add-demo-products.mjs` - Demo data setup
- `demo-products.json` - Demo data
- `disable-rls.mjs` - Development utility
- `execute-schema.js` - Schema execution script
- `setup-database.js` - Database setup
- `setup-database.mjs` - Database setup
- `setup-demo.mjs` - Demo setup
- `setup-dev-data.mjs` - Development data
- `setup-via-rest.mjs` - REST API setup

## Commands to Delete Deprecated Files

### Windows PowerShell:
```powershell
# Database folder cleanup
Remove-Item "database/fix-rls.sql"
Remove-Item "database/fix-products-rls.sql"
Remove-Item "database/quick-fix-rls.sql"
Remove-Item "database/fix-rls-signup.sql"
Remove-Item "database/fix-rls-registration.sql"
Remove-Item "database/fix-auth-complete.sql"
Remove-Item "database/fix-phone-auth-trigger.sql"
Remove-Item "database/fix-phone-auth-users.sql"
Remove-Item "database/fix-trigger-simple.sql"
Remove-Item "database/complete-registration-fix.sql"
Remove-Item "database/setup-phone-auth-hook.sql"
Remove-Item "database/add-missing-columns.sql"
Remove-Item "database/schema.sql"
Remove-Item "database/schema-column-fix.sql"

# Scripts folder cleanup
Remove-Item "scripts/fix-delivery-zones-rls.sql"
Remove-Item "scripts/fix-rls.mjs"
Remove-Item "scripts/schema.sql"
```

### Unix/Mac Bash:
```bash
# Database folder cleanup
rm database/fix-rls.sql
rm database/fix-products-rls.sql
rm database/quick-fix-rls.sql
rm database/fix-rls-signup.sql
rm database/fix-rls-registration.sql
rm database/fix-auth-complete.sql
rm database/fix-phone-auth-trigger.sql
rm database/fix-phone-auth-users.sql
rm database/fix-trigger-simple.sql
rm database/complete-registration-fix.sql
rm database/setup-phone-auth-hook.sql
rm database/add-missing-columns.sql
rm database/schema.sql
rm database/schema-column-fix.sql

# Scripts folder cleanup
rm scripts/fix-delivery-zones-rls.sql
rm scripts/fix-rls.mjs
rm scripts/schema.sql
```

## Post-Cleanup Verification

After running migrations and deleting deprecated files, verify:

1. **Tables exist and have correct columns**:
   ```sql
   -- Check customers has all columns
   SELECT column_name FROM information_schema.columns WHERE table_name = 'customers';
   
   -- Check riders has all columns
   SELECT column_name FROM information_schema.columns WHERE table_name = 'riders';
   
   -- Check delivery_zones exists
   SELECT column_name FROM information_schema.columns WHERE table_name = 'delivery_zones';
   ```

2. **RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

3. **Policies exist**:
   ```sql
   SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
   ```
