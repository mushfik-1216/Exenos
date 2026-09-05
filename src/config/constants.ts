export const APP_CONFIG = {
  NAME: "EXENOS",
  TAGLINE: "Analyze. Validate. Execute Smarter.",
  MAX_USERS: 5,
  DEFAULT_SYMBOL: "EURUSD" as const,
  DEFAULT_TIMEFRAME: "15m" as const,
  SESSION_COOKIE_NAME: "exenos_session",
  SESSION_EXPIRY_SECONDS: 60 * 60 * 24, // 24 hours
  DEFAULT_RISK: {
    MAX_TRADES_PER_DAY: 2,
    RISK_PER_TRADE_PERCENT: 1.0,
    DAILY_LOSS_LIMIT_PERCENT: 3.0,
    ACCOUNT_BALANCE: 10000,
    MAX_OPEN_POSITIONS: 1,
  },
  COLORS: {
    BG: "#050505",
    SURFACE: "#0A0A0A",
    SURFACE_2: "#111111",
    BORDER: "#1A1A1A",
    TEXT: "#FFFFFF",
    MUTED: "#9CA3AF",
    SUCCESS: "#22C55E",
    DANGER: "#EF4444",
    WARNING: "#F59E0B",
    ACCENT: "#00E599",
  },
} as const;
