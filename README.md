# 🚀 Antigravity General-Purpose AI Agent

<div align="center">

[![Deployed on Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-0088cc?style=flat-square&logo=telegram)](https://core.telegram.org/bots)

**A production-ready, autonomous AI agent with long-term memory, dynamic tool execution, and multi-channel interface**

[Features](#-features) • [Architecture](#️-architecture) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Documentation](#-admin--control-pages)

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
- [Admin & Control Pages](#-admin--control-pages)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Antigravity is a production-ready, general-purpose autonomous AI agent built on Next.js App Router. It combines the power of the Vercel AI SDK with Composio external tool integrations, Supermemory long-term memory, Telegram bot interface, and Vercel Cron scheduled automation to create a truly intelligent assistant that learns, remembers, and acts on your behalf.

---

## ✨ Features

### 🛠️ Core Capabilities

- **Dynamic Tool Execution** — Native Composio integration with Tool Router session API for discovering and invoking external tools (Gmail, GitHub, Notion, Slack, etc.) scoped per-user
- **Persistent Long-Term Memory** — Supermemory-powered scoped containers storing durable facts, preferences, and user profiles across conversations and channels
- **Conversational Onboarding & Agent Soul** — Automated discovery flow that tailors the agent's voice, tone, and principles into a persistent markdown "Soul"
- **Graceful Degradation** — Seamless operation even when optional services (Composio, Supermemory, Telegram) are unavailable

### 🔌 Integration & Channels

- **Unified Telegram Bot Interface** — Access the same agent, memory, and tools directly through Telegram via deep-linked account pairing
- **Automated Scheduled Tasks** — Vercel Cron-managed recurring background tasks (daily briefings, reminders, etc.)
- **Guest vs. Regular Mode** — Privacy safeguards preventing external OAuth credential exposure and long-term memory contamination

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.0 |
| **AI SDK** | Vercel AI SDK |
| **Database** | Neon Postgres |
| **ORM** | Drizzle ORM |
| **Tool Integration** | Composio |
| **Memory** | Supermemory |
| **Bot Platform** | Telegram Bot API |
| **Deployment** | Vercel |
| **Package Manager** | pnpm |

---

## 🏗️ Architecture

```mermaid
flowchart TD
    UserWeb[Web Chat Interface] -->|Stream /api/chat| ChatRoute[/api/chat Route/]
    UserTG[Telegram DM] -->|Webhook /api/telegram-webhook| TGRoute[/api/telegram-webhook Route/]
    CronTrigger[Vercel Cron / Scheduled Tick] -->|Tick /api/cron/tick| CronRoute[/api/cron/tick Route/]

    ChatRoute --> AI[Vercel AI SDK Engine]
    TGRoute --> AI
    CronRoute --> AI

    AI --> LocalTools[Local Tools: setSoul, scheduleTask, etc.]
    AI --> Composio[Composio Tool Router]
    AI --> Supermemory[Supermemory Tools: addMemory, searchMemories]

    ChatRoute --> DB[(Neon Postgres DB: Users, Soul, Telegram, CronJobs)]
    TGRoute --> DB
    CronRoute --> DB
