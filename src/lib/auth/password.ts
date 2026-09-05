import crypto from "crypto";

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const [salt, key] = storedHash.split(":");
      if (!salt || !key) return resolve(false);

      crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
        if (err) return resolve(false);
        const inputKey = derivedKey.toString("hex");
        const match = crypto.timingSafeEqual(
          Buffer.from(inputKey, "hex"),
          Buffer.from(key, "hex")
        );
        resolve(match);
      });
    } catch {
      resolve(false);
    }
  });
}
