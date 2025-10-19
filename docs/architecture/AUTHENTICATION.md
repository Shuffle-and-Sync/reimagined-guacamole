# Authentication Documentation

## Overview

Shuffle & Sync implements a dual authentication system that supports both **Google OAuth** and **custom credentials-based authentication**. Both methods work independently and alongside each other without conflicts.

## Authentication Methods

### 1. Google OAuth (Recommended)

**Purpose**: Fastest way for users to sign in using their Google account

**Features**:

- ✅ Instant account creation
- ✅ No password management required
- ✅ Automatic email verification
- ✅ Streamlined sign-in flow
- ✅ Profile information pre-populated (name, email, profile picture)

**Implementation Details**:

- Uses Auth.js v5 (NextAuth.js) Google provider
- Configured in `server/auth/auth.config.ts` (lines 84-89)
- User creation/update handled in `signIn` callback (lines 340-380)
- OAuth users have `passwordHash: null` in database

**Flow**:

```
User clicks "Continue with Google"
  → Redirected to Google OAuth consent screen
  → User authorizes application
  → Callback to /api/auth/callback/google
  → User created/updated in database
  → Session created with JWT
  → User redirected to /home
```

### 2. Custom Credentials (Email + Password)

**Purpose**: Traditional email/password authentication for users who prefer not to use OAuth

**Features**:

- ✅ Full control over credentials
- ✅ Email verification requirement for security
- ✅ Strong password validation (12+ chars, uppercase, lowercase, numbers, symbols)
- ✅ Multi-factor authentication (MFA/2FA) support
- ✅ Account lockout protection after 5 failed attempts
- ✅ Password reset via email

**Implementation Details**:

- Registration endpoint: `/api/auth/register` (lines 2003-2223 in `server/routes.ts`)
- Login via Auth.js Credentials provider in `server/auth/auth.config.ts` (lines 97-319)
- Email verification tokens stored in database
- Passwords hashed with Argon2id

**Registration Flow**:

```
User submits registration form
  → Password strength validation
  → Email/username uniqueness check
  → Password hashed with Argon2id
  → User created with isEmailVerified: false
  → Email verification token generated
  → Verification email sent
  → User redirected to sign-in page with message
```

**Login Flow**:

```
User submits email + password
  → CSRF token fetched
  → POST to /api/auth/signin/credentials
  → Auth.js Credentials provider invoked
  → Rate limit check (5 attempts per 15 minutes)
  → User lookup by email
  → Account lock check
  → Email verification check ⚠️ REQUIRED
  → Password verification with Argon2id
  → MFA check (if enabled)
  → Failed attempt tracking
  → Session created with JWT
  → User redirected to /home
```

## Security Features

### Email Verification

**Credentials Users**: MUST verify email before first login

- Prevents fake account creation
- Ensures valid email for password resets
- Verification link valid for 24 hours
- Error message: "Please verify your email address before signing in. Check your inbox for the verification link."

**OAuth Users**: Email automatically verified (trusted provider)

### Multi-Factor Authentication (MFA/2FA)

Both authentication methods support optional MFA:

- TOTP (Time-based One-Time Password) via authenticator apps
- Backup codes for recovery
- Device fingerprinting for trusted devices
- Risk-based authentication prompts

**MFA Login Flow**:

```
User enters email + password
  → Password verified successfully
  → MFA check detects MFA enabled
  → User prompted for TOTP code
  → Code verified against stored secret
  → Session created
```

### Rate Limiting

**Credentials Login**:

- Per-email rate limiting: 5 attempts per 15 minutes
- Account lockout: 5 failed attempts = 30 minute lock
- Failed attempts tracked in database
- Lock time remaining shown in error messages

**OAuth Login**:

- No rate limiting (handled by OAuth provider)
- No failed attempt tracking needed

### Password Requirements

When using credentials authentication:

- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*()\_+-=[]{}|;:,.<>?)

**Example Valid Password**: `MySecureP@ssw0rd2024!`

## Database Schema

### User Fields Relevant to Authentication

```typescript
{
  id: string; // Unique user identifier
  email: string; // User's email address
  passwordHash: string | null; // Argon2id hash (null for OAuth users)
  isEmailVerified: boolean; // Email verification status
  mfaEnabled: boolean; // MFA enabled flag
  failedLoginAttempts: number; // Failed login counter
  lastFailedLogin: Date | null; // Last failed attempt timestamp
  accountLockedUntil: Date | null; // Account lock expiration
  // ... other fields
}
```

## Common Scenarios

### Scenario 1: OAuth User Tries Credentials Login

**What happens**: Error message displayed
**Why**: OAuth users have no password set (`passwordHash: null`)
**Error**: "This account uses OAuth authentication. Please sign in with Google or Twitch."
**Solution**: User should use "Continue with Google" button

**Code Reference**: `server/auth/auth.config.ts` lines 190-206

### Scenario 2: Credentials User Forgets Password

**What happens**: Password reset flow
**Process**:

1. User clicks "Forgot your password?" link
2. Enters email address
3. Receives password reset email (if account exists)
4. Clicks reset link (valid 1 hour)
5. Sets new password (must meet requirements)
6. Can now log in with new password

**Endpoints**:

- Request reset: `POST /api/auth/forgot-password`
- Verify token: `GET /api/auth/verify-reset-token/:token`
- Reset password: `POST /api/auth/reset-password`

### Scenario 3: User Hasn't Verified Email

**What happens**: Login blocked with helpful message
**Why**: Security requirement for credentials users
**Error**: "Please verify your email address before signing in. Check your inbox for the verification link."
**Solution**: Check email inbox (and spam folder) for verification link

**Code Reference**: `server/auth/auth.config.ts` lines 173-188

### Scenario 4: Account Locked After Failed Attempts

**What happens**: Temporary lockout
**Why**: Protection against brute force attacks
**Lockout Duration**: 30 minutes after 5 failed attempts
**Error**: "Account is temporarily locked. Try again in X minutes."
**Solution**: Wait for lockout period to expire

**Code Reference**: `server/auth/auth.config.ts` lines 155-171, 213-249

### Scenario 5: User Has MFA Enabled

**What happens**: Additional verification step
**Process**:

1. User enters email + password
2. Password verified successfully
3. Frontend detects MFA_REQUIRED in response
4. User redirected to MFA verification page (`/auth/mfa-verify`)
5. User enters 6-digit TOTP code from authenticator app
6. Code verified
7. Session created

**Code Reference**: `server/auth/auth.config.ts` lines 252-280

## API Endpoints

### Authentication Endpoints

| Endpoint                       | Method | Auth Required | Purpose                                         |
| ------------------------------ | ------ | ------------- | ----------------------------------------------- |
| `/api/auth/signin/google`      | GET    | No            | Initiate Google OAuth flow                      |
| `/api/auth/signin/credentials` | POST   | No            | Sign in with email/password                     |
| `/api/auth/register`           | POST   | No            | Create new account with credentials             |
| `/api/auth/signout`            | POST   | Yes           | Sign out current user                           |
| `/api/auth/session`            | GET    | No            | Get current session (null if not authenticated) |
| `/api/auth/csrf`               | GET    | No            | Get CSRF token for form submission              |

### Password Management

| Endpoint                              | Method | Auth Required | Purpose                      |
| ------------------------------------- | ------ | ------------- | ---------------------------- |
| `/api/auth/forgot-password`           | POST   | No            | Request password reset email |
| `/api/auth/verify-reset-token/:token` | GET    | No            | Verify reset token validity  |
| `/api/auth/reset-password`            | POST   | No            | Reset password with token    |

### Email Verification

| Endpoint                        | Method | Auth Required | Purpose                   |
| ------------------------------- | ------ | ------------- | ------------------------- |
| `/api/auth/verify-email`        | GET    | No            | Verify email with token   |
| `/api/auth/resend-verification` | POST   | No            | Resend verification email |

### Multi-Factor Authentication

| Endpoint                                | Method | Auth Required | Purpose                       |
| --------------------------------------- | ------ | ------------- | ----------------------------- |
| `/api/auth/mfa/setup`                   | POST   | Yes           | Initialize MFA setup          |
| `/api/auth/mfa/enable`                  | POST   | Yes           | Enable MFA after verification |
| `/api/auth/mfa/disable`                 | POST   | Yes           | Disable MFA                   |
| `/api/auth/mfa/verify`                  | POST   | No            | Verify MFA code during login  |
| `/api/auth/mfa/status`                  | GET    | Yes           | Check MFA status              |
| `/api/auth/mfa/backup-codes/regenerate` | POST   | Yes           | Generate new backup codes     |

## Frontend Integration

### Sign-In Page (`client/src/pages/auth/signin.tsx`)

**Features**:

- Google OAuth button ("Continue with Google")
- Email/Password form (expandable)
- Forgot password link
- Registration link
- Error handling for various scenarios

**Usage**:

```tsx
// Google OAuth
<Button onClick={handleGoogleSignIn}>
  Continue with Google
</Button>

// Credentials
<Form onSubmit={handleCredentialsLogin}>
  <Input name="email" type="email" />
  <Input name="password" type="password" />
  <Button type="submit">Sign In</Button>
</Form>
```

### Registration Page (`client/src/pages/auth/register.tsx`)

**Features**:

- Name fields (first, last)
- Username (unique, 3-30 chars)
- Email (unique, valid format)
- Password with strength indicator
- Confirm password
- Primary TCG community selector
- Terms acceptance checkbox

### useAuth Hook (`client/src/features/auth/hooks/useAuth.ts`)

**Provides**:

```typescript
{
  session: AuthSession | null;      // Current session data
  user: AuthUser | null;             // Current user
  isLoading: boolean;                // Loading state
  isAuthenticated: boolean;          // Authentication status
  signIn: (provider) => void;        // Initiate sign-in
  signOut: () => Promise<void>;      // Sign out
  smartInvalidate: () => void;       // Invalidate session cache
  backgroundSync: () => void;        // Background session sync
  prefetchUserData: () => Promise<void>; // Prefetch related data
}
```

## Configuration

### Environment Variables

Required for authentication:

```bash
# Auth.js v5 Configuration
AUTH_SECRET=your-secure-random-string-min-32-chars
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true

# Google OAuth (optional - enables OAuth)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Service (for verification and password reset)
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Auth.js Configuration (`server/auth/auth.config.ts`)

```typescript
export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  trustHost: true,
  providers: [
    Google({
      /* ... */
    }), // Optional
    Credentials({
      /* ... */
    }), // Always available
  ],
  callbacks: {
    jwt({ token, user }) {
      /* ... */
    },
    session({ session, token }) {
      /* ... */
    },
    signIn({ user, account, profile }) {
      /* ... */
    },
    redirect({ url, baseUrl }) {
      /* ... */
    },
  },
};
```

## Testing

### Running Tests

```bash
# Run all authentication tests
npm run test:auth

# Run credentials vs OAuth integration tests
npm test -- server/tests/features/auth-credentials-oauth.test.ts
```

### Test Coverage

The test suite covers:

- ✅ Credentials login with verified email
- ✅ Email verification requirement
- ✅ MFA requirement handling
- ✅ OAuth user rejection from credentials login
- ✅ OAuth login without password
- ✅ New user creation from OAuth
- ✅ Failed attempt tracking
- ✅ Account lockout after 5 attempts
- ✅ Session management for both methods
- ✅ Error messages and user guidance
- ✅ Registration flow validation
- ✅ Duplicate email/username prevention

## Troubleshooting

### "Invalid email or password"

**Possible Causes**:

1. Incorrect email address
2. Incorrect password
3. Account doesn't exist
4. Email typo

**Solutions**:

- Double-check email spelling
- Try password reset if forgotten
- Verify account exists (try registration)

### "Please verify your email address"

**Causes**: Email not verified after registration

**Solutions**:

1. Check inbox for verification email
2. Check spam/junk folder
3. Request new verification email
4. Contact support if no email received

### "This account uses OAuth authentication"

**Cause**: Trying to use email/password for an OAuth account

**Solution**: Use "Continue with Google" button instead

### "Account temporarily locked"

**Cause**: 5 failed login attempts

**Solutions**:

- Wait 30 minutes for automatic unlock
- Ensure you're using correct credentials
- Try password reset

### "MFA Required"

**Cause**: Multi-factor authentication enabled on account

**Solutions**:

1. Open authenticator app
2. Enter 6-digit code
3. If code doesn't work, use backup code
4. Contact support if lost access to authenticator

## Best Practices

### For Users

1. **Use OAuth when possible** - Simpler, no password to remember
2. **Enable MFA** - Extra security layer for credentials accounts
3. **Use strong passwords** - If using credentials, follow all requirements
4. **Verify email promptly** - Complete registration to enable login
5. **Save backup codes** - Keep MFA backup codes in safe place

### For Developers

1. **Never log passwords** - Even in development
2. **Always validate input** - Use Zod schemas for validation
3. **Rate limit auth endpoints** - Prevent brute force attacks
4. **Use HTTPS in production** - Encrypt credentials in transit
5. **Rotate AUTH_SECRET regularly** - Invalidates old sessions
6. **Monitor failed attempts** - Alert on suspicious patterns
7. **Test both auth methods** - Ensure neither breaks the other

## Future Enhancements

Planned improvements to the authentication system:

1. **Account Linking**: Allow OAuth users to add password (and vice versa)
2. **Social Login**: Add Discord, Twitch OAuth providers
3. **Passkeys**: WebAuthn/FIDO2 passwordless authentication
4. **Session Management**: View and revoke active sessions
5. **Login History**: Show recent login activity
6. **Risk-Based Auth**: Adaptive authentication based on risk score
7. **Email OTP**: Alternative to password for low-security scenarios

## Security Considerations

### Current Security Measures

- ✅ Argon2id password hashing (memory-hard, GPU-resistant)
- ✅ CSRF protection on all auth endpoints
- ✅ Rate limiting per email and IP
- ✅ Account lockout after failed attempts
- ✅ Secure HTTP-only cookies
- ✅ JWT session tokens (not database sessions)
- ✅ Email verification requirement
- ✅ Strong password requirements
- ✅ MFA/2FA support with TOTP
- ✅ Device fingerprinting for trusted devices
- ✅ Audit logging for all auth events

### Security Audit Results

Last audit: 2024
Status: ✅ PASSED

Issues found: None
Recommendations: All implemented

## Test Coverage

### Comprehensive Test Suites

**Total Authentication Tests**: 57 tests, 100% passing ✅

1. **Registration & Login Integration Tests** (`server/tests/features/registration-login-integration.test.ts`)
   - 33 comprehensive integration tests
   - Tests registration, login, verification, OAuth, errors, sessions
   - See detailed findings: `REGISTRATION_LOGIN_TEST_FINDINGS.md`

2. **Credentials vs OAuth Tests** (`server/tests/features/auth-credentials-oauth.test.ts`)
   - 24 unit tests for authentication logic
   - Tests both authentication methods
   - Tests security features and error handling

3. **General Authentication Tests** (`server/tests/features/authentication.test.ts`)
   - Basic authentication functionality tests
   - Session validation tests

### Test Documentation

- **Detailed Findings**: See `REGISTRATION_LOGIN_TEST_FINDINGS.md` for complete test results and API behavior documentation
- **Audit Summary**: See `AUTHENTICATION_AUDIT_SUMMARY.md` for security audit and recommendations

### Running Tests

```bash
# Run all authentication tests
npm test -- --testPathPatterns="auth"

# Run registration/login integration tests
npm test -- server/tests/features/registration-login-integration.test.ts

# Run credentials vs OAuth tests
npm test -- server/tests/features/auth-credentials-oauth.test.ts
```

## Support

For authentication issues:

1. Check this documentation
2. Review error messages carefully
3. Check test findings: `REGISTRATION_LOGIN_TEST_FINDINGS.md`
4. Review audit summary: `AUTHENTICATION_AUDIT_SUMMARY.md`
5. Check server logs (if developer)
6. Contact support at support@shuffleandsync.org

## License

This authentication system is part of Shuffle & Sync platform.
See LICENSE file for details.
