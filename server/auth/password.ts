import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password123', '12345678', 'qwerty123', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common and easily guessable');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting for authentication attempts
 */
const authFailures = new Map<string, { failures: number; lastFailure: number; lockUntil?: number }>();

export function checkAuthRateLimit(identifier: string, ip?: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = ip ? `${identifier}:${ip}` : identifier;
  const attempts = authFailures.get(key);
  
  // Clean up old entries to prevent memory leaks
  if (Math.random() < 0.01) { // 1% chance to clean up on each check
    const keysToDelete: string[] = [];
    authFailures.forEach((value, key) => {
      if (now - value.lastFailure > 24 * 60 * 60 * 1000) { // 24 hours
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => authFailures.delete(key));
  }
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Check if account is locked
  if (attempts.lockUntil && now < attempts.lockUntil) {
    return { allowed: false, retryAfter: Math.ceil((attempts.lockUntil - now) / 1000) };
  }
  
  // Reset if last failure was more than 15 minutes ago
  if (now - attempts.lastFailure > 15 * 60 * 1000) {
    authFailures.delete(key);
    return { allowed: true };
  }
  
  // Allow if under failure threshold
  if (attempts.failures < 5) {
    return { allowed: true };
  }
  
  // Lock account after 5 failed attempts for exponential backoff
  const lockDuration = Math.min(15 * 60 * 1000 * Math.pow(2, attempts.failures - 5), 24 * 60 * 60 * 1000); // Max 24 hours
  attempts.lockUntil = now + lockDuration;
  return { allowed: false, retryAfter: Math.ceil(lockDuration / 1000) };
}

/**
 * Record authentication failure
 */
export function recordAuthFailure(identifier: string, ip?: string): void {
  const now = Date.now();
  const key = ip ? `${identifier}:${ip}` : identifier;
  const attempts = authFailures.get(key);
  
  if (!attempts) {
    authFailures.set(key, { failures: 1, lastFailure: now });
  } else {
    // Reset if last failure was more than 15 minutes ago
    if (now - attempts.lastFailure > 15 * 60 * 1000) {
      attempts.failures = 1;
    } else {
      attempts.failures++;
    }
    attempts.lastFailure = now;
  }
}

/**
 * Clear authentication failures on successful login
 */
export function clearAuthFailures(identifier: string, ip?: string): void {
  const key = ip ? `${identifier}:${ip}` : identifier;
  authFailures.delete(key);
}