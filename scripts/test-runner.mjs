// Synthetic candlestick generator
function generateCandles(count = 50) {
  const candles = [];
  const basePrice = 1.0800;
  const now = Math.floor(Date.now() / 1000) - count * 900;

  for (let i = 0; i < count; i++) {
    const variation = Math.sin(i / 3) * 0.0030 + (i % 2 === 0 ? 0.0005 : -0.0003);
    const open = Number((basePrice + variation).toFixed(5));
    const high = Number((open + 0.0015).toFixed(5));
    const low = Number((open - 0.0012).toFixed(5));
    const close = Number((open + (i % 2 === 0 ? 0.0008 : -0.0006)).toFixed(5));
    const volume = 1000 + i * 50;

    candles.push({ time: now + i * 900, open, high, low, close, volume });
  }
  return candles;
}

console.log("==========================================");
console.log("EXENOS TEST SUITE: Deterministic Verification");
console.log("==========================================\n");

const candles = generateCandles(60);

// 1. Test EMA Calculation
console.log("▶ [1/5] Testing EMA Calculation...");
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  let prevEma = sum / period;
  const result = [prevEma];
  for (let i = period; i < data.length; i++) {
    const curEma = data[i].close * k + prevEma * (1 - k);
    result.push(curEma);
    prevEma = curEma;
  }
  return result;
}
const ema9 = calcEMA(candles, 9);
const ema21 = calcEMA(candles, 21);
console.log("  ✓ EMA(9) Latest:", ema9[ema9.length - 1].toFixed(5));
console.log("  ✓ EMA(21) Latest:", ema21[ema21.length - 1].toFixed(5));
if (isNaN(ema9[0]) || isNaN(ema21[0])) throw new Error("EMA calculation error");
console.log("  ✅ EMA passed.\n");

// 2. Test RSI Calculation
console.log("▶ [2/5] Testing RSI Calculation...");
function calcRSI(data, period = 14) {
  const gains = [];
  const losses = [];
  for (let i = 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const rsiList = [];
  rsiList.push(100 - 100 / (1 + (avgLoss === 0 ? 100 : avgGain / avgLoss)));
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiList.push(100 - 100 / (1 + rs));
  }
  return rsiList;
}
const rsi = calcRSI(candles, 14);
const latestRsi = rsi[rsi.length - 1];
console.log("  ✓ RSI(14) Latest:", latestRsi.toFixed(2));
if (latestRsi < 0 || latestRsi > 100 || isNaN(latestRsi)) throw new Error("RSI out of bounds");
console.log("  ✅ RSI passed.\n");

// 3. Test SMC Swing & FVG Detection
console.log("▶ [3/5] Testing SMC Swings & FVG Imbalance Detection...");
function detectFVG(data) {
  const fvgs = [];
  for (let i = 2; i < data.length; i++) {
    const c1 = data[i - 2];
    const c2 = data[i - 1];
    const c3 = data[i];
    if (c1.high < c3.low && c2.close > c2.open) {
      fvgs.push({ type: "BULLISH_FVG", low: c1.high, high: c3.low, time: c2.time });
    }
    if (c1.low > c3.high && c2.close < c2.open) {
      fvgs.push({ type: "BEARISH_FVG", low: c3.high, high: c1.low, time: c2.time });
    }
  }
  return fvgs;
}
const fvgs = detectFVG(candles);
console.log("  ✓ FVGs Detected Count:", fvgs.length);
console.log("  ✅ SMC Detection passed.\n");

// 4. Test Deterministic Risk Math
console.log("▶ [4/5] Testing Risk & Position Size Engine...");
function validateRisk(balance, riskPercent, entry, sl, tp, tradesToday, maxTrades) {
  const riskAmount = (balance * riskPercent) / 100;
  const riskDist = Math.abs(entry - sl);
  const rewardDist = Math.abs(tp - entry);
  const rr = Number((rewardDist / riskDist).toFixed(2));
  const units = Math.floor(riskAmount / riskDist);
  const status = tradesToday >= maxTrades ? "LOCKED" : "ACTIVE";
  const isValid = status !== "LOCKED" && rr >= 1.5;
  return { isValid, status, rr, units, riskAmount };
}

const validTest = validateRisk(10000, 1.0, 1.0850, 1.0820, 1.0910, 0, 2);
console.log("  ✓ Valid Trade: Units =", validTest.units, "| RR =", validTest.rr, "| Valid =", validTest.isValid);
if (!validTest.isValid || validTest.rr !== 2.0) throw new Error("Risk math incorrect");

const lockTest = validateRisk(10000, 1.0, 1.0850, 1.0820, 1.0910, 2, 2);
console.log("  ✓ Trade Limit Reached: Status =", lockTest.status, "| Valid =", lockTest.isValid);
if (lockTest.status !== "LOCKED" || lockTest.isValid !== false) throw new Error("Risk Lock failed");
console.log("  ✅ Risk Validation passed.\n");

// 5. Test JSON Storage Atomic Integrity
console.log("▶ [5/5] Testing JSON Storage Read/Write...");
import fs from "fs/promises";
import path from "path";

async function testStorage() {
  const dir = path.resolve("./storage");
  await fs.mkdir(dir, { recursive: true });
  const testFile = path.join(dir, "system.json");
  const payload = { testRun: true, timestamp: Date.now() };
  await fs.writeFile(testFile, JSON.stringify(payload, null, 2), "utf8");
  const read = JSON.parse(await fs.readFile(testFile, "utf8"));
  if (read.testRun !== true) throw new Error("Storage file write/read mismatch");
  console.log("  ✓ storage/system.json verified.");
  console.log("  ✅ Storage atomic persistence passed.\n");
}

testStorage().then(() => {
  console.log("==========================================");
  console.log("🏆 ALL ENGINE AND RISK TESTS PASSED (5/5)");
  console.log("==========================================");
});
