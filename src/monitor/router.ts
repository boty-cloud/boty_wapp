import { Router, type Request } from "express";
import crypto from "node:crypto";
import multer from "multer";
import {
  deleteConversation,
  deleteMessage,
  getConversations,
  getMessages,
  markRead,
  saveOutgoingMedia,
  saveOutgoingMessage,
} from "../services/conversations.js";
import { sendTextReply, sendMediaMessage, resolveMediaType, downloadMedia } from "../services/whatsapp.js";
import { getIO } from "../socket.js";
import { dashboardHtml, loginPageHtml } from "./dashboard.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 16 * 1024 * 1024 } });

export const monitorRouter = Router();

const COOKIE_NAME = "boty_monitor";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function authMiddleware(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): void {
  const monitorPassword = process.env.MONITOR_PASSWORD;
  if (!monitorPassword) {
    next();
    return;
  }
  const cookie = req.cookies?.[COOKIE_NAME];
  if (cookie === hashPassword(monitorPassword)) {
    next();
    return;
  }
  res.redirect("/monitor/login");
}

monitorRouter.get("/monitor/login", (_req, res) => {
  res.type("html").send(loginPageHtml());
});

monitorRouter.post("/monitor/login", (req, res) => {
  const monitorPassword = process.env.MONITOR_PASSWORD;
  const submitted = req.body?.password;

  if (!monitorPassword || submitted === monitorPassword) {
    res.cookie(COOKIE_NAME, hashPassword(monitorPassword ?? ""), {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });
    res.redirect("/monitor");
    return;
  }
  res.redirect("/monitor/login?error=1");
});

monitorRouter.get("/monitor", authMiddleware, (_req, res) => {
  res.type("html").send(dashboardHtml());
});

monitorRouter.get("/api/conversations", authMiddleware, async (_req, res) => {
  try {
    const convs = await getConversations();
    res.json(convs);
  } catch (err) {
    res.status(500).json({ error: "Error al cargar conversaciones" });
  }
});

monitorRouter.get(
  "/api/conversations/:bsuid/messages",
  authMiddleware,
  async (req, res) => {
    try {
      const bsuid = req.params.bsuid as string;
      const msgs = await getMessages(bsuid);
      res.json(msgs);
    } catch (err) {
      res.status(500).json({ error: "Error al cargar mensajes" });
    }
  },
);

monitorRouter.post(
  "/api/conversations/:bsuid/read",
  authMiddleware,
  async (req, res) => {
    try {
      const bsuid = req.params.bsuid as string;
      await markRead(bsuid);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error al marcar como leido" });
    }
  },
);

monitorRouter.delete(
  "/api/conversations/:bsuid",
  authMiddleware,
  async (req, res) => {
    try {
      const bsuid = req.params.bsuid as string;
      await deleteConversation(bsuid);

      const io = getIO();
      io.emit("conversation-deleted", { bsuid });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar conversacion" });
    }
  },
);

monitorRouter.delete(
  "/api/conversations/:bsuid/messages/:messageId",
  authMiddleware,
  async (req, res) => {
    try {
      const bsuid = req.params.bsuid as string;
      const messageId = req.params.messageId as string;
      await deleteMessage(bsuid, messageId);

      const io = getIO();
      io.emit("message-deleted", { bsuid, messageId });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar mensaje" });
    }
  },
);

monitorRouter.post(
  "/api/conversations/:bsuid/attachment",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    const bsuid = req.params.bsuid as string;
    const file = req.file;
    const caption = req.body?.caption?.trim() || undefined;

    if (!file) {
      res.status(400).json({ error: "No se adjunto archivo" });
      return;
    }

    try {
      const mediaType = await sendMediaMessage(
        bsuid,
        file.buffer,
        file.mimetype,
        file.originalname,
        caption,
      );
      await saveOutgoingMedia(bsuid, mediaType, file.originalname, "human");

      const label = `[${mediaType}: ${file.originalname}]`;
      const io = getIO();
      io.emit("new-message", {
        bsuid,
        contactName: bsuid,
        message: {
          direction: "out" as const,
          body: caption ? `${label} ${caption}` : label,
          sender: "human" as const,
          timestamp: new Date().toISOString(),
          mediaType,
          fileName: file.originalname,
        },
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error al enviar archivo" });
    }
  },
);

monitorRouter.post(
  "/api/conversations/:bsuid/reply",
  authMiddleware,
  async (req, res) => {
    const bsuid = req.params.bsuid as string;
    const { text } = req.body;

    if (!text?.trim()) {
      res.status(400).json({ error: "Texto vacio" });
      return;
    }

    try {
      await sendTextReply(bsuid, text.trim());
      await saveOutgoingMessage(bsuid, text.trim(), "human");

      const io = getIO();
      io.emit("new-message", {
        bsuid,
        contactName: bsuid,
        message: {
          direction: "out" as const,
          body: text.trim(),
          sender: "human" as const,
          timestamp: new Date().toISOString(),
        },
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: "Error al enviar respuesta" });
    }
  },
);

monitorRouter.get("/api/media/:mediaId", authMiddleware, async (req, res) => {
  try {
    const mediaId = req.params.mediaId as string;
    const { buffer, mimeType } = await downloadMedia(mediaId);
    res.set("Content-Type", mimeType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: "Error al descargar media" });
  }
});
