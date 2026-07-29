import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/**
 * 접근 토큰 유틸.
 * - 순차 ID 대신 암호학적으로 안전한 고엔트로피 토큰을 발급한다.
 * - DB 에는 원문이 아니라 HMAC 해시를 저장한다.
 * - 소유자 토큰과 공유 토큰은 접두어로 구분한다.
 */
const SECRET = process.env.TOKEN_HASH_SECRET ?? "dev-insecure-secret-change-me";

export type TokenKind = "owner" | "share" | "order";

const PREFIX: Record<TokenKind, string> = {
  owner: "own",
  share: "shr",
  order: "ord",
};

export function generateToken(kind: TokenKind): string {
  const raw = randomBytes(24).toString("base64url");
  return `${PREFIX[kind]}_${raw}`;
}

export function hashToken(token: string): string {
  return createHmac("sha256", SECRET).update(token).digest("hex");
}

export function verifyToken(token: string, hash: string): boolean {
  const computed = Buffer.from(hashToken(token));
  const expected = Buffer.from(hash);
  if (computed.length !== expected.length) return false;
  return timingSafeEqual(computed, expected);
}

/** 로그/분석에 남기지 않도록 토큰을 마스킹 */
export function maskToken(token: string): string {
  const [prefix] = token.split("_");
  return `${prefix}_***`;
}
