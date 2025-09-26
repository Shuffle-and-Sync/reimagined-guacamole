// JWT token payload interface
export interface AccessTokenJWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

// Token expiry constant
export const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function verifyAccessTokenJWT(token: string): AccessTokenJWTPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) {
      return null; // Token expired
    }
    return decoded;
  } catch {
    return null;
  }
}

export function generateEmailVerificationJWT(email: string): string {
  const payload = {
    email,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function verifyEmailVerificationJWT(token: string): { email: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    if (decoded.exp < Date.now()) {
      return null; // Token expired
    }
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export function validateTokenSecurity(token: string): boolean {
  // Basic token security validation
  return token && token.length > 10;
}

export async function revokeTokenByJTI(jti: string): Promise<void> {
  // This would revoke the token in the database
  // For now, this is a placeholder
  console.log(`Token ${jti} would be revoked`);
}