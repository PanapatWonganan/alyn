import { auth } from "./auth";
import { headers } from "next/headers";
import { verifyToken } from "./jwt";
import { db } from "./db";

/**
 * Try to get session from Bearer token in Authorization header
 * Used for mobile app authentication
 * @returns Session-like object if valid Bearer token, null otherwise
 */
async function getSessionFromBearerToken() {
  const headersList = await headers();
  const authorization = headersList.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7);
  const payload = await verifyToken(token);

  if (!payload || payload.type !== "access") {
    return null;
  }

  // Fetch fresh user data
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      penName: true,
      coinBalance: true,
    },
  });

  if (!user) return null;

  // Return a session-like object compatible with NextAuth session type
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      penName: user.penName,
      coinBalance: user.coinBalance,
    },
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
  };
}

/**
 * Get session from either NextAuth cookies (web) or Bearer token (mobile)
 * @returns Session object or null
 */
export async function getSession() {
  // Try NextAuth session first (cookie-based)
  const session = await auth();
  if (session) return session;

  // Fall back to Bearer token (mobile)
  return getSessionFromBearerToken();
}

/**
 * Require authentication (either cookie-based or Bearer token)
 * @throws Error("UNAUTHORIZED") if not authenticated
 * @returns Session object
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireWriter() {
  const session = await requireAuth();
  const role = (session.user as unknown as Record<string, unknown>).role as string;
  if (role !== "WRITER" && role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as unknown as Record<string, unknown>).role as string;
  if (role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
