import { Firestore } from "@google-cloud/firestore";
import type { UserDocument } from "../types.js";

const db = new Firestore();
const COLLECTION = "users";

export async function getOrCreateUser(
  phoneNumber: string,
  name: string,
): Promise<UserDocument> {
  const docRef = db.collection(COLLECTION).doc(phoneNumber);
  const doc = await docRef.get();

  if (doc.exists) {
    const data = doc.data()!;
    const updates: Record<string, unknown> = {
      lastSeenAt: new Date().toISOString(),
    };
    if (name && name !== phoneNumber && data.name !== name) {
      updates.name = name;
    }
    await docRef.update(updates);

    return {
      phoneNumber: data.phoneNumber,
      name: updates.name ? (updates.name as string) : data.name,
      createdAt: data.createdAt,
      lastSeenAt: updates.lastSeenAt as string,
      optedOut: data.optedOut ?? false,
    };
  }

  const now = new Date().toISOString();
  const user: UserDocument = {
    phoneNumber,
    name: name || phoneNumber,
    createdAt: now,
    lastSeenAt: now,
    optedOut: false,
  };
  await docRef.set(user);
  return user;
}

export async function getUser(phoneNumber: string): Promise<UserDocument | null> {
  const doc = await db.collection(COLLECTION).doc(phoneNumber).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  return {
    phoneNumber: data.phoneNumber,
    name: data.name,
    createdAt: data.createdAt,
    lastSeenAt: data.lastSeenAt,
    optedOut: data.optedOut ?? false,
  };
}

export async function updateUser(
  phoneNumber: string,
  fields: Partial<Pick<UserDocument, "name" | "optedOut">>,
): Promise<void> {
  await db.collection(COLLECTION).doc(phoneNumber).update(fields);
}
