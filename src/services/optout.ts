import { FieldValue, Firestore } from "@google-cloud/firestore";

const db = new Firestore();
const COLLECTION = "optedOutUsers";

export async function isOptedOut(bsuid: string): Promise<boolean> {
  const doc = await db.collection(COLLECTION).doc(bsuid).get();
  return doc.exists;
}

export async function setOptedOut(bsuid: string): Promise<void> {
  await db.collection(COLLECTION).doc(bsuid).set({
    bsuid,
    optedOutAt: FieldValue.serverTimestamp(),
  });
}
