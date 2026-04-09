import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret"
);

const ACCESS_TOKEN_EXPIRY = "1h"; // 1 hour
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

export interface TokenPayload {
  userId: string;
  role: string;
  type: "access" | "refresh";
}

/**
 * Generate an access token for mobile authentication
 * @param userId - User ID
 * @param role - User role (READER, WRITER, ADMIN)
 * @returns JWT access token valid for 1 hour
 */
export async function generateAccessToken(
  userId: string,
  role: string
): Promise<string> {
  return new SignJWT({ userId, role, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Generate a refresh token for mobile authentication
 * @param userId - User ID
 * @param role - User role (READER, WRITER, ADMIN)
 * @returns JWT refresh token valid for 30 days
 */
export async function generateRefreshToken(
  userId: string,
  role: string
): Promise<string> {
  return new SignJWT({ userId, role, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT token (access or refresh)
 * @param token - JWT token to verify
 * @returns TokenPayload if valid, null if invalid or expired
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
