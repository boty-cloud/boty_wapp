import { Router } from "express";
import pino from "pino";

import type { ParsedMessage, RawBodyRequest, WebhookPayload } from "../types.js";
import { isOptedOut, setOptedOut } from "../services/optout.js";
import { saveIncomingMessage, saveOutgoingMessage } from "../services/conversations.js";
import { getOrCreateUser } from "../services/users.js";
import { routeMessage } from "../services/router.js";
import { sendTextReply } from "../services/whatsapp.js";
import { parseWebhookPayload } from "./parser.js";
import { verifySignature } from "./signature.js";
import { getIO } from "../socket.js";

const logger = pino({ name: "webhook" });
export const webhookRouter = Router();

webhookRouter.post("/webhook", (req, res) => {
  const rawReq = req as RawBodyRequest;
  const valid = verifySignature(
    rawReq.rawBody,
    req.headers["x-hub-signature-256"],
    process.env.APP_SECRET,
  );

  if (!valid) {
    res.sendStatus(401);
    return;
  }

  res.sendStatus(200);

  processMessages(req.body as WebhookPayload).catch((err) => {
    logger.error({ err }, "Error al procesar mensajes del webhook");
  });
});

async function processMessages(payload: WebhookPayload): Promise<void> {
  logger.info({ payload }, "Payload recibido");
  const { messages, contacts } = parseWebhookPayload(payload);
  logger.info({ messages, contacts }, "Payload parseado");
  if (!messages.length) return;

  const io = getIO();

  for (const msg of messages) {
    const rawName = contacts.get(msg.bsuid) ?? msg.bsuid;
    const { isNew, ...user } = await getOrCreateUser(msg.bsuid, rawName);
    const contactName = user.name;

    await saveIncomingMessage(msg, contactName).catch((err) => {
      logger.error({ err, bsuid: msg.bsuid }, "Error al guardar mensaje entrante");
    });

    io.emit("new-message", {
      bsuid: msg.bsuid,
      contactName,
      message: {
        direction: "in" as const,
        body: msg.body ?? `[${msg.type}]`,
        sender: "user" as const,
        timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
        mediaType: msg.mediaId ? msg.type : undefined,
        mediaUrl: msg.mediaId ? `/api/media/${msg.mediaId}` : undefined,
        fileName: msg.fileName,
      },
    });

    if (msg.type === "text" && msg.body?.trim().toUpperCase() === "STOP") {
      await setOptedOut(msg.bsuid);
      logger.info({ bsuid: msg.bsuid }, "STOP recibido, usuario dado de baja");
      continue;
    }

    const routing = routeMessage(msg.body);

    if (await isOptedOut(msg.bsuid)) {
      if (routing.category === "commercial") {
        logger.info({ bsuid: msg.bsuid }, "Mensaje comercial omitido, usuario dado de baja");
        continue;
      }
    }

    logger.info(
      { bsuid: msg.bsuid, category: routing.category, keyword: routing.matchedKeyword },
      "Mensaje enrutado",
    );

    if (routing.category === "support") {
      await handleSupport(msg, contactName, isNew);
    } else if (routing.category === "commercial") {
      await handleCommercial(msg, contactName, isNew);
    } else {
      await handleOther(msg, contactName, isNew);
    }
  }
}

async function handleSupport(msg: ParsedMessage, contactName: string, isNew: boolean): Promise<void> {
  logger.info({ bsuid: msg.bsuid }, "[SOPORTE] Procesando mensaje");
  const greeting = isNew ? "¡Hola, soy Boty! " : "";
  const reply = `${greeting}Transfiriendo mensaje al equipo de soporte... Nuestro horario de atención al cliente es de lunes a viernes de 10 a 18hs. ¡Saludos!`;
  await sendTextReply(msg.bsuid, reply);
  await saveOutgoingMessage(msg.bsuid, reply, "bot");

  const io = getIO();
  io.emit("new-message", {
    bsuid: msg.bsuid,
    contactName,
    message: { direction: "out" as const, body: reply, sender: "bot" as const, timestamp: new Date().toISOString() },
  });
}

async function handleCommercial(msg: ParsedMessage, contactName: string, isNew: boolean): Promise<void> {
  logger.info({ bsuid: msg.bsuid }, "[COMERCIAL] Procesando mensaje");
  const greeting = isNew ? "¡Hola, soy Boty! " : "";
  const reply = `${greeting}Para ver la información de nuestros módulos y/o precios, ingrese a: \nbotycloud.com\n; sino espere a ser atendido por un agente humano. Nuestro horario de atención al cliente es de lunes a viernes de 10 a 18hs. ¡Saludos!`;
  await sendTextReply(msg.bsuid, reply);
  await saveOutgoingMessage(msg.bsuid, reply, "bot");

  const io = getIO();
  io.emit("new-message", {
    bsuid: msg.bsuid,
    contactName,
    message: { direction: "out" as const, body: reply, sender: "bot" as const, timestamp: new Date().toISOString() },
  });
}

async function handleOther(msg: ParsedMessage, contactName: string, isNew: boolean): Promise<void> {
  logger.info({ bsuid: msg.bsuid }, "[OTHER] Procesando mensaje");
  const greeting = isNew ? "¡Hola, soy Boty! " : "";
  const reply = `${greeting}Para ver la información de nuestros módulos y/o precios, ingrese a botycloud.com; o escriba 'soporte' para ser transferido al equipo de soporte. Sino espere a ser atendido por un agente humano. Nuestro horario de atención al cliente es de lunes a viernes de 10 a 18hs. ¡Saludos!`;
  await sendTextReply(msg.bsuid, reply);
  await saveOutgoingMessage(msg.bsuid, reply, "bot");

  const io = getIO();
  io.emit("new-message", {
    bsuid: msg.bsuid,
    contactName,
    message: { direction: "out" as const, body: reply, sender: "bot" as const, timestamp: new Date().toISOString() },
  });
}
