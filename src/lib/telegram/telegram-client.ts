import { getEnv } from "@/config/env";
import { SignalAlertPayload, RiskAlertPayload } from "./types";
import { formatSignalTelegramMessage, formatRiskTelegramMessage } from "./formatters";

export class TelegramClient {
  private botToken?: string;
  private defaultChatId?: string;

  constructor() {
    const env = getEnv();
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.defaultChatId = env.TELEGRAM_CHAT_ID;
  }

  isConfigured(): boolean {
    return Boolean(this.botToken && this.defaultChatId);
  }

  async sendMessage(text: string, chatId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: "Telegram Bot Token not configured" };
    }

    const targetChatId = chatId || this.defaultChatId;
    if (!targetChatId) {
      return { success: false, error: "Telegram Chat ID not configured" };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.description || `HTTP ${response.status}` };
      }

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Telegram request failed";
      return { success: false, error: message };
    }
  }

  async sendSignalAlert(payload: SignalAlertPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Telegram not configured" };
    }
    const message = formatSignalTelegramMessage(payload);
    return await this.sendMessage(message);
  }

  async sendRiskAlert(payload: RiskAlertPayload): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: "Telegram not configured" };
    }
    const message = formatRiskTelegramMessage(payload);
    return await this.sendMessage(message);
  }
}
