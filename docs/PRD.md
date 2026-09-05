# EXENOS
### AI-Powered Market Intelligence & Risk Analysis Platform

Version: 1.0  
Status: Draft  
Owner: Private Use (Max 5 Users)

---

# 1. Executive Summary

EXENOS is a private AI-assisted market analysis platform designed for disciplined traders who want structured market insights, risk validation, and professional trade planning without relying on emotional decision-making.

The platform combines:

- Market Data Analysis
- Technical Indicators
- Smart Money Concepts (SMC)
- Deterministic Risk Management
- AI Reasoning (OmniRoute)
- Trading Journal
- Telegram Notifications

EXENOS is not an automated trading bot.

The platform never guarantees profit and must always prioritize risk management and capital preservation.

The system must support:

- BUY
- SELL
- NO TRADE

NO TRADE is considered a valid and often preferred outcome.

---

# 2. Product Vision

Create a lightweight, professional, private trading intelligence platform that helps users:

- Understand market structure
- Identify high-probability opportunities
- Validate risk before entering trades
- Track trading performance
- Maintain trading discipline

The system should act like an intelligent trading assistant rather than a signal-selling platform.

---

# 3. Core Principles

## Principle 1

AI is never the source of market data.

---

## Principle 2

AI is never responsible for indicator calculations.

---

## Principle 3

AI is never responsible for risk calculations.

---

## Principle 4

All critical calculations must be deterministic.

---

## Principle 5

The system must support NO TRADE decisions.

---

## Principle 6

Capital preservation is more important than trade frequency.

---

# 4. Target Users

Maximum users:

```text
5 Users
```

The platform is private.

No public registration system.

No public marketplace.

No public subscriptions.

No signal selling features.

---

# 5. User Roles

## Admin

Permissions:

- Manage users
- Change settings
- Configure AI
- Configure Telegram
- Manage market data providers
- View analytics
- Manage system settings

---

## Trader

Permissions:

- Analyze markets
- View dashboard
- Manage journal
- Configure risk settings
- Connect TradingView
- Receive Telegram alerts

---

# 6. Authentication System

Authentication Type:

```text
Username + Password
```

Requirements:

- Secure password hashing
- Session-based authentication
- Protected routes
- Auto logout after inactivity
- Manual logout

Storage:

```text
/users.json
```

Example:

{
  "id": "user_001",
  "username": "mushfiq",
  "role": "admin",
  "password_hash": "encrypted"
}

---

# 7. TradingView Integration

Purpose:

Provide user-linked TradingView market access.

Users can connect:

- Session ID
- Cookie String

Connection Settings:

TradingView Settings

Connection Type:

- Session ID
- Cookie

Value:

[Input Field]

Options:

- Remember Session
- Remove On Exit

Actions:

- Connect
- Disconnect
- Validate Connection

---

# 8. TradingView Security Rules

The system must:

- Never expose cookies
- Never expose session IDs
- Never send credentials to AI
- Never store secrets in frontend

Storage:

Encrypted server-side only.

---

# 9. Market Data Architecture

Priority Order:

1. TradingView Connection
2. Yahoo Finance
3. Alpha Vantage

---

Failover Logic:

TradingView
↓
Yahoo Finance
↓
Alpha Vantage
↓
MARKET DATA UNAVAILABLE

---

Provider metadata must include:

{
  "provider": "",
  "timestamp": "",
  "symbol": ""
}

---

# 10. Supported Instruments

## Forex

- EURUSD
- GBPUSD
- USDJPY
- AUDUSD
- USDCHF
- USDCAD
- NZDUSD

---

## Metals

- XAUUSD

---

## Crypto

- BTCUSD
- ETHUSD

---

## Indices

- NAS100
- US30

---

# 11. Supported Timeframes

- 1m
- 5m
- 15m
- 30m
- 1h
- 4h
- 1D

Multi-timeframe analysis is mandatory.

Timeframes must remain configurable.

No hard-coded logic.

---

# 12. System Pipeline

Mandatory Flow:

Market Data
↓
Technical Analysis
↓
SMC Analysis
↓
AI Reasoning
↓
Risk Validation
↓
Final Decision
↓
Visualization
↓
Telegram Alerts

This flow must never be bypassed.

---

# 13. Deployment Strategy

Deployment Target:

Vercel

Architecture:

Single Deployment

Frontend + Backend

Inside one project.

No separate backend deployment.

---

# 14. Tech Stack

Framework:

Next.js 15

Language:

TypeScript

Styling:

Tailwind CSS

State Management:

Zustand

Charts:

Lightweight Charts

AI:

OmniRoute

Storage:

Google Drive JSON

Notifications:

Telegram Bot

Deployment:

Vercel

Database:

None

Redis:

None

PostgreSQL:

None

MongoDB:

None