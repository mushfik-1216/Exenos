import { getEnv } from "@/config/env";
import { AIAnalysisRequest, AIAnalysisResponse } from "@/types/ai";
import { buildAnalysisContext } from "./context-builder";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";

interface AICacheEntry {
  response: AIAnalysisResponse;
  expiresAt: number;
}

const AI_CACHE_TTL_MS = 45 * 1000; // 45 seconds cache
const aiCache = new Map<string, AICacheEntry>();

export class OmniRouteClient {
  private apiKey?: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    const env = getEnv();
    this.apiKey = env.OMNIROUTE_API_KEY;
    this.baseUrl = env.OMNIROUTE_BASE_URL || "https://api.omniroute.ai/v1";
    this.model = env.OMNIROUTE_MODEL || "default";
  }

  async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const cacheKey = `${request.symbol}:${request.timeframe}:${request.currentPrice}:${request.smcAnalysis.marketStructure}:${request.smcAnalysis.events.length}:${request.dailyTradeCount}`;
    const now = Date.now();
    const cached = aiCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return {
        ...cached.response,
        timestamp: new Date().toISOString(),
      };
    }

    const contextJson = buildAnalysisContext(request);
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(contextJson);

    if (!this.apiKey) {
      // Deterministic rule-based fallback when AI API key is not supplied
      const fallbackResult = this.generateDeterministicFallback(request);
      aiCache.set(cacheKey, {
        response: fallbackResult,
        expiresAt: Date.now() + AI_CACHE_TTL_MS,
      });
      return fallbackResult;
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.warn(`[OmniRouteClient] API returned HTTP ${response.status}, falling back to deterministic reasoning.`);
        const fallback = this.generateDeterministicFallback(request);
        aiCache.set(cacheKey, { response: fallback, expiresAt: Date.now() + AI_CACHE_TTL_MS });
        return fallback;
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        const fallback = this.generateDeterministicFallback(request);
        aiCache.set(cacheKey, { response: fallback, expiresAt: Date.now() + AI_CACHE_TTL_MS });
        return fallback;
      }

      const parsed = JSON.parse(content) as AIAnalysisResponse;
      parsed.timestamp = new Date().toISOString();
      aiCache.set(cacheKey, { response: parsed, expiresAt: Date.now() + AI_CACHE_TTL_MS });
      return parsed;
    } catch (err) {
      console.warn("[OmniRouteClient] Request failed:", err);
      const fallback = this.generateDeterministicFallback(request);
      aiCache.set(cacheKey, { response: fallback, expiresAt: Date.now() + AI_CACHE_TTL_MS });
      return fallback;
    }
  }

  private generateDeterministicFallback(request: AIAnalysisRequest): AIAnalysisResponse {
    const { smcAnalysis, technicalIndicators, currentPrice, symbol } = request;
    const { marketStructure, zones, liquidity } = smcAnalysis;
    const { rsi, adx } = technicalIndicators;

    const unmitigatedBullOB = zones.find((z) => z.type === "ORDER_BLOCK" && z.direction === "BULLISH" && !z.mitigated);
    const unmitigatedBearOB = zones.find((z) => z.type === "ORDER_BLOCK" && z.direction === "BEARISH" && !z.mitigated);
    const sslSwept = liquidity.some((l) => (l.type === "SELL_SIDE" || l.type === "EQUAL_LOW") && l.swept);
    const bslSwept = liquidity.some((l) => (l.type === "BUY_SIDE" || l.type === "EQUAL_HIGH") && l.swept);

    // High probability BUY rule
    if (marketStructure === "BULLISH" && sslSwept && unmitigatedBullOB && rsi < 65) {
      const sl = Number((unmitigatedBullOB.low * 0.998).toFixed(5));
      const risk = currentPrice - sl;
      const tp1 = Number((currentPrice + risk * 2).toFixed(5));
      const tp2 = Number((currentPrice + risk * 3).toFixed(5));
      const rr = Number(((tp1 - currentPrice) / risk).toFixed(1));

      return {
        signal: "BUY",
        bias: "BULLISH",
        setupName: "Bullish OB Mitigation + SSL Sweep",
        entryZone: {
          min: unmitigatedBullOB.low,
          max: unmitigatedBullOB.high,
          optimal: currentPrice,
        },
        stopLoss: sl,
        takeProfit1: tp1,
        takeProfit2: tp2,
        riskRewardRatio: rr,
        confidenceScore: 84,
        reasons: [
          "Bullish market structure confirmed by swing highs/lows",
          "Sell-Side Liquidity (SSL) swept into institutional demand zone",
          "Unmitigated Bullish Order Block providing immediate confluence",
          `RSI at ${rsi} indicating healthy momentum room`,
        ],
        invalidationConditions: [
          `Candle close below invalidation level ${sl}`,
          "Loss of higher timeframe bullish market structure",
        ],
        warnings: [
          "Verify high-impact news releases prior to order execution",
          "Ensure position size strictly conforms to 1% max risk rule",
        ],
        reasoningSummary: `High-probability bullish expansion expected from Order Block following SSL sweep on ${symbol}. Target 1:2+ RR.`,
        timestamp: new Date().toISOString(),
      };
    }

    // High probability SELL rule
    if (marketStructure === "BEARISH" && bslSwept && unmitigatedBearOB && rsi > 35) {
      const sl = Number((unmitigatedBearOB.high * 1.002).toFixed(5));
      const risk = sl - currentPrice;
      const tp1 = Number((currentPrice - risk * 2).toFixed(5));
      const tp2 = Number((currentPrice - risk * 3).toFixed(5));
      const rr = Number(((currentPrice - tp1) / risk).toFixed(1));

      return {
        signal: "SELL",
        bias: "BEARISH",
        setupName: "Bearish OB Mitigation + BSL Sweep",
        entryZone: {
          min: unmitigatedBearOB.low,
          max: unmitigatedBearOB.high,
          optimal: currentPrice,
        },
        stopLoss: sl,
        takeProfit1: tp1,
        takeProfit2: tp2,
        riskRewardRatio: rr,
        confidenceScore: 82,
        reasons: [
          "Bearish market structure confirmed by lower highs/lows",
          "Buy-Side Liquidity (BSL) swept into institutional supply zone",
          "Unmitigated Bearish Order Block providing immediate confluence",
          `RSI at ${rsi} indicating bearish continuation capacity`,
        ],
        invalidationConditions: [
          `Candle close above invalidation level ${sl}`,
          "Loss of higher timeframe bearish market structure",
        ],
        warnings: [
          "Verify high-impact news releases prior to execution",
          "Enforce deterministic capital preservation rules",
        ],
        reasoningSummary: `High-probability bearish continuation setup from Bearish OB following BSL sweep on ${symbol}. Target 1:2+ RR.`,
        timestamp: new Date().toISOString(),
      };
    }

    // Default to NO_TRADE (Capital Preservation)
    return {
      signal: "NO_TRADE",
      bias: marketStructure === "BULLISH" ? "BULLISH" : marketStructure === "BEARISH" ? "BEARISH" : "NEUTRAL",
      setupName: "None (Capital Preservation)",
      confidenceScore: 75,
      reasons: [
        "Market is currently in consolidation / equilibrium zone",
        "No fresh unmitigated Order Block with verified liquidity sweep confluence",
        `ADX trend strength (${adx.adx}) is below decisive breakout threshold`,
      ],
      invalidationConditions: [
        "Strong displacement candle breaking dealing range high/low",
        "Clear liquidity sweep followed by market structure shift (CHOCH)",
      ],
      warnings: [
        "Avoid emotional trading during low volatility consolidation",
        "Disciplined patience is required to maintain long-term edge",
      ],
      reasoningSummary: "Setup conditions do not meet strict institutional risk-reward threshold. NO_TRADE is the optimal decision.",
      timestamp: new Date().toISOString(),
    };
  }
}
