# MFA Audit Trail Documentation

## Overview

The MFA (Multi-Factor Authentication) system now includes comprehensive audit trail tracking to meet security compliance requirements and enable better debugging of MFA-related issues.

## Schema Changes

### `userMfaSettings` Table

Two new timestamp fields have been added to track MFA lifecycle events:

```typescript
interface UserMfaSettings {
  id: string;
  userId: string;
  secret: string;
  backupCodes: string; // JSON array
  enabled: boolean;

  // Audit trail fields (NEW)
  enabledAt: Date | null; // When MFA was enabled (or re-enabled)
  disabledAt: Date | null; // When MFA was disabled (null if currently enabled)

  createdAt: Date;
  updatedAt: Date; // Last update to any field
}
```

### Field Semantics

- **`enabledAt`**: Set when MFA transitions from disabled to enabled. Updated each time MFA is re-enabled after being disabled.
- **`disabledAt`**: Set when MFA transitions from enabled to disabled. Cleared (set to null) when MFA is re-enabled.
- **`updatedAt`**: Updated on any change to the record (enable, disable, or secret update).

## API Changes

### `SecurityRepository.enableUserMfa()`

**Behavior**: When enabling MFA, the method now:

1. Sets `enabled = true`
2. Sets `enabledAt = new Date()` (only if transitioning from disabled to enabled)
3. Sets `disabledAt = null` (clears previous disable timestamp)
4. Updates `updatedAt = new Date()`

```typescript
const result = await securityRepo.enableUserMfa(
  userId,
  totpSecret,
  hashedBackupCodes,
);

console.log(result.enabledAt); // Timestamp when MFA was enabled
console.log(result.disabledAt); // null (cleared on enable)
```

### `SecurityRepository.disableUserMfa()`

**Behavior**: When disabling MFA, the method now:

1. Sets `enabled = false`
2. Sets `disabledAt = new Date()` (only if transitioning from enabled to disabled)
3. Preserves `enabledAt` (keeps historical record)
4. Updates `updatedAt = new Date()`

```typescript
await securityRepo.disableUserMfa(userId);

const settings = await securityRepo.getUserMfaSettings(userId);
console.log(settings.disabledAt); // Timestamp when MFA was disabled
console.log(settings.enabledAt); // Still shows when it was last enabled
```

### `SecurityRepository.recordMfaFailure()`

**Signature Change** (backward compatible):

```typescript
// OLD signature (still works)
await securityRepo.recordMfaFailure(userId);

// NEW signature with optional parameters
await securityRepo.recordMfaFailure(userId, {
  attemptType?: 'totp' | 'backup_code' | 'sms' | 'email';  // default: 'totp'
  ipAddress?: string;                                       // default: 'unknown'
  userAgent?: string;                                       // default: undefined
});
```

**Examples**:

```typescript
// Basic usage (backward compatible)
await securityRepo.recordMfaFailure(userId);
// Records: { attemptType: 'totp', ipAddress: 'unknown', userAgent: null }

// Record backup code failure with context
await securityRepo.recordMfaFailure(userId, {
  attemptType: "backup_code",
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});

// Record SMS verification failure
await securityRepo.recordMfaFailure(userId, {
  attemptType: "sms",
  ipAddress: "203.0.113.42",
  userAgent: "Mobile App v1.2.3",
});
```

## Use Cases

### 1. Security Audit Trail

Track when users enable or disable MFA:

```typescript
const settings = await securityRepo.getUserMfaSettings(userId);

if (settings.enabled) {
  console.log(`MFA enabled on: ${settings.enabledAt}`);
} else {
  console.log(`MFA last enabled: ${settings.enabledAt}`);
  console.log(`MFA disabled on: ${settings.disabledAt}`);
}
```

### 2. Compliance Reporting

Generate reports of MFA state changes:

```typescript
const allUsers = await db.select().from(users);

for (const user of allUsers) {
  const mfa = await securityRepo.getUserMfaSettings(user.id);

  if (mfa?.enabled) {
    report.push({
      userId: user.id,
      email: user.email,
      mfaEnabled: true,
      enabledAt: mfa.enabledAt,
    });
  }
}
```

### 3. Security Event Analysis

Analyze MFA failures by attempt type:

```typescript
// Get all recent TOTP failures
const totpFailures = await db
  .select()
  .from(userMfaAttempts)
  .where(
    and(
      eq(userMfaAttempts.attemptType, "totp"),
      eq(userMfaAttempts.success, false),
      gte(userMfaAttempts.createdAt, lastHour)
    )
  );

// Get all failures from suspicious IP
const suspiciousFailures = await db
  .select()
  .from(userMfaAttempts)
  .where(
    and(
      eq(userMfaAttempts.ipAddress, suspiciousIp),
      eq(userMfaAttempts.success, false)
    )
  );
```

### 4. IP-Based Rate Limiting

Implement per-IP rate limiting:

```typescript
async function checkMfaRateLimit(userId: string, ipAddress: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const failures = await db
    .select({ count: count() })
    .from(userMfaAttempts)
    .where(
      and(
        eq(userMfaAttempts.userId, userId),
        eq(userMfaAttempts.ipAddress, ipAddress),
        eq(userMfaAttempts.success, false),
        gte(userMfaAttempts.createdAt, fiveMinutesAgo),
      ),
    );

  const failureCount = failures[0]?.count || 0;

  if (failureCount >= 5) {
    throw new Error("Too many failed attempts from this IP");
  }
}
```

## Migration

### Database Migration

The schema changes are applied automatically via `database-unified.ts`:

```sql
-- Add new columns
ALTER TABLE user_mfa_settings ADD COLUMN enabled_at integer;
ALTER TABLE user_mfa_settings ADD COLUMN disabled_at integer;

-- Backfill existing enabled records
UPDATE user_mfa_settings
SET enabled_at = updated_at
WHERE enabled = 1 AND enabled_at IS NULL;
```

### Code Migration

**No code changes required** for existing functionality. The changes are fully backward compatible:

- Old code: `recordMfaFailure(userId)` → Still works, uses default values
- New code: Can optionally provide additional context

## Testing

Comprehensive test coverage is provided in `server/repositories/SecurityRepository.audit.test.ts`:

```bash
npm test -- server/repositories/SecurityRepository.audit.test.ts
```

**Test Coverage**:

- ✅ Enable/disable audit trail tracking
- ✅ Timestamp updates on state transitions
- ✅ Backward compatibility of `recordMfaFailure()`
- ✅ All attempt types (totp, backup_code, sms, email)
- ✅ Complete MFA lifecycle scenarios

## Security Considerations

1. **Timestamp Precision**: SQLite stores timestamps with second precision. Date comparisons should account for this.

2. **PII in Logs**: IP addresses and user agents are stored for security analysis. Ensure compliance with privacy regulations (GDPR, CCPA, etc.).

3. **Retention Policy**: Consider implementing a retention policy for `userMfaAttempts` records to manage database size and comply with data retention requirements.

4. **Rate Limiting**: Use the new context fields to implement sophisticated rate limiting strategies (per-IP, per-user, per-attempt-type).

## Examples

### Complete MFA Lifecycle Tracking

```typescript
// User enables MFA
const setup = await generateTOTPSetup(user.email);
const hashedCodes = await Promise.all(setup.backupCodes.map(hashBackupCode));

await securityRepo.enableUserMfa(user.id, setup.secret, hashedCodes);
// enabledAt is set, disabledAt is null

// Later, user temporarily disables MFA
await securityRepo.disableUserMfa(user.id);
// disabledAt is set, enabledAt is preserved

// User re-enables MFA
await securityRepo.enableUserMfa(user.id, newSecret, newCodes);
// enabledAt is updated to new timestamp, disabledAt is cleared

// Check audit trail
const settings = await securityRepo.getUserMfaSettings(user.id);
console.log({
  enabled: settings.enabled,
  enabledAt: settings.enabledAt,
  disabledAt: settings.disabledAt,
  lastUpdate: settings.updatedAt,
});
```

### Recording MFA Failures with Context

```typescript
// In your MFA verification route
app.post("/api/auth/mfa/verify", async (req, res) => {
  const { userId, code, method } = req.body;

  try {
    // Verify the code
    const isValid = await verifyMfaCode(userId, code, method);

    if (!isValid) {
      // Record failure with full context
      await securityRepo.recordMfaFailure(userId, {
        attemptType: method, // 'totp' or 'backup_code'
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      // Check lockout status
      const lockoutStatus = await securityRepo.checkMfaLockout(userId);

      if (lockoutStatus.isLockedOut) {
        return res.status(429).json({
          error: "Too many failed attempts",
          lockedUntil: lockoutStatus.lockedUntil,
        });
      }

      return res.status(401).json({
        error: "Invalid code",
        attemptsRemaining: lockoutStatus.attemptsRemaining,
      });
    }

    // Success - reset attempts
    await securityRepo.resetMfaAttempts(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("MFA verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});
```

## References

- **Issue**: Fix MFA Schema and Function Signatures for Proper Audit Trail
- **Tests**: `server/repositories/SecurityRepository.audit.test.ts`
- **Schema**: `shared/schema.ts` (userMfaSettings table)
- **Repository**: `server/repositories/SecurityRepository.ts`
- **Migration**: `migrations/0005_add_mfa_audit_fields.sql`
