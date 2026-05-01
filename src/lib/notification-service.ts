import { db } from "./db";
import { sendFcmToTokens } from "./fcm";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a specific user's devices via FCM. Logs only
 * (mock) when FCM_SERVICE_ACCOUNT_JSON is unset. Dead tokens reported by
 * FCM are pruned from the database so subsequent sends don't retry them.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  const devices = await db.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  });
  if (devices.length === 0) return;

  const tokens = devices.map((d) => d.token);
  const result = await sendFcmToTokens(tokens, payload);

  if (result.invalidTokens.length > 0) {
    await db.deviceToken
      .deleteMany({ where: { token: { in: result.invalidTokens } } })
      .catch((e) => console.error("[Push] Failed to prune dead tokens:", e));
  }
}

/**
 * Create a notification in database AND send push notification
 */
export async function createAndPushNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  // Create in-app notification
  const notification = await db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });

  // Send push notification
  await sendPushToUser(params.userId, {
    title: params.title,
    body: params.message,
    data: {
      type: params.type,
      notificationId: notification.id,
      ...(params.link ? { link: params.link } : {}),
    },
  });
}

/**
 * Send notification to all followers of a novel (e.g., new chapter)
 */
export async function notifyNovelFollowers(params: {
  novelId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  excludeUserId?: string; // Don't notify the author
}): Promise<void> {
  const bookmarks = await db.bookmark.findMany({
    where: { novelId: params.novelId },
    select: { userId: true },
  });

  const userIds = bookmarks
    .map(b => b.userId)
    .filter(id => id !== params.excludeUserId);

  // Create notifications for all followers
  await Promise.allSettled(
    userIds.map(userId =>
      createAndPushNotification({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  );
}

/**
 * Send notification to all followers of an author (e.g., new chapter by followed writer)
 */
export async function notifyAuthorFollowers(params: {
  authorId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  excludeUserId?: string;
}): Promise<void> {
  const follows = await db.follow.findMany({
    where: { followingId: params.authorId },
    select: { followerId: true },
  });

  const userIds = follows
    .map((f) => f.followerId)
    .filter((id) => id !== params.excludeUserId);

  await Promise.allSettled(
    userIds.map((userId) =>
      createAndPushNotification({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
      })
    )
  );
}
