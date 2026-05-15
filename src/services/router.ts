import type { RoutingDecision } from "../types.js";

const SUPPORT_KEYWORDS = [
  "estado de pedido",
  "estado del pedido",
  "reclamo",
  "queja",
  "soporte",
  "support",
  "problema",
  "ayuda",
  "error"
];

const COMMERCIAL_KEYWORDS = [
  "buy",
  "price",
  "comprar",
  "precio",
  "módulos",
  "modulos",
  "módulo",
  "modulo",
  "prices",
  "servicios",
  "servicio",
  "comercial"
];

export function routeMessage(messageBody: string | null): RoutingDecision {
  if (!messageBody) return { category: "other", matchedKeyword: null };

  const normalized = messageBody.toLowerCase();
  for (const keyword of SUPPORT_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return { category: "support", matchedKeyword: keyword };
    }
  }
  for (const keyword of COMMERCIAL_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return { category: "commercial", matchedKeyword: keyword };
    }
  }

  return { category: "other", matchedKeyword: null };
}
