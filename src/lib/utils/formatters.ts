import { SupportedSymbol } from "@/types/market";
import { SUPPORTED_SYMBOLS } from "@/config/symbols";

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = currencyFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatterCache.set(currency, formatter);
  }
  return formatter;
}

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatPrice(price: number, symbol?: SupportedSymbol): string {
  if (price === undefined || price === null || isNaN(price)) return "--";
  const decimals = symbol ? SUPPORTED_SYMBOLS[symbol]?.decimals ?? 4 : 4;
  return price.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  if (value === undefined || value === null || isNaN(value)) return "--%";
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCurrency(value: number, currency: string = "USD"): string {
  if (value === undefined || value === null || isNaN(value)) return "--";
  return getCurrencyFormatter(currency).format(value);
}

export function formatDateTime(timestamp: number | string | Date): string {
  const date = typeof timestamp === "number" 
    ? new Date(timestamp > 1e11 ? timestamp : timestamp * 1000)
    : new Date(timestamp);
  
  if (isNaN(date.getTime())) return "--";
  return dateTimeFormatter.format(date);
}

export function formatTime(timestamp: number | string | Date): string {
  const date = typeof timestamp === "number" 
    ? new Date(timestamp > 1e11 ? timestamp : timestamp * 1000)
    : new Date(timestamp);
  
  if (isNaN(date.getTime())) return "--:--";
  return timeFormatter.format(date);
}
