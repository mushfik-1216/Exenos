import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),
  
  // Auth & Session
  AUTH_SECRET: z.string().default("exenos_default_secret_key_32_bytes_long_change_in_prod"),
  ENCRYPTION_SECRET: z.string().default("exenos_credential_aes_secret_key_32_char"),
  
  // Storage
  STORAGE_DRIVER: z.enum(["google-drive", "local"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  GOOGLE_DRIVE_CLIENT_EMAIL: z.string().optional(),
  GOOGLE_DRIVE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  
  // OmniRoute AI
  OMNIROUTE_API_KEY: z.string().optional(),
  OMNIROUTE_BASE_URL: z.string().default("https://api.omniroute.ai/v1"),
  OMNIROUTE_MODEL: z.string().default("default"),
  
  // Alpha Vantage
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) return validatedEnv;
  
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Environment configuration validation failed:", parsed.error.format());
    // Fall back to default development configuration in non-production
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV || "development",
    });
  }
  
  validatedEnv = parsed.data;
  return validatedEnv;
}
