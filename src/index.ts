import "dotenv/config";

import express from "express";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { Server } from "socket.io";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pino from "pino";

import type { RawBodyRequest } from "./types.js";
import { webhookRouter } from "./webhook/router.js";
import { monitorRouter } from "./monitor/router.js";
import { setIO } from "./socket.js";

const logger = pino({ name: "boty-wapp" });
const app = express();
const server = createServer(app);
const io = new Server(server);
setIO(io);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as RawBodyRequest).rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

app.use(webhookRouter);
app.use(monitorRouter);

app.get("/favicon.ico", (_req, res) => {
  res.sendFile(resolve(__dirname, "favicon.ico"));
});

app.get('/', (req, res) => {
  res.send('Boty Server is live and reaching your local machine!');
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const trimmedToken = typeof token === 'string' ? token.trim() : '';
  const trimmedVerify = VERIFY_TOKEN?.trim() ?? '';

  if (mode && token) {
    if (mode === 'subscribe' && trimmedToken === trimmedVerify) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

const PORT = process.env.PORT ?? 8080;
server.listen(PORT, () => {
  logger.info({ port: PORT }, "Servidor escuchando");
});
