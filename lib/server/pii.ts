// 학번·이름 암호화 (동의 화면: "학번·이름 암호화되어 저장됩니다").
// PARTICIPANT_KEY(임의의 긴 비밀 문자열)에서 AES-256-GCM 키를 만든다. 키가 없으면 암호화할 수 없으므로 저장하지 않는다.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export interface EncryptedBlob {
  alg: "aes-256-gcm";
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
}

function key(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptJson(value: unknown, secret: string): EncryptedBlob {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { alg: "aes-256-gcm", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

export function decryptJson<T>(blob: EncryptedBlob, secret: string): T {
  const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(blob.iv, "base64"));
  decipher.setAuthTag(Buffer.from(blob.tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(blob.data, "base64")), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}
