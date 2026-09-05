import { Candle } from "@/types/market";
import { SMCAnalysisResult } from "@/types/smc";
import { detectSwingPoints } from "./swings";
import { detectStructureEvents } from "./structure";
import { detectLiquidity } from "./liquidity";
import { detectFairValueGaps, detectOrderBlocks, calculatePremiumDiscount } from "./zones";

export class SMCEngine {
  static analyze(candles: Candle[]): SMCAnalysisResult {
    if (!candles || candles.length < 10) {
      return {
        marketStructure: "RANGING",
        swings: [],
        events: [],
        liquidity: [],
        zones: [],
        equilibriumPrice: 0,
        currentRange: { high: 0, low: 0 },
      };
    }

    // 1. Detect Swings
    const swings = detectSwingPoints(candles, 3);

    // 2. Detect BOS & CHOCH
    const events = detectStructureEvents(candles, swings);

    // 3. Detect Liquidity & Sweeps
    const liquidity = detectLiquidity(candles, swings);

    // 4. Detect FVGs and Order Blocks
    const fvgs = detectFairValueGaps(candles);
    const obs = detectOrderBlocks(candles);
    const { equilibriumPrice, currentRange, premiumZone, discountZone } =
      calculatePremiumDiscount(candles);

    const zones = [...obs.slice(-5), ...fvgs.slice(-5), premiumZone, discountZone];

    // Determine overall structure bias
    const lastEvent = events[events.length - 1];
    let marketStructure: "BULLISH" | "BEARISH" | "RANGING" = "RANGING";

    if (lastEvent) {
      marketStructure = lastEvent.direction === "BULLISH" ? "BULLISH" : "BEARISH";
    } else if (swings.length >= 2) {
      const lastSwing = swings[swings.length - 1];
      if (lastSwing.type === "HH" || lastSwing.type === "HL") {
        marketStructure = "BULLISH";
      } else if (lastSwing.type === "LL" || lastSwing.type === "LH") {
        marketStructure = "BEARISH";
      }
    }

    return {
      marketStructure,
      swings,
      events,
      liquidity,
      zones,
      equilibriumPrice,
      currentRange,
    };
  }
}
