import { hash, verify } from '@node-rs/argon2';

// Argon2id configuration for enterprise-grade security
const ARGON2_CONFIG = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  outputLen: 32,     // 32 bytes output
  parallelism: 4,    // 4 parallel threads
};

/**
 * Hash a plain text password using Argon2id
 * Argon2id is the recommended variant for enterprise applications
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_CONFIG);
}

/**
 * Verify a plain text password against an Argon2 hash
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    // Only support Argon2 hashes (starts with $argon2)
    if (passwordHash.startsWith('$argon2')) {
      return await verify(passwordHash, password);
    }
    
    console.error('Invalid password hash format. Only Argon2 hashes are supported.');
    return false;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Legacy function name for backwards compatibility
 * @deprecated Use verifyPassword instead
 */
export const comparePassword = verifyPassword;

/**
 * Comprehensive list of common/compromised passwords to reject
 * Based on industry security research and breach data
 */
const COMMON_PASSWORDS = [
  // Basic patterns
  'password', 'password123', 'password1', 'password12', 'password1234',
  '123456789', '12345678', '1234567890', '123456', '1234567',
  'qwerty123', 'qwerty', 'qwertyuiop', 'qwerty1', 'qwerty12',
  'admin123', 'admin', 'administrator', 'root123', 'root',
  'user123', 'user', 'guest123', 'guest', 'test123', 'test',
  
  // Dictionary words with numbers
  'welcome123', 'welcome', 'hello123', 'hello', 'login123', 'login',
  'master123', 'master', 'secret123', 'secret', 'access123', 'access',
  'default123', 'default', 'system123', 'system',
  
  // Keyboard patterns
  'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm', '!@#$%^&*()',
  '1q2w3e', '1q2w3e4r', '1qaz2wsx', 'a1b2c3', 'abc123',
  
  // Common company/service defaults
  'changeme', 'changeme123', 'temp123', 'temporary', 'demo123',
  'sample123', 'example123', 'placeholder123', 'backup123',
  
  // Gaming and social
  'minecraft123', 'roblox123', 'gaming123', 'player123', 'gamer123',
  'facebook123', 'instagram123', 'twitter123', 'google123',
  
  // Personal patterns
  'birthday123', 'family123', 'love123', 'money123', 'freedom123',
  'sunshine123', 'shadow123', 'dragon123', 'phoenix123', 'thunder123'
];

/**
 * Validate password strength according to enterprise security standards
 * PRD Requirements: 12+ characters, complexity, blacklist protection
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Length requirements (PRD: minimum 12 characters)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }
  
  // Character class requirements (PRD: combination of character types)
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }
  
  // Enhanced special character validation (broader range)
  if (!/[!@#$%^&*(),.?":{}|<>[\]\\/_+=~`-]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
  }
  
  // Pattern analysis
  const lowercasePassword = password.toLowerCase();
  
  // Check against comprehensive blacklist (PRD: prevent common/compromised passwords)
  if (COMMON_PASSWORDS.includes(lowercasePassword)) {
    errors.push('Password is too common and easily guessable. Please choose a more unique password.');
  }
  
  // Additional pattern checks for enterprise security
  
  // Reject simple repeated characters (aaaaaa, 111111, etc.)
  if (/(.)\1{5,}/.test(password)) {
    errors.push('Password cannot contain the same character repeated more than 5 times');
  }
  
  // Reject simple sequences (123456, abcdef, etc.)
  const hasAscendingSequence = /(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/.test(lowercasePassword);
  const hasDescendingSequence = /(?:987|876|765|654|543|432|321|210|109|zyx|yxw|xwv|wvu|vut|uts|tsr|srq|rqp|qpo|pon|onm|nml|mlk|lkj|jih|ihg|hgf|gfe|fed|edc|dcb|cba)/.test(lowercasePassword);
  
  if (hasAscendingSequence || hasDescendingSequence) {
    errors.push('Password cannot contain simple sequences (123456, abcdef, etc.)');
  }
  
  // Check for keyboard patterns (qwerty, asdf, etc.)
  const keyboardPatterns = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];
  for (const pattern of keyboardPatterns) {
    if (lowercasePassword.includes(pattern.substring(0, 6))) {
      errors.push('Password cannot contain keyboard patterns (qwerty, asdf, etc.)');
      break;
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a password needs to be rehashed (for bcrypt -> Argon2 migration)
 */
export function passwordNeedsRehash(passwordHash: string): boolean {
  // Rehash if it's a bcrypt hash (upgrade to Argon2)
  return passwordHash.startsWith('$2');
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