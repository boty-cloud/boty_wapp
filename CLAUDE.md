# Boty WhatsApp Server Standards

## Project Overview
- **Name:** Boty WhatsApp Engine
- **Stack:** Node.js (Express), WhatsApp Business Cloud API, Google Cloud Run
- **Purpose:** Commercial (Marketing/Sales) and Support (Customer Service)
- **Language:** Latin American Spanish

## Tech Stack & Commands
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **CLI Commands:**
  - Build: `npm run build`
  - Dev: `npm run dev`
  - Lint: `npm run lint`
  - Test: `npm test`

## WhatsApp & Meta Compliance (2026 Standards)
- **Message Categories:** Strictly use 'marketing', 'utility', or 'authentication' templates for business-initiated chats.
- **Service Window:** Automated replies are only "free" within the 24-hour window of a user's last message.
- **Opt-out Logic:** Must implement a "STOP" command that flags the user in the database and prevents further outbound messages.
- **Data Privacy:** Do not log PII (Personal Identifiable Information) in plain text. Use `BSUID` (Business-Scoped User ID) for tracking.

## Implementation Patterns
- **Webhooks:** Use `/webhook` for Meta verification (GET) and message reception (POST).
- **Validation:** Implement X-Hub-Signature-256 header validation to ensure requests originate from Meta.
- **Resilience:** Use 200 OK responses immediately to Meta webhooks, then process logic asynchronously to avoid timeout retries.

## Deployment Target
- **Platform:** Google Cloud Run
- **CI/CD:** Google Cloud Build
- **Containerization:** Docker (multi-stage build)