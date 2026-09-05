export type SwingType = "HH" | "HL" | "LH" | "LL";

export interface SwingPoint {
  id: string;
  type: SwingType;
  price: number;
  time: number;
  index: number;
}

export type StructureEventType = "BOS" | "CHOCH";
export type StructureDirection = "BULLISH" | "BEARISH";

export interface StructureEvent {
  id: string;
  type: StructureEventType;
  direction: StructureDirection;
  brokenLevel: number;
  breakTime: number;
  confirmedTime: number;
  price: number;
}

export type LiquidityType =
  | "EQUAL_HIGH"
  | "EQUAL_LOW"
  | "BUY_SIDE"
  | "SELL_SIDE"
  | "LIQUIDITY_SWEEP";

export interface LiquidityLevel {
  id: string;
  type: LiquidityType;
  price: number;
  time: number;
  swept: boolean;
  sweepTime?: number;
}

export type SMCZoneType =
  | "ORDER_BLOCK"
  | "BREAKER_BLOCK"
  | "MITIGATION_BLOCK"
  | "FAIR_VALUE_GAP"
  | "PREMIUM_ZONE"
  | "DISCOUNT_ZONE";

export interface SMCZone {
  id: string;
  type: SMCZoneType;
  direction: "BULLISH" | "BEARISH";
  high: number;
  low: number;
  startTime: number;
  endTime?: number;
  mitigated: boolean;
  mitigationTime?: number;
}

export interface SMCAnalysisResult {
  marketStructure: "BULLISH" | "BEARISH" | "RANGING";
  swings: SwingPoint[];
  events: StructureEvent[];
  liquidity: LiquidityLevel[];
  zones: SMCZone[];
  equilibriumPrice: number;
  currentRange: {
    high: number;
    low: number;
  };
}
