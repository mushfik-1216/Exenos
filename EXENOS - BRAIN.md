# EXENOS - BRAIN.md

Version: 1.0

---

# PROJECT IDENTITY

Project Name:

EXENOS

Tagline:

Analyze. Validate. Execute Smarter.

EXENOS is a private AI-assisted market analysis platform for a maximum of 5 users.

The system focuses on:

- Technical Analysis
- Smart Money Concepts (SMC)
- Risk Management
- AI Reasoning
- Trading Journal
- Market Analytics

EXENOS is NOT:

- A signal-selling platform
- An automated trading bot
- A guaranteed profit system

---

# CORE PRODUCT RULES

Rule 1

Never guarantee profits.

All analysis must be probability-based.

---

Rule 2

NO TRADE is a valid outcome.

Prefer NO TRADE over low-quality setups.

---

Rule 3

Capital preservation is more important than trade frequency.

---

Rule 4

AI must never bypass risk validation.

---

Rule 5

Every trade idea must pass deterministic validation.

---

# SYSTEM ARCHITECTURE RULES

Mandatory Pipeline:

Market Data
→ Technical Analysis
→ SMC Analysis
→ AI Reasoning
→ Risk Validation
→ Final Signal
→ Visualization
→ Alerts

Never bypass this pipeline.

---

# TECHNOLOGY RULES

Framework:

Next.js 15

Language:

TypeScript

Styling:

Tailwind CSS

Charts:

Lightweight Charts

State:

Zustand

AI:

OmniRoute

Storage:

Google Drive JSON

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

---

# STORAGE RULES

All persistent data must be stored inside Google Drive JSON files.

Files:

/storage/users.json
/storage/settings.json
/storage/trades.json
/storage/journal.json
/storage/history.json
/storage/system.json

Use a storage abstraction layer.

Business logic must never directly depend on Google Drive APIs.

Future storage providers should be replaceable.

---

# USER LIMIT RULES

Maximum Users:

5

No public registration.

Users are created manually by Admin.

---

# AUTHENTICATION RULES

Authentication Type:

Username + Password

Requirements:

- Secure hashing
- Protected routes
- Session validation
- Logout support
- Auto session expiration

Never store passwords in plain text.

---

# MARKET DATA RULES

Provider Priority:

1. TradingView
2. Yahoo Finance
3. Alpha Vantage

Failover Chain:

TradingView
↓
Yahoo Finance
↓
Alpha Vantage
↓
MARKET DATA UNAVAILABLE

Always store:

- provider
- timestamp
- symbol

Never hide provider failures.

---

# TRADINGVIEW RULES

Users may connect:

- Session ID
- Cookie

Requirements:

- Never expose credentials
- Never log credentials
- Never send credentials to AI
- Encrypt before storage

Provide:

- Connect
- Disconnect
- Validate Connection

Settings:

Remember Session

Remove On Exit

---

# TECHNICAL ANALYSIS RULES

Indicators are deterministic.

AI must never calculate indicators.

Required Indicators:

- EMA
- SMA
- RSI
- MACD
- ATR
- VWAP
- Bollinger Bands
- ADX

Indicator calculations happen in backend only.

---

# SMC RULES

Detect:

Market Structure

- HH
- HL
- LH
- LL

Structure Events

- BOS
- CHOCH

Liquidity

- Equal High
- Equal Low
- Buy Side Liquidity
- Sell Side Liquidity
- Liquidity Sweep

Zones

- Order Block
- Breaker Block
- Mitigation Block
- Fair Value Gap
- Premium Zone
- Discount Zone

All zones must be stored structurally.

---

# AI RULES

Provider:

OmniRoute

Never use Gemini.

Never use OpenRouter.

AI Responsibilities:

- Reasoning
- Context Understanding
- Trade Explanation
- Setup Evaluation

AI Responsibilities DO NOT Include:

- Market Data
- Indicators
- SMC Detection
- Risk Calculation

AI only receives structured context.

---

# AI OUTPUT RULES

Allowed Signals:

BUY
SELL
NO_TRADE

Mandatory Output:

- Market Bias
- Setup
- Entry Zone
- Stop Loss
- Take Profit 1
- Take Profit 2
- Risk Reward
- Confidence
- Reasons
- Invalidation
- Warnings

---

# RISK MANAGEMENT RULES

Risk is deterministic.

AI cannot override risk rules.

Default:

Max Trades Per Day = 2

Risk Per Trade = 1%

Daily Loss Limit = 3%

Daily Target = User Defined

---

# TRADING LOCK RULES

Lock Trading When:

- Daily trade limit reached
- Daily loss limit reached

Status Values:

ACTIVE
WARNING
LOCKED

LOCKED status blocks new setups.

---

# JOURNAL RULES

Store:

- Symbol
- Direction
- Entry
- Stop Loss
- Take Profit
- Exit
- Result
- PnL
- Notes
- AI Analysis

All completed trades should be journal-ready.

---

# ANALYTICS RULES

Track:

- Win Rate
- Loss Rate
- Total Trades
- Total PnL
- Average RR
- Pair Performance
- Setup Performance
- Daily Performance
- Weekly Performance
- Monthly Performance

---

# TELEGRAM RULES

Supported Alerts:

Signal Alert

Risk Alert

Daily Summary

Telegram is optional.

System must function without Telegram.

---

# UI RULES

Theme:

Black
Minimal
Premium

Inspired By:

- TradingView
- Bloomberg Terminal
- Apple Minimalism

Avoid:

- Bright colors
- Excessive gradients
- Flashy animations

---

# COLOR SYSTEM

Background:

#050505

Surface:

#0A0A0A

Border:

#1A1A1A

Text:

#FFFFFF

Secondary Text:

#9CA3AF

Success:

#22C55E

Danger:

#EF4444

Warning:

#F59E0B

---

# PERFORMANCE RULES

Keep bundle size minimal.

Avoid unnecessary libraries.

Prefer server-side processing.

Never call AI on every tick.

Trigger AI:

- Manual Analysis
- Scheduled Analysis
- Market Events

---

# SECURITY RULES

Never expose:

- API Keys
- Session IDs
- Cookies
- Telegram Tokens

Never send secrets to frontend.

Never send secrets to AI.

---

# DEPLOYMENT RULES

Target:

Vercel

Architecture:

Single Deployment

Frontend + Backend inside one project.

No separate backend deployment.

---

# DEVELOPMENT RULES

Before coding:

1. Read TASKS.md
2. Read current task
3. Read relevant files only

Never scan:

- node_modules
- .next
- dist
- build

After completing a task:

Update TASKS.md

Mark progress.

Keep documentation synchronized.

---

# FINAL OBJECTIVE

Build a professional, private, AI-assisted market intelligence platform that prioritizes:

1. Discipline
2. Risk Management
3. Structured Analysis
4. Capital Preservation

over trade frequency and emotional decision-making.