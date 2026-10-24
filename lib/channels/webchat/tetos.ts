/**
 * OS TETOS DO CHAT DO SITE (spec 26 §9.3).
 *
 * O chat é uma porta pública para o agente de IA da empresa. Sem teto, um robô
 * que abra mil conversas por hora gasta o orçamento de IA do mês numa tarde.
 * Os padrões foram escolhidos para não atrapalhar nenhum negócio real:
 *
 *  - 100 conversas NOVAS por dia por empresa: cobre com folga um pequeno ou
 *    médio negócio; um ataque para no centésimo visitante.
 *  - 40 mensagens do visitante por conversa: conversa real raramente passa de
 *    20; dali em diante o chat oferece continuar pelo WhatsApp.
 *  - 10 mensagens por minuto por visitante: ritmo humano.
 *  - 2 tentativas de recuperação pelo WhatsApp a cada 7 dias por contato.
 *
 * Cada teto é ajustável por organização (knob), mas dentro de um PISO e um
 * TETO: zero desligaria o chat em silêncio, e "infinito" desarmaria a proteção.
 * Quem estoura vira aviso na Central — a decisão abaixo devolve o MOTIVO para
 * isso ser possível, nunca só `false`.
 */

export interface TetosDoChat {
  conversasNovasPorDia: number;
  mensagensPorConversa: number;
  mensagensPorMinuto: number;
  tentativasDeRecuperacao: number;
  janelaDeRecuperacaoDias: number;
}

export const TETOS_PADRAO: TetosDoChat = {
  conversasNovasPorDia: 100,
  mensagensPorConversa: 40,
  mensagensPorMinuto: 10,
  tentativasDeRecuperacao: 2,
  janelaDeRecuperacaoDias: 7,
};

const LIMITES: Record<keyof TetosDoChat, { min: number; max: number }> = {
  conversasNovasPorDia: { min: 1, max: 5000 },
  mensagensPorConversa: { min: 5, max: 500 },
  mensagensPorMinuto: { min: 2, max: 60 },
  tentativasDeRecuperacao: { min: 0, max: 3 },
  janelaDeRecuperacaoDias: { min: 1, max: 60 },
};

/**
 * Junta o que a organização configurou com o padrão. Valor ausente, não
 * numérico ou fora da faixa NÃO derruba nada: cai no padrão (ausente/inválido)
 * ou é trazido para dentro da faixa (fora dela).
 */
export function resolverTetos(configurado: Partial<Record<keyof TetosDoChat, unknown>> | null | undefined): TetosDoChat {
  const resultado = { ...TETOS_PADRAO };
  if (!configurado) return resultado;
  for (const chave of Object.keys(LIMITES) as (keyof TetosDoChat)[]) {
    const bruto = configurado[chave];
    const n = typeof bruto === "string" && bruto.trim() !== "" ? Number(bruto) : bruto;
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    const { min, max } = LIMITES[chave];
    resultado[chave] = Math.min(max, Math.max(min, Math.trunc(n)));
  }
  return resultado;
}

export type MotivoDeRecusa =
  | "teto_diario_de_conversas"
  | "teto_de_mensagens_da_conversa"
  | "ritmo_do_visitante";

export type Decisao = { pode: true } | { pode: false; motivo: MotivoDeRecusa };

/** Pode abrir mais uma conversa nova hoje? */
export function podeAbrirConversa(conversasNovasHoje: number, tetos: TetosDoChat): Decisao {
  return conversasNovasHoje < tetos.conversasNovasPorDia
    ? { pode: true }
    : { pode: false, motivo: "teto_diario_de_conversas" };
}

/** O visitante pode mandar mais uma mensagem nesta conversa? */
export function podeMandarMensagem(
  mensagensDoVisitanteNaConversa: number,
  mensagensNoUltimoMinuto: number,
  tetos: TetosDoChat,
): Decisao {
  if (mensagensDoVisitanteNaConversa >= tetos.mensagensPorConversa)
    return { pode: false, motivo: "teto_de_mensagens_da_conversa" };
  if (mensagensNoUltimoMinuto >= tetos.mensagensPorMinuto) return { pode: false, motivo: "ritmo_do_visitante" };
  return { pode: true };
}

/**
 * A recuperação pelo WhatsApp (§9.2) pode tentar de novo? Exige consentimento
 * e respeita o número de tentativas dentro da janela.
 */
export function podeTentarRecuperacao(input: {
  consentiu: boolean;
  bloqueado: boolean;
  tentativasNaJanela: number;
  tetos: TetosDoChat;
}): { pode: true } | { pode: false; motivo: "sem_consentimento" | "contato_bloqueado" | "tentativas_esgotadas" } {
  if (!input.consentiu) return { pode: false, motivo: "sem_consentimento" };
  if (input.bloqueado) return { pode: false, motivo: "contato_bloqueado" };
  if (input.tentativasNaJanela >= input.tetos.tentativasDeRecuperacao)
    return { pode: false, motivo: "tentativas_esgotadas" };
  return { pode: true };
}
