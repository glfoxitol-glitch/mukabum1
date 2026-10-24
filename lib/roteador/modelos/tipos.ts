/**
 * O FORMATO DE UM MODELO DE ROTEADOR — as intenções prontas de um nicho.
 *
 * Um modelo NÃO é um roteador: não tem agente, número nem funil, porque esses
 * ids são da organização e não existem no código. Cada intenção diz o PAPEL do
 * agente que deve atendê-la (`papel`), e quem instala o modelo (o assistente de
 * configuração, spec 27) liga o papel a um agente real da empresa pela rota que
 * já grava membros (`PUT /api/v1/ai/routers/[id]/members`), com a mesma
 * autorização e o mesmo audit. Não há caminho de escrita próprio.
 *
 * Os limites abaixo são os da rota e os da pergunta do Jev. Um modelo que não
 * cabe neles seria recusado na instalação, longe de quem escreveu o texto — por
 * isso `modelos.test.ts` os confere aqui.
 */

/** `intent_name` na rota de membros: `z.string().min(1).max(120)`. */
export const NOME_DA_INTENCAO_MAXIMO = 120;
/** `intent_description` na rota de membros: `z.string().min(1).max(2000)`. */
export const DESCRICAO_DA_INTENCAO_MAXIMO = 2000;

/**
 * O papel do agente que atende a intenção. Duas intenções com o mesmo papel vão
 * para o mesmo agente; a empresa pequena liga todos os papéis a um agente só.
 */
export const PAPEIS = ["vendas", "agenda", "entrega", "suporte"] as const;
export type Papel = (typeof PAPEIS)[number];

export const NICHOS_DE_ROTEADOR = ["loja", "servicos", "comida"] as const;
export type NichoDeRoteador = (typeof NICHOS_DE_ROTEADOR)[number];

export interface IntencaoDoModelo {
  /** Vai para `intent_name`. Minúsculas e `_`: é o que o Jev e o classificador devolvem. */
  nome: string;
  /** Vai para `intent_description`: o critério que o Jev e a IA de sempre leem. */
  descricao: string;
  /** Vai para `examples`: frases como o cliente escreve, não como a empresa fala. */
  exemplos: readonly string[];
  papel: Papel;
}

export interface ModeloDeRoteador {
  id: string;
  nicho: NichoDeRoteador;
  /** Para a tela do assistente. */
  rotulo: string;
  oQueFaz: string;
  intencoes: readonly IntencaoDoModelo[];
}
