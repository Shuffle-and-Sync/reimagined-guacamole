# Administrator Account Setup Guide

This document provides comprehensive instructions for setting up and managing the master administrator account in Shuffle & Sync.

## Table of Contents

- [Overview](#overview)
- [Initial Setup](#initial-setup)
- [Configuration](#configuration)
- [Creating Admin Account](#creating-admin-account)
- [Verification](#verification)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Admin Permissions](#admin-permissions)

## Overview

The Shuffle & Sync platform uses a role-based access control (RBAC) system with multiple admin roles. The **super_admin** role is the highest privilege level with full system access.

### Admin Role Hierarchy

1. **Super Admin** (`super_admin`) - Full system access, all permissions
2. **Admin** (`admin`) - Most administrative functions, user management, content moderation
3. **Trust & Safety** (`trust_safety`) - User safety, ban management, evasion tracking
4. **Moderator** (`moderator`) - Content moderation, queue management, user reports
5. **Community Manager** (`community_manager`) - CMS, analytics, community content

## Initial Setup

### Prerequisites

- SQLite Cloud database or local SQLite file configured and accessible
- Application environment variables configured
- Admin email address (preferably a dedicated admin email)

### Quick Start

1. **Set environment variables** in `.env.local` or `.env.production`:

```bash
# Required: Admin email address
MASTER_ADMIN_EMAIL=admin@yourdomain.com

# Optional: Admin password for credentials authentication
# If not set, admin must use OAuth (Google) authentication
MASTER_ADMIN_PASSWORD=your-secure-password-min-12-chars
```

2. **Initialize admin account**:

```bash
npm run admin:init
```

3. **Verify admin account**:

```bash
npm run admin:verify
```

## Configuration

### Environment Variables

#### MASTER_ADMIN_EMAIL (Required)

- **Description**: Email address of the primary system administrator
- **Format**: Valid email address
- **Example**: `admin@shuffleandsync.com`
- **Security**: Use a dedicated admin email, not a personal account
- **When to Set**: Before first deployment and production startup

#### MASTER_ADMIN_PASSWORD (Optional)

- **Description**: Password for credentials-based authentication
- **Format**: Minimum 12 characters, mixed case, numbers, special characters
- **Example**: Generate with `openssl rand -base64 16`
- **Security**: 
  - Use a strong, unique password
  - Store securely in a password manager
  - Rotate regularly (every 90 days)
  - Never commit to version control
- **When to Set**: 
  - If you need credentials authentication in addition to OAuth
  - Required if Google OAuth is not configured
  - Optional if OAuth-only access is acceptable

#### MASTER_ADMIN_FIRST_NAME / MASTER_ADMIN_LAST_NAME (Optional)

- **Description**: Display name for the admin user
- **Default**: "System Administrator" if not provided
- **Example**: 
  ```bash
  MASTER_ADMIN_FIRST_NAME=Admin
  MASTER_ADMIN_LAST_NAME=Team
  ```

### Configuration Examples

#### Development Environment

```bash
# .env.local
DATABASE_URL=./dev.db
AUTH_SECRET=dev-secret-minimum-32-characters-long
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Admin Configuration
MASTER_ADMIN_EMAIL=admin@localhost
MASTER_ADMIN_PASSWORD=DevAdminPassword123!
```

#### Production Environment

```bash
# .env.production (via Secret Manager)
DATABASE_URL=sqlitecloud://prod-host.sqlite.cloud:8860/db?apikey=prod_key
AUTH_SECRET=production-secret-min-32-chars-generated-securely
AUTH_URL=https://shuffleandsync.com
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret

# Admin Configuration
MASTER_ADMIN_EMAIL=admin@shuffleandsync.com
MASTER_ADMIN_PASSWORD=<stored-in-secret-manager>
```

## Creating Admin Account

### Automatic Initialization

The admin account is automatically created when you run:

```bash
npm run admin:init
```

This script will:
1. ✅ Check if `MASTER_ADMIN_EMAIL` is configured
2. ✅ Validate email format
3. ✅ Check if user already exists
4. ✅ Create new user if needed
5. ✅ Hash password if provided
6. ✅ Mark email as verified
7. ✅ Assign `super_admin` role
8. ✅ Create audit log entry

### Manual Database Setup (Alternative)

If you need to manually create an admin user via database:

```sql
-- 1. Create user
INSERT INTO users (id, email, first_name, last_name, is_email_verified, email_verified_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'System',
  'Administrator',
  true,
  NOW(),
  NOW(),
  NOW()
);

-- 2. Assign super_admin role
INSERT INTO user_roles (id, user_id, role, permissions, assigned_by, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'super_admin',
  '["super_admin:all"]'::jsonb,
  u.id,
  true,
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'admin@yourdomain.com';
```

⚠️ **Note**: Manually created accounts cannot use password authentication unless `password_hash` is set using Argon2id.

## Verification

### Verify Admin Account Status

```bash
npm run admin:verify
```

This will check:
- ✓ `MASTER_ADMIN_EMAIL` is configured
- ✓ User account exists in database
- ✓ Email is verified
- ✓ `super_admin` role is assigned and active
- ✓ Authentication method (OAuth, Credentials, or both)

### Expected Output

```
═══════════════════════════════════════════════════════════
  Shuffle & Sync - Admin Account Management
═══════════════════════════════════════════════════════════

Mode: Verification

✅ Admin account verified successfully
   Email: admin@shuffleandsync.com
   User ID: 550e8400-e29b-41d4-a716-446655440000
   Role: super_admin
   Auth: Credentials + OAuth

═══════════════════════════════════════════════════════════
```

### Manual Verification via Database

```sql
-- Check if admin user exists and has super_admin role
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_email_verified,
  u.password_hash IS NOT NULL as has_password,
  ur.role,
  ur.is_active as role_active,
  ur.permissions
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@yourdomain.com'
  AND ur.role = 'super_admin';
```

## Security Best Practices

### 1. Environment Variable Security

- ✅ **DO**: Use Secret Manager (Google Cloud, AWS Secrets Manager, Azure Key Vault)
- ✅ **DO**: Rotate credentials every 90 days
- ✅ **DO**: Use different admin emails for dev/staging/production
- ❌ **DON'T**: Commit `.env.local` or `.env.production` to version control
- ❌ **DON'T**: Share admin credentials via email or chat
- ❌ **DON'T**: Use the same password across environments

### 2. Password Requirements

If using `MASTER_ADMIN_PASSWORD`:
- **Minimum length**: 12 characters
- **Complexity**: Mixed case, numbers, special characters
- **Uniqueness**: Not used elsewhere
- **Generation**: Use secure random generation:
  ```bash
  openssl rand -base64 16
  # or
  node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
  ```

### 3. Multi-Factor Authentication

For admin accounts, enable MFA:
1. Sign in with admin credentials
2. Navigate to Account Settings
3. Enable MFA (TOTP authenticator app)
4. Save backup codes securely

### 4. Access Logging and Monitoring

All admin actions are automatically logged:
- Login attempts (successful and failed)
- Permission checks
- Administrative actions
- API access

View audit logs:
```sql
-- Recent admin actions
SELECT * FROM admin_audit_log
WHERE admin_user_id = (SELECT id FROM users WHERE email = 'admin@yourdomain.com')
ORDER BY created_at DESC
LIMIT 50;
```

### 5. OAuth-Only Deployment (Recommended)

For maximum security, use OAuth-only authentication:

```bash
# .env.production
MASTER_ADMIN_EMAIL=admin@yourdomain.com
# Do NOT set MASTER_ADMIN_PASSWORD
```

Benefits:
- ✅ No password to leak or crack
- ✅ Leverage Google's security infrastructure
- ✅ Automatic MFA via Google Account
- ✅ Easy account recovery
- ✅ Audit trail via Google

### 6. Network Access Controls

In production:
- Restrict admin panel access by IP whitelist
- Use VPN for remote admin access
- Enable Cloud Armor or WAF rules
- Monitor for unusual access patterns

## Troubleshooting

### "MASTER_ADMIN_EMAIL not set"

**Cause**: Environment variable not configured

**Solution**:
```bash
# Add to .env.local or .env.production
echo "MASTER_ADMIN_EMAIL=admin@yourdomain.com" >> .env.local

# Verify
npm run env:validate
```

### "Invalid MASTER_ADMIN_EMAIL format"

**Cause**: Email address format is invalid

**Solution**:
- Check for typos
- Ensure valid domain
- No spaces or special characters
- Format: `user@domain.com`

### "Admin password must be at least 12 characters long"

**Cause**: `MASTER_ADMIN_PASSWORD` is too short

**Solution**:
```bash
# Generate secure password
MASTER_ADMIN_PASSWORD=$(openssl rand -base64 16)
echo "MASTER_ADMIN_PASSWORD=$MASTER_ADMIN_PASSWORD"
```

### "Admin account exists but does not have super_admin role"

**Cause**: User exists but role assignment failed

**Solution**:
```bash
# Re-run initialization to assign role
npm run admin:init
```

### "Cannot authenticate - OAuth not configured"

**Cause**: No password set and Google OAuth not configured

**Solution** (choose one):
1. Configure Google OAuth:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```
2. Set admin password:
   ```bash
   MASTER_ADMIN_PASSWORD=secure-password-min-12-chars
   npm run admin:init
   ```

### "Account exists with different authentication method"

**Cause**: Trying to use credentials when account uses OAuth (or vice versa)

**Solution**:
- Check account creation method
- Use the correct sign-in button ("Continue with Google" vs "Email/Password")
- If needed, add password to OAuth account via admin:init

## Admin Permissions

### Super Admin Permissions

The `super_admin` role grants all permissions:

```typescript
ADMIN_PERMISSIONS.SUPER_ADMIN: 'super_admin:all'
```

This includes:

#### User Management
- `user:view` - View user profiles and data
- `user:edit` - Edit user information
- `user:delete` - Delete user accounts
- `user:ban` - Ban users
- `user:unban` - Unban users

#### Role Management
- `role:view` - View role assignments
- `role:assign` - Assign roles to users
- `role:revoke` - Revoke user roles
- `role:create` - Create new custom roles

#### Content Moderation
- `content:view_reports` - View content reports
- `content:moderate` - Moderate content
- `content:delete` - Delete content
- `content:restore` - Restore deleted content

#### System Administration
- `system:settings` - Modify system settings
- `system:maintenance` - Perform maintenance operations
- `audit:view` - View audit logs
- `analytics:view` - View analytics
- `analytics:export` - Export analytics data

### Checking Admin Permissions

Via API:
```bash
curl -X GET https://your-domain.com/api/admin/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Via Database:
```sql
SELECT 
  u.email,
  ur.role,
  ur.permissions
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@yourdomain.com'
  AND ur.is_active = true;
```

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `MASTER_ADMIN_EMAIL` in Secret Manager
- [ ] Generate and set strong `MASTER_ADMIN_PASSWORD` (or use OAuth-only)
- [ ] Run `npm run admin:init` in production environment
- [ ] Run `npm run admin:verify` to confirm setup
- [ ] Test admin login (both OAuth and credentials if applicable)
- [ ] Enable MFA on admin account
- [ ] Document admin credentials in secure password manager
- [ ] Set up monitoring for admin login attempts
- [ ] Configure IP whitelist for admin access (optional)
- [ ] Review audit log configuration
- [ ] Test admin panel functionality
- [ ] Create backup admin account (optional)

## Integration with Deployment

### Startup Script Integration

Add to your deployment startup script:

```bash
#!/bin/bash
# deploy-production.sh

# ... other deployment steps ...

# Initialize admin account
echo "Initializing admin account..."
npm run admin:init

if [ $? -eq 0 ]; then
  echo "✓ Admin account initialized"
else
  echo "✗ Admin account initialization failed"
  exit 1
fi
```

### Automated Verification

Add to CI/CD pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Verify Admin Account
  run: npm run admin:verify
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    MASTER_ADMIN_EMAIL: ${{ secrets.MASTER_ADMIN_EMAIL }}
```

## Support

For issues with admin account setup:

1. Check this documentation thoroughly
2. Review logs: `tail -f /var/log/shufflesync.log`
3. Verify database connectivity: `npm run db:health`
4. Check environment variables: `npm run env:validate`
5. Contact DevOps team with error messages

---

**Document Version**: 1.0  
**Last Updated**: 2024-10-02  
**Maintained By**: DevOps Team
