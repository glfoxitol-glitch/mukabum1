/**
 * "O CLIENTE ACEITOU O QUE O AGENTE PROPÔS?" — as regras, sem banco nem rede
 * (spec 27 §2, tarefa `confirmacao_do_cliente`). Vale para qualquer ramo: o
 * produto da loja, o horário da barbearia, o pedido da pizzaria.
 *
 * ═══ CASCATA: A REGRA PRIMEIRO, O JEV SÓ ONDE ELA DISSE NÃO ═══
 *
 * `aceiteExplicito` reconhece o aceite curto e inequívoco ("sim", "fechado",
 * "pode ser") sem IA. O Jev só é perguntado onde ela não reconheceu ("manda
 * esse mesmo então", "bora, separa pra mim") — a mesma estrutura dos pedidos de
 * pessoa e de parar (`./pedidos.ts`). A regra é estreita de propósito: errar
 * para o lado do NÃO custa uma pergunta a mais ao cliente; errar para o SIM
 * avança um pedido que ninguém fez.
 *
 * ═══ ACEITE COM CONDIÇÃO NÃO É ACEITE ═══
 *
 * "Sim, mas só depois do dia 10", "ok, vou ver com minha esposa", "pode ser,
 * quanto fica o frete?" — tudo isso é NÃO para esta pergunta. A condição muda a
 * proposta, e quem trata é o agente conversando, não a confirmação.
 *
 * ═══ O QUE ELA NUNCA FAZ ═══
 *
 * Não marca horário, não cria pedido, não cobra. No máximo diz "pode avançar o
 * card no funil": quem marca é a ferramenta da agenda, quem cria o pedido é a
 * do pedido, e quem paga é a pessoa. E só vale para uma proposta VIGENTE: um
 * "sim" três dias depois não confirma o horário de ontem.
 *
 * ═══ O QUE SAI PARA O FORNECEDOR ═══
 *
 * O resumo da proposta é escrito pelo CRM a partir de dados da empresa
 * ("1× <produto> por <valor>", "terça, 14h–16h") — nunca nome, telefone ou
 * endereço do cliente — e a resposta do cliente, pelo `scrubMessage`, como as
 * outras tarefas. Por levar a proposta junto, o alcance é `conversa`: nunca
 * começa sozinha e exige o aceite da empresa para a conversa.
 */
import type { Pergunta } from "./cliente";

export const TIPOS_DE_PROPOSTA = ["produto", "horario", "pedido"] as const;
export type TipoDeProposta = (typeof TIPOS_DE_PROPOSTA)[number];

export interface PropostaDoAgente {
  tipo: TipoDeProposta;
  /** Escrito pelo CRM, sem dado do cliente. */
  resumo: string;
  feitaEm: Date;
}

/** Um aceite vale para a proposta das últimas 2 horas. Depois disso, o agente propõe de novo. */
export const JANELA_DA_PROPOSTA_MIN = 120;

/**
 * Probabilidade mínima de "sim" para o Jev dizer que aceitou. Alto de
 * propósito (ver o cabeçalho: errar para o sim avança um pedido que ninguém
 * fez). Calibrar com as observações reais antes de deixar decidir.
 */
export const CORTE_DA_CONFIRMACAO = 0.9;

const ROTULO_DO_TIPO: Record<TipoDeProposta, string> = {
  produto: "o produto",
  horario: "o horário",
  pedido: "o pedido",
};

/** A proposta ainda vale? Proposta do futuro (relógio torto) não vale. */
export function propostaVigente(proposta: Pick<PropostaDoAgente, "feitaEm">, agora: Date): boolean {
  const idadeMs = agora.getTime() - proposta.feitaEm.getTime();
  return idadeMs >= 0 && idadeMs <= JANELA_DA_PROPOSTA_MIN * 60_000;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Frases de aceite que a regra reconhece SOZINHAS. A mensagem inteira tem de
 * ser uma delas (ou elas repetidas: "sim sim", "pode pode"), com pontuação e
 * emoji ignorados — menos o ponto de interrogação, que faz dela uma pergunta.
 * Qualquer palavra a mais devolve para o Jev.
 */
const ACEITES = new Set([
  "sim",
  "s",
  "ss",
  "isso",
  "isso mesmo",
  "pode",
  "pode ser",
  "pode sim",
  "pode fechar",
  "fechado",
  "fechou",
  "fecha",
  "ok",
  "okay",
  "certo",
  "combinado",
  "beleza",
  "blz",
  "quero",
  "quero sim",
  "vou querer",
  "confirmo",
  "confirmado",
  "perfeito",
  "otimo",
  "bora",
  "manda",
  "pode mandar",
  "esse mesmo",
  "esse",
  "essa",
  "esse horario",
  "esse horario mesmo",
  "fechado entao",
  "sim por favor",
  "si",
  "claro",
]);

export function aceiteExplicito(texto: string): boolean {
  // "sim?" é pergunta, não aceite: a pontuação é descartada logo abaixo, então
  // o ponto de interrogação precisa ser lido ANTES (achado do teste).
  if (/[?¿]/.test(texto)) return false;
  const n = normalizar(texto);
  if (!n) return false;
  if (ACEITES.has(n)) return true;
  // "sim sim", "ok ok", "pode pode": a mesma frase repetida.
  const palavras = n.split(" ");
  const metade = palavras.length / 2;
  if (Number.isInteger(metade) && metade > 0) {
    const a = palavras.slice(0, metade).join(" ");
    if (a === palavras.slice(metade).join(" ") && ACEITES.has(a)) return true;
  }
  return false;
}

/** A pergunta ao Jev, só para onde a regra disse não. */
export function perguntaDeConfirmacao(proposta: Pick<PropostaDoAgente, "tipo" | "resumo">): Pergunta {
  const oQue = ROTULO_DO_TIPO[proposta.tipo];
  return {
    tipo: "noul",
    instrucao: `O assistente propôs ${oQue}: "${proposta.resumo.trim().slice(0, 300)}". A ÚLTIMA mensagem do cliente ACEITA essa proposta, sem condição, em qualquer idioma?`,
    criterios: {
      true: `Aceita ${oQue} como foi proposto: diz que quer, que pode, que fecha, que confirma ou pede para seguir.`,
      false:
        "Qualquer outra coisa: recusa, dúvida, pergunta, pede outra opção, pede tempo para pensar, ou aceita com condição (outro dia, outro preço, depois de alguma coisa).",
    },
  };
}

export type VereditoDaConfirmacao = "aceitou" | "nao_aceitou";

/**
 * O veredito do turno. A regra reconheceu: aceitou, sem perguntar. Senão, o
 * Jev, com o corte alto; sem resposta dele (`null`), não aceitou — a ausência
 * nunca vira sim.
 */
export function vereditoDaConfirmacao(input: {
  proposta: Pick<PropostaDoAgente, "feitaEm"> | null;
  agora: Date;
  texto: string;
  probabilidadeDoJev: number | null;
}): { veredito: VereditoDaConfirmacao; por: "regra" | "jev" | "sem_proposta" | "proposta_vencida" | "sem_resposta_do_jev" } {
  if (!input.proposta) return { veredito: "nao_aceitou", por: "sem_proposta" };
  if (!propostaVigente(input.proposta, input.agora)) return { veredito: "nao_aceitou", por: "proposta_vencida" };
  if (aceiteExplicito(input.texto)) return { veredito: "aceitou", por: "regra" };
  if (input.probabilidadeDoJev === null || !Number.isFinite(input.probabilidadeDoJev))
    return { veredito: "nao_aceitou", por: "sem_resposta_do_jev" };
  return { veredito: input.probabilidadeDoJev >= CORTE_DA_CONFIRMACAO ? "aceitou" : "nao_aceitou", por: "jev" };
}

/** A regra já decidiu? Então a pergunta ao Jev nem sai (cascata). */
export function precisaPerguntarAoJev(proposta: Pick<PropostaDoAgente, "feitaEm"> | null, agora: Date, texto: string): boolean {
  return proposta !== null && propostaVigente(proposta, agora) && !aceiteExplicito(texto);
}
