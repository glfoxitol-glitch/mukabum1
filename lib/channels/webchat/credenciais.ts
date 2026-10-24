/**
 * A CHAVE DO WIDGET e o TOKEN DO VISITANTE (spec 26 §4.1 e §4.2).
 *
 * As duas são aleatórias de 32 bytes em base64url, e têm naturezas opostas:
 *
 * - **chave do widget**: vai no HTML do site, então NÃO é segredo. Ela só
 *   identifica a sessão de canal; quem decide a organização é o servidor, ao
 *   resolvê-la. Não enumerável, para ninguém varrer as instalações.
 * - **token do visitante**: É segredo — é o que impede um visitante de ler a
 *   conversa de outro. Só o SHA-256 vai para o banco (anti-pattern 13 do
 *   CLAUDE.md), e a comparação é em tempo constante.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIXO_CHAVE = "wck_";
const PREFIXO_TOKEN = "wcv_";
const PREFIXO_VISITANTE = "v_";

function aleatorio(): string {
  return randomBytes(32).toString("base64url");
}

export function gerarChaveDoWidget(): string {
  return `${PREFIXO_CHAVE}${aleatorio()}`;
}

/** A chave tem forma fixa; o que não tem a forma nem chega ao banco. */
export function formaDeChaveValida(chave: string): boolean {
  return /^wck_[A-Za-z0-9_-]{43}$/.test(chave);
}

export interface NovoVisitante {
  /** Vai para `conversations.provider_conversation_id` — é a thread do canal. */
  visitanteId: string;
  /** Plaintext: entregue UMA vez ao navegador, nunca gravado. */
  token: string;
  /** O que o banco guarda. */
  tokenHash: string;
}

export function gerarVisitante(): NovoVisitante {
  const token = `${PREFIXO_TOKEN}${aleatorio()}`;
  return {
    visitanteId: `${PREFIXO_VISITANTE}${randomBytes(16).toString("hex")}`,
    token,
    tokenHash: hashDoToken(token),
  };
}

export function hashDoToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Compara o token apresentado com o hash gravado, em tempo constante. */
export function tokenConfere(tokenApresentado: string | null | undefined, hashGravado: string | null | undefined): boolean {
  if (!tokenApresentado || !hashGravado) return false;
  if (!/^wcv_[A-Za-z0-9_-]{43}$/.test(tokenApresentado)) return false;
  const a = Buffer.from(hashDoToken(tokenApresentado), "hex");
  const b = Buffer.from(hashGravado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Extrai o token do header `Authorization: Bearer …` — nunca da query string. */
export function tokenDoHeader(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  return m?.[1] ?? null;
}
