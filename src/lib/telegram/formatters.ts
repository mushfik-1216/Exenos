import { SignalAlertPayload, RiskAlertPayload } from "./types";

export function formatSignalTelegramMessage(payload: SignalAlertPayload): string {
  const { symbol, timeframe, analysis, riskValidation } = payload;
  const emoji = analysis.signal === "BUY" ? "🟢" : analysis.signal === "SELL" ? "🔴" : "⚪";

  const entryText = analysis.entryZone
    ? `${analysis.entryZone.optimal}`
    : "Market";
  const slText = analysis.stopLoss ? `${analysis.stopLoss}` : "N/A";
  const tp1Text = analysis.takeProfit1 ? `${analysis.takeProfit1}` : "N/A";
  const tp2Text = analysis.takeProfit2 ? `${analysis.takeProfit2}` : "N/A";
  const rrText = analysis.riskRewardRatio ? `1:${analysis.riskRewardRatio}` : "N/A";

  const reasons = analysis.reasons.map((r) => `• ${r}`).join("\n");
  const invalidations = analysis.invalidationConditions.map((ic) => `• ${ic}`).join("\n");

  return `<b>${emoji} EXENOS SIGNAL ALERT</b>

<b>Pair:</b> ${symbol} (${timeframe})
<b>Action:</b> <b>${analysis.signal}</b> [Bias: ${analysis.bias}]
<b>Setup:</b> ${analysis.setupName || "Institutional Setup"}
<b>Confidence:</b> ${analysis.confidenceScore}%

📊 <b>TRADE PARAMETERS:</b>
<b>Entry:</b> <code>${entryText}</code>
<b>Stop Loss:</b> <code>${slText}</code>
<b>TP1:</b> <code>${tp1Text}</code>
<b>TP2:</b> <code>${tp2Text}</code>
<b>Risk/Reward:</b> <code>${rrText}</code>
<b>Position Units:</b> <code>${riskValidation.positionSizeUnits.toLocaleString()}</code> ($${riskValidation.riskAmount} Risk)

🧠 <b>REASONS:</b>
${reasons}

⚠️ <b>INVALIDATION:</b>
${invalidations}

<i>Capital Preservation First. No profit guarantees.</i>`;
}

export function formatRiskTelegramMessage(payload: RiskAlertPayload): string {
  const statusEmoji = payload.tradingStatus === "LOCKED" ? "🚨" : "⚠️";

  return `<b>${statusEmoji} EXENOS RISK ALERT: ${payload.title}</b>

<b>Status:</b> <b>${payload.tradingStatus}</b>
<b>Details:</b> ${payload.message}
<b>Daily Trades Executed:</b> ${payload.dailyTrades}
<b>Daily Loss:</b> $${payload.dailyLoss.toFixed(2)}

<i>Strict discipline is enforced by deterministic risk control.</i>`;
}
