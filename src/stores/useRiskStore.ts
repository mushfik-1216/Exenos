import { create } from "zustand";
import { RiskSettings, TradingStatus, RiskValidationResult } from "@/types/risk";
import { APP_CONFIG } from "@/config/constants";

interface RiskState {
  settings: RiskSettings;
  tradingStatus: TradingStatus;
  dailyTradeCount: number;
  dailyLossTotal: number;
  lastValidationResult: RiskValidationResult | null;

  updateSettings: (partial: Partial<RiskSettings>) => void;
  setTradingStatus: (status: TradingStatus) => void;
  incrementTradeCount: () => void;
  recordLoss: (amount: number) => void;
  resetDailyCounters: () => void;
}

export const useRiskStore = create<RiskState>((set, get) => ({
  settings: {
    maxTradesPerDay: APP_CONFIG.DEFAULT_RISK.MAX_TRADES_PER_DAY,
    riskPerTradePercent: APP_CONFIG.DEFAULT_RISK.RISK_PER_TRADE_PERCENT,
    dailyLossLimitPercent: APP_CONFIG.DEFAULT_RISK.DAILY_LOSS_LIMIT_PERCENT,
    accountBalance: APP_CONFIG.DEFAULT_RISK.ACCOUNT_BALANCE,
    maxOpenPositions: APP_CONFIG.DEFAULT_RISK.MAX_OPEN_POSITIONS,
  },
  tradingStatus: "ACTIVE",
  dailyTradeCount: 0,
  dailyLossTotal: 0,
  lastValidationResult: null,

  updateSettings: (partial) => {
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
  },

  setTradingStatus: (status) => set({ tradingStatus: status }),

  incrementTradeCount: () => {
    const count = get().dailyTradeCount + 1;
    const max = get().settings.maxTradesPerDay;
    const status = count >= max ? "LOCKED" : count === max - 1 ? "WARNING" : "ACTIVE";
    set({ dailyTradeCount: count, tradingStatus: status });
  },

  recordLoss: (amount) => {
    const loss = get().dailyLossTotal + amount;
    const maxLoss = (get().settings.accountBalance * get().settings.dailyLossLimitPercent) / 100;
    const status = loss >= maxLoss ? "LOCKED" : "ACTIVE";
    set({ dailyLossTotal: loss, tradingStatus: status });
  },

  resetDailyCounters: () => {
    set({ dailyTradeCount: 0, dailyLossTotal: 0, tradingStatus: "ACTIVE" });
  },
}));
