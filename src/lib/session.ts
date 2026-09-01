import { connectDB } from "@/lib/db";
import { Session } from "@/models/Session";
export async function createSession(userId: string) {
  await connectDB();

  const sessionId = crypto.randomUUID();

  const expiresAt = new Date(Date.now() + 60 * 1000);

  await Session.create({
    sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function getSession(sessionId: string) {
  await connectDB();

  const session = await Session.findOne({ sessionId });

  if (!session) {
    return null;
  }

  if (new Date() > session.expiresAt) {
    await Session.deleteOne({ sessionId });

    return null;
  }

  return session;
}

export async function getUserFromSession(sessionId: string) {
  const session = await getSession(sessionId);

  if (!session) {
    return null;
  }

  return session.userId.toString();
}

export async function refreshSession(sessionId: string) {
  await connectDB();

  const session = await Session.findOne({ sessionId });

  if (!session) {
    return null;
  }

  if (new Date() > session.expiresAt) {
    await Session.deleteOne({ sessionId });
    return null;
  }

  const expiresAt = new Date(Date.now() + 60 * 1000);

  session.expiresAt = expiresAt;

  await session.save();

  return session;
}
