import { FieldValue, Firestore } from "@google-cloud/firestore";
import type { ConversationSummary, ParsedMessage, StoredMessage } from "../types.js";

const db = new Firestore();
const COLLECTION = "wapp_conversations";

export async function saveIncomingMessage(
  msg: ParsedMessage,
  contactName: string,
): Promise<void> {
  const convRef = db.collection(COLLECTION).doc(msg.bsuid);

  await convRef.set(
    {
      bsuid: msg.bsuid,
      contactName: contactName || msg.bsuid,
      lastMessage: msg.body ?? `[${msg.type}]`,
      lastMessageAt: new Date(Number(msg.timestamp) * 1000).toISOString(),
      unread: FieldValue.increment(1),
    },
    { merge: true },
  );

  const msgData: Record<string, unknown> = {
    direction: "in",
    body: msg.body ?? `[${msg.type}]`,
    sender: "user",
    timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
  };
  if (msg.mediaId) {
    msgData.mediaId = msg.mediaId;
    msgData.mediaType = msg.type;
    msgData.mimeType = msg.mimeType;
    msgData.fileName = msg.fileName;
  }
  await convRef.collection("messages").add(msgData);
}

export async function saveOutgoingMessage(
  bsuid: string,
  text: string,
  sender: "bot" | "human",
): Promise<void> {
  const convRef = db.collection(COLLECTION).doc(bsuid);

  await convRef.set(
    {
      lastMessage: text,
      lastMessageAt: new Date().toISOString(),
    },
    { merge: true },
  );

  await convRef.collection("messages").add({
    direction: "out",
    body: text,
    sender,
    timestamp: new Date().toISOString(),
  });
}

export async function getConversations(): Promise<ConversationSummary[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy("lastMessageAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      bsuid: data.bsuid,
      contactName: data.contactName ?? data.bsuid,
      lastMessage: data.lastMessage ?? "",
      lastMessageAt: data.lastMessageAt ?? "",
      unread: data.unread ?? 0,
    };
  });
}

export async function getMessages(bsuid: string): Promise<StoredMessage[]> {
  const snapshot = await db
    .collection(COLLECTION)
    .doc(bsuid)
    .collection("messages")
    .orderBy("timestamp", "asc")
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      direction: data.direction,
      body: data.body,
      sender: data.sender,
      timestamp: data.timestamp,
      mediaType: data.mediaType,
      fileName: data.fileName,
      mediaUrl: data.mediaId ? `/api/media/${data.mediaId as string}` : undefined,
    };
  });
}

export async function markRead(bsuid: string): Promise<void> {
  await db.collection(COLLECTION).doc(bsuid).update({ unread: 0 });
}

export async function deleteMessage(bsuid: string, messageId: string): Promise<void> {
  await db
    .collection(COLLECTION)
    .doc(bsuid)
    .collection("messages")
    .doc(messageId)
    .delete();
}

export async function saveOutgoingMedia(
  bsuid: string,
  mediaType: "image" | "video" | "audio" | "document",
  fileName: string,
  sender: "bot" | "human",
): Promise<void> {
  const convRef = db.collection(COLLECTION).doc(bsuid);
  const label = `[${mediaType}: ${fileName}]`;

  await convRef.set(
    { lastMessage: label, lastMessageAt: new Date().toISOString() },
    { merge: true },
  );

  await convRef.collection("messages").add({
    direction: "out",
    body: label,
    sender,
    timestamp: new Date().toISOString(),
    mediaType,
    fileName,
  });
}

export async function deleteConversation(bsuid: string): Promise<void> {
  const convRef = db.collection(COLLECTION).doc(bsuid);
  const messagesSnap = await convRef.collection("messages").listDocuments();

  const batch = db.batch();
  for (const docRef of messagesSnap) {
    batch.delete(docRef);
  }
  batch.delete(convRef);
  await batch.commit();
}
