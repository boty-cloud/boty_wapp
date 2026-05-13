import type { ParsedMessage, WebhookPayload } from "../types.js";

export interface ParseResult {
  messages: ParsedMessage[];
  contacts: Map<string, string>;
}

export function parseWebhookPayload(body: WebhookPayload): ParseResult {
  const value = body.entry?.[0]?.changes?.[0]?.value;
  if (!value?.messages?.length) return { messages: [], contacts: new Map() };

  const contacts = new Map<string, string>();
  if (value.contacts) {
    for (const c of value.contacts) {
      contacts.set(c.wa_id, c.profile.name);
    }
  }

  const messages = value.messages.map((msg) => {
    let textBody: string | null = null;
    let mediaId: string | undefined;
    let mimeType: string | undefined;
    let fileName: string | undefined;

    if (msg.type === "text" && msg.text) {
      textBody = msg.text.body;
    } else if (msg.type === "image" && msg.image) {
      mediaId = msg.image.id;
      mimeType = msg.image.mime_type;
      textBody = msg.image.caption ?? null;
    } else if (msg.type === "video" && msg.video) {
      mediaId = msg.video.id;
      mimeType = msg.video.mime_type;
      textBody = msg.video.caption ?? null;
    } else if (msg.type === "audio" && msg.audio) {
      mediaId = msg.audio.id;
      mimeType = msg.audio.mime_type;
    } else if (msg.type === "document" && msg.document) {
      mediaId = msg.document.id;
      mimeType = msg.document.mime_type;
      fileName = msg.document.filename;
      textBody = msg.document.caption ?? null;
    } else if (msg.type === "sticker" && msg.sticker) {
      mediaId = msg.sticker.id;
      mimeType = msg.sticker.mime_type;
    } else if (msg.type === "interactive" && msg.interactive) {
      textBody =
        msg.interactive.button_reply?.title ??
        msg.interactive.list_reply?.title ??
        null;
    } else if (msg.type === "button" && msg.button) {
      textBody = msg.button.text;
    }

    return {
      bsuid: msg.from,
      messageId: msg.id,
      timestamp: msg.timestamp,
      type: msg.type,
      body: textBody,
      mediaId,
      mimeType,
      fileName,
    };
  });

  return { messages, contacts };
}
