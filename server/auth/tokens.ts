// JWT token payload interface
export interface AccessTokenJWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

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

export function validateTokenSecurity(token: string): boolean {
  // Basic token security validation
  return token && token.length > 10;
}

export async function revokeTokenByJTI(jti: string): Promise<void> {
  // This would revoke the token in the database
  // For now, this is a placeholder
  console.log(`Token ${jti} would be revoked`);
}