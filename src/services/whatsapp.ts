import axios from "axios";
import FormData from "form-data";
import pino from "pino";

const logger = pino({ name: "whatsapp-api" });

const GRAPH_API_VERSION = "v21.0";

type MediaType = "image" | "video" | "audio" | "document";

export async function sendTextReply(to: string, text: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const token = process.env.WHATSAPP_TOKEN?.trim();

  if (!phoneNumberId || !token) {
    logger.error("Faltan WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TOKEN en las variables de entorno");
    return;
  }

  const recipient = to.startsWith("549") ? "54" + to.slice(3) : to;

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  console.log("WhatsApp API URL: " + url);

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );
    logger.info({ bsuid: to }, "Respuesta enviada");
  } catch (err) {
    logger.error({ err, bsuid: to }, "Error al enviar respuesta");
  }
}

const MIME_TO_MEDIA_TYPE: Record<string, MediaType> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "video/3gpp": "video",
  "audio/aac": "audio",
  "audio/mp4": "audio",
  "audio/mpeg": "audio",
  "audio/ogg": "audio",
  "audio/opus": "audio",
};

export function resolveMediaType(mimeType: string): MediaType {
  return MIME_TO_MEDIA_TYPE[mimeType] ?? "document";
}

async function uploadMedia(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const token = process.env.WHATSAPP_TOKEN?.trim();
  if (!phoneNumberId || !token) throw new Error("Missing WhatsApp credentials");

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fileBuffer, { filename: fileName, contentType: mimeType });
  form.append("type", mimeType);

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/media`;
  const res = await axios.post(url, form, {
    headers: { Authorization: `Bearer ${token}`, ...form.getHeaders() },
  });
  return res.data.id;
}

export async function sendMediaMessage(
  to: string,
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  caption?: string,
): Promise<MediaType> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const token = process.env.WHATSAPP_TOKEN?.trim();
  if (!phoneNumberId || !token) {
    logger.error("Faltan WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_TOKEN");
    throw new Error("Missing WhatsApp credentials");
  }

  const recipient = to.startsWith("549") ? "54" + to.slice(3) : to;
  const mediaType = resolveMediaType(mimeType);
  const mediaId = await uploadMedia(fileBuffer, mimeType, fileName);

  const mediaPayload: Record<string, unknown> = { id: mediaId };
  if (caption && (mediaType === "image" || mediaType === "video" || mediaType === "document")) {
    mediaPayload.caption = caption;
  }
  if (mediaType === "document") {
    mediaPayload.filename = fileName;
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to: recipient,
      type: mediaType,
      [mediaType]: mediaPayload,
    },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
  );

  logger.info({ bsuid: to, mediaType, fileName }, "Media enviado");
  return mediaType;
}

export async function downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const token = process.env.WHATSAPP_TOKEN?.trim();
  if (!token) throw new Error("Missing WHATSAPP_TOKEN");

  const metaRes = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const { url, mime_type } = metaRes.data;

  const fileRes = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: "arraybuffer",
  });

  return { buffer: Buffer.from(fileRes.data), mimeType: mime_type };
}
