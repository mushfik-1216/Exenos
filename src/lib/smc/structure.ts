import { Candle } from "@/types/market";
import { SwingPoint, StructureEvent, StructureEventType, StructureDirection } from "@/types/smc";

export function detectStructureEvents(candles: Candle[], swings: SwingPoint[]): StructureEvent[] {
  if (swings.length < 2 || candles.length === 0) {
    return [];
  }

  const events: StructureEvent[] = [];
  let currentTrend: "BULLISH" | "BEARISH" | "UNKNOWN" = "UNKNOWN";

  for (let i = 0; i < swings.length - 1; i++) {
    const currentSwing = swings[i];
    const startIndex = currentSwing.index !== undefined ? currentSwing.index + 1 : 0;

    if (currentSwing.type === "HH" || currentSwing.type === "LH") {
      let breakCandle: Candle | undefined;
      for (let cIdx = startIndex; cIdx < candles.length; cIdx++) {
        const c = candles[cIdx];
        if (c.time > currentSwing.time && c.close > currentSwing.price) {
          breakCandle = c;
          break;
        }
      }

      if (breakCandle) {
        const isChoch = currentTrend === "BEARISH";
        const type: StructureEventType = isChoch ? "CHOCH" : "BOS";
        const direction: StructureDirection = "BULLISH";
        currentTrend = "BULLISH";

        events.push({
          id: `struct_bull_${currentSwing.time}`,
          type,
          direction,
          brokenLevel: currentSwing.price,
          breakTime: breakCandle.time,
          confirmedTime: breakCandle.time,
          price: breakCandle.close,
        });
      }
    } else if (currentSwing.type === "LL" || currentSwing.type === "HL") {
      let breakCandle: Candle | undefined;
      for (let cIdx = startIndex; cIdx < candles.length; cIdx++) {
        const c = candles[cIdx];
        if (c.time > currentSwing.time && c.close < currentSwing.price) {
          breakCandle = c;
          break;
        }
      }

      if (breakCandle) {
        const isChoch = currentTrend === "BULLISH";
        const type: StructureEventType = isChoch ? "CHOCH" : "BOS";
        const direction: StructureDirection = "BEARISH";
        currentTrend = "BEARISH";

        events.push({
          id: `struct_bear_${currentSwing.time}`,
          type,
          direction,
          brokenLevel: currentSwing.price,
          breakTime: breakCandle.time,
          confirmedTime: breakCandle.time,
          price: breakCandle.close,
        });
      }
    }
  }

  return events;
}
