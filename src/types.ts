import type { Request } from "express";
import { User, UserInfo, UserMetadata } from 'firebase/auth';

export interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

export type MessageType =
  | "text"
  | "image"
  | "audio"
  | "video"
  | "document"
  | "location"
  | "contacts"
  | "interactive"
  | "button"
  | "reaction"
  | "sticker"
  | "order"
  | "unknown";

export interface WebhookPayload {
  object: string;
  entry: WebhookEntry[];
}

export interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

export interface WebhookChange {
  field: string;
  value: WebhookChangeValue;
}

export interface WebhookChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WebhookContact[];
  messages?: WebhookMessage[];
}

export interface WebhookContact {
  profile: { name: string };
  wa_id: string;
}

export interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: MessageType;
  text?: { body: string };
  image?: { id: string; mime_type: string; caption?: string };
  video?: { id: string; mime_type: string; caption?: string };
  audio?: { id: string; mime_type: string };
  document?: { id: string; mime_type: string; filename?: string; caption?: string };
  sticker?: { id: string; mime_type: string };
  interactive?: {
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
  button?: { text: string; payload: string };
}

export interface ParsedMessage {
  bsuid: string;
  messageId: string;
  timestamp: string;
  type: MessageType;
  body: string | null;
  mediaId?: string;
  mimeType?: string;
  fileName?: string;
}

export interface RoutingDecision {
  category: "support" | "commercial";
  matchedKeyword: string | null;
}

export interface ParsedContact {
  name: string;
  waId: string;
}

export interface ConversationSummary {
  bsuid: string;
  contactName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

export interface UserDocument {
  phoneNumber: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
  optedOut: boolean;
}

export interface StoredMessage {
  id?: string;
  direction: "in" | "out";
  body: string;
  sender: "user" | "bot" | "human";
  timestamp: string;
  mediaType?: "image" | "video" | "audio" | "document";
  fileName?: string;
  mediaUrl?: string;
}

export type UsersDocument = Omit<
  User,
  'delete' | 'getIdToken' | 'getIdTokenResult' | 'reload' | 'toJSON'
> & {
  uid: string;
  email: string;
  activeCompany?: string;
  displayName: string;
  emailVerified: boolean;
  isAnonymous: boolean;
  metadata: UserMetadata;
  providerData: UserInfo[];
  refreshToken: string;
  tenantId: string;
  phoneNumber: string;
  photoURL: string;
  providerId: string;

}