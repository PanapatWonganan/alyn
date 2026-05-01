import { db } from "./db";

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a specific user's devices
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
): Promise<void> {
  // Get all device tokens for this user
  const devices = await db.deviceToken.findMany({
    where: { userId },
  });

  if (devices.length === 0) return;

  // Group by platform
  const iosTokens = devices.filter(d => d.platform === "ios").map(d => d.token);
  const androidTokens = devices.filter(d => d.platform === "android").map(d => d.token);

  // TODO: Implement actual FCM sending
  // For now, log the notification
  console.log(`[Push] Sending to user ${userId}:`, {
    payload,
    iosTokens: iosTokens.length,
    androidTokens: androidTokens.length,
  });

  // When FCM is integrated, use:
  // await sendFCM(tokens, payload);
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
