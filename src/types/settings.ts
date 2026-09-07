import { RiskSettings } from "./risk";

export interface SystemSettings {
  platformName: string;
  maintenanceMode: boolean;
  maxUsers: number;
  defaultTimeframe: string;
  defaultSymbol: string;
  aiProvider: "OmniRoute";
  aiModel: string;
  telegramEnabled: boolean;
  twelveDataApiKey?: string;
  alphaVantageApiKey?: string;
}

export interface UserSettings {
  userId: string;
  theme: "dark";
  soundAlerts: boolean;
  defaultTimeframe: string;
  defaultRiskSettings: RiskSettings;
}
