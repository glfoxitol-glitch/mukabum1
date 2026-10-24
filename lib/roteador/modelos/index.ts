/**
 * O CATÁLOGO DE MODELOS DE ROTEADOR — a face do módulo.
 *
 * Quem consome (o assistente de configuração, o teste) importa daqui e nunca do
 * arquivo do nicho: acrescentar um nicho é acrescentar uma lista a
 * `MODELOS_DE_ROTEADOR`, sem tocar em consumidor. Mesmo desenho de
 * `lib/followup/modelos/`.
 */
import type { RouterMember } from "@/lib/agent-engine/agent/router-config";

import { MODELOS_DE_COMIDA } from "./comida";
import { MODELOS_DE_LOJA } from "./loja";
import { MODELOS_DE_SERVICOS } from "./servicos";
import type { ModeloDeRoteador, NichoDeRoteador, Papel } from "./tipos";

export type { IntencaoDoModelo, ModeloDeRoteador, NichoDeRoteador, Papel } from "./tipos";
export { PAPEIS, NICHOS_DE_ROTEADOR } from "./tipos";

export const MODELOS_DE_ROTEADOR: readonly ModeloDeRoteador[] = [
  ...MODELOS_DE_LOJA,
  ...MODELOS_DE_SERVICOS,
  ...MODELOS_DE_COMIDA,
];

/** `undefined` — e não um erro — para a rota devolver 404 com a própria mensagem. */
export function modeloDeRoteadorPorId(id: string): ModeloDeRoteador | undefined {
  return MODELOS_DE_ROTEADOR.find((m) => m.id === id);
}

export function modelosDeRoteadorDoNicho(nicho: NichoDeRoteador): ModeloDeRoteador[] {
  return MODELOS_DE_ROTEADOR.filter((m) => m.nicho === nicho);
}

/**
 * Os membros do roteador a partir do modelo e de quem atende cada papel.
 *
 * Papel sem agente é ERRO, não intenção omitida: um roteador sem a intenção
 * de suporte mandaria o cliente com problema para o vendedor, que é a
 * fronteira que o modelo existe para separar. A empresa pequena liga todos os
 * papéis ao mesmo agente — isso é escolha dela, e não uma lacuna.
 */
export function membrosDoModelo(
  modelo: ModeloDeRoteador,
  agentePorPapel: Partial<Record<Papel, string>>,
): { ok: true; membros: RouterMember[] } | { ok: false; papeisSemAgente: Papel[] } {
  const faltando = [...new Set(modelo.intencoes.map((i) => i.papel))].filter((p) => !agentePorPapel[p]);
  if (faltando.length > 0) return { ok: false, papeisSemAgente: faltando };
  return {
    ok: true,
    membros: modelo.intencoes.map((i) => ({
      agentId: agentePorPapel[i.papel] as string,
      intentName: i.nome,
      intentDescription: i.descricao,
      examples: [...i.exemplos],
    })),
  };
}
