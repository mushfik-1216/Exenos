import { Candle } from "@/types/market";
import { SwingPoint, LiquidityLevel } from "@/types/smc";

export function detectLiquidity(candles: Candle[], swings: SwingPoint[], tolerancePercent: number = 0.001): LiquidityLevel[] {
  const liquidityLevels: LiquidityLevel[] = [];
  const highs = swings.filter((s) => s.type === "HH" || s.type === "LH");
  const lows = swings.filter((s) => s.type === "HL" || s.type === "LL");

  // Detect Equal Highs (EQH)
  for (let i = 0; i < highs.length - 1; i++) {
    for (let j = i + 1; j < highs.length; j++) {
      const diff = Math.abs(highs[i].price - highs[j].price) / highs[i].price;
      if (diff <= tolerancePercent) {
        liquidityLevels.push({
          id: `liq_eqh_${highs[j].time}`,
          type: "EQUAL_HIGH",
          price: (highs[i].price + highs[j].price) / 2,
          time: highs[j].time,
          swept: false,
        });
      }
    }
  }

  // Detect Equal Lows (EQL)
  for (let i = 0; i < lows.length - 1; i++) {
    for (let j = i + 1; j < lows.length; j++) {
      const diff = Math.abs(lows[i].price - lows[j].price) / lows[i].price;
      if (diff <= tolerancePercent) {
        liquidityLevels.push({
          id: `liq_eql_${lows[j].time}`,
          type: "EQUAL_LOW",
          price: (lows[i].price + lows[j].price) / 2,
          time: lows[j].time,
          swept: false,
        });
      }
    }
  }

  // Add Buy Side Liquidity (BSL) from prominent Highs
  const lastHighs = highs.slice(-3);
  for (let i = 0; i < lastHighs.length; i++) {
    const h = lastHighs[i];
    liquidityLevels.push({
      id: `liq_bsl_${h.time}`,
      type: "BUY_SIDE",
      price: h.price,
      time: h.time,
      swept: false,
    });
  }

  // Add Sell Side Liquidity (SSL) from prominent Lows
  const lastLows = lows.slice(-3);
  for (let i = 0; i < lastLows.length; i++) {
    const l = lastLows[i];
    liquidityLevels.push({
      id: `liq_ssl_${l.time}`,
      type: "SELL_SIDE",
      price: l.price,
      time: l.time,
      swept: false,
    });
  }

  // Check for Liquidity Sweeps without creating throwaway arrays
  for (let lIdx = 0; lIdx < liquidityLevels.length; lIdx++) {
    const level = liquidityLevels[lIdx];
    for (let cIdx = 0; cIdx < candles.length; cIdx++) {
      const c = candles[cIdx];
      if (c.time <= level.time) continue;

      if (level.type === "BUY_SIDE" || level.type === "EQUAL_HIGH") {
        if (c.high > level.price && c.close < level.price) {
          level.swept = true;
          level.sweepTime = c.time;
          break;
        }
      } else if (level.type === "SELL_SIDE" || level.type === "EQUAL_LOW") {
        if (c.low < level.price && c.close > level.price) {
          level.swept = true;
          level.sweepTime = c.time;
          break;
        }
      }
    }
  }

  return liquidityLevels;
}
