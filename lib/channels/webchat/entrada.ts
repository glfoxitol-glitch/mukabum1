/**
 * O QUE O VISITANTE DO SITE PODE MANDAR — validação de todo input externo do
 * chat do site (spec 26 §4.3 e §9.1).
 *
 * ─── O WhatsApp é obrigatório, e o país não pode ser adivinhado errado ───────
 *
 * O visitante digita o número como fala: `(11) 98765-4321`. `canonicalPhoneBR`
 * recebe isso SEM o código do país e devolve `+11987654321` — um número
 * americano. Gravado assim, o contato nunca casaria com quem já falou pelo
 * WhatsApp, e a recuperação (§9.2) mandaria mensagem para os EUA. Por isso o
 * número com 10 ou 11 dígitos (DDD + número) ganha o `55` ANTES de ir ao
 * normalizador. Quem é de fora digita o `+` e o código do país, e passa como veio.
 *
 * ─── Consentimento é dado, não enfeite ────────────────────────────────────────
 *
 * `consentimento_whatsapp` decide se a IA pode chamar o visitante pelo WhatsApp
 * depois (§9.2). O padrão é `false`, e só o booleano `true` liga — um `"on"` de
 * formulário ou um `1` são recusados, para que um cliente mal escrito não
 * consinta por engano em nome do visitante.
 */
import { z } from "zod";

import { canonicalPhoneBR } from "@/lib/channels/phone-variants";

export const TEXTO_MAXIMO = 2000;
export const NOME_MAXIMO = 80;

/**
 * Normaliza o WhatsApp digitado. Devolve `null` quando não dá para confiar no
 * número (curto, longo ou sem DDD) — e o formulário pede de novo, em vez de
 * gravar um contato que ninguém vai conseguir chamar.
 */
export function normalizarWhatsappDoVisitante(bruto: string): string | null {
  const texto = bruto.trim();
  if (!texto) return null;
  const internacional = texto.startsWith("+");
  const digitos = texto.replace(/\D/g, "");

  let comPais: string;
  if (internacional) {
    comPais = digitos;
  } else if (digitos.length === 10 || digitos.length === 11) {
    comPais = `55${digitos}`;
  } else if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    comPais = digitos;
  } else {
    return null;
  }

  // E.164 tem no máximo 15 dígitos; menos de 10 não é telefone de ninguém.
  if (comPais.length < 10 || comPais.length > 15) return null;
  if (comPais.startsWith("55")) {
    const ddd = Number(comPais.slice(2, 4));
    if (ddd < 11 || ddd > 99) return null;
  }
  return canonicalPhoneBR(`+${comPais}`);
}

const nome = z
  .string()
  .trim()
  .max(NOME_MAXIMO)
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional();

const whatsapp = z.string().transform((v, ctx) => {
  const normalizado = normalizarWhatsappDoVisitante(v);
  if (!normalizado) {
    ctx.addIssue({ code: "custom", message: "whatsapp_invalido" });
    return z.NEVER;
  }
  return normalizado;
});

const texto = z.string().trim().min(1).max(TEXTO_MAXIMO);

/** A primeira mensagem: identifica o visitante (§9.1) e já traz o texto. */
export const primeiraMensagemSchema = z.object({
  nome,
  whatsapp,
  consentimento_whatsapp: z.boolean().optional().default(false),
  texto,
  /** Página onde o visitante estava — vai para a memória do agente, nunca decide nada. */
  pagina: z.string().trim().max(500).optional(),
});

/** Mensagens seguintes: o visitante já foi identificado pelo token. */
export const mensagemSeguinteSchema = z.object({
  texto,
});

export type PrimeiraMensagem = z.infer<typeof primeiraMensagemSchema>;
export type MensagemSeguinte = z.infer<typeof mensagemSeguinteSchema>;
