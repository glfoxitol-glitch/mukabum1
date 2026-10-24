/**
 * O PEDIDO QUE A IA MONTA NA CONVERSA — a regra, sem banco (spec 28).
 *
 * O agente propõe itens ("2 fones e 1 carregador"); quem decide preço, estoque
 * e desconto é ESTA função, a partir do catálogo da organização. O modelo nunca
 * escreve um preço: ele manda `codigo` e `quantidade`, e o valor sai de
 * `catalog_products`. É a mesma postura de "não inventar preço" do agente, só
 * que garantida por construção em vez de por prompt.
 *
 * ─── Recusa com motivo, nunca pedido pela metade ─────────────────────────────
 *
 * Se UM item não fecha (código inexistente, sem estoque, moeda diferente), o
 * pedido inteiro volta recusado com a lista do que falhou. Montar só o que deu
 * certo criaria um pedido que o cliente não pediu — e a IA diria "fechado!"
 * sobre ele. Com a lista, ela pode responder "o carregador acabou; levo só os
 * fones?" e esperar o sim.
 *
 * ─── O piso do desconto ──────────────────────────────────────────────────────
 *
 * `custo_cents` existe para o desconto do agente ter piso (comentário da tabela
 * no baseline). Desconto que leva algum item abaixo do custo é recusado. Item
 * sem custo cadastrado não tem piso conhecido: aí vale o teto percentual que a
 * loja configurou, e sem teto não há desconto nenhum — "pode dar 10%" sobre um
 * número que ninguém sabe se cabe é o que a coluna existe para impedir.
 */

export interface ProdutoDoCatalogo {
  codigo: string;
  nome: string;
  preco_cents: number;
  moeda: string;
  custo_cents: number | null;
  controla_estoque: boolean;
  quantidade: number;
  ativo: boolean;
}

export interface ItemPedido {
  codigo: string;
  quantidade: number;
}

export interface LinhaDoPedido {
  codigo: string;
  nome: string;
  quantidade: number;
  preco_unitario_cents: number;
  subtotal_cents: number;
}

export type MotivoDoItem = "produto_inexistente" | "produto_inativo" | "sem_estoque" | "quantidade_invalida" | "moeda_diferente";

export interface ItemRecusado {
  codigo: string;
  motivo: MotivoDoItem;
  /** Em `sem_estoque`: quanto há. A IA oferece o que existe em vez de só dizer "não". */
  disponivel?: number;
}

export interface PoliticaDeDesconto {
  /** Teto em pontos-base (1000 = 10%) para itens SEM custo cadastrado. 0 = sem desconto. */
  tetoSemCustoBp: number;
}

export type ResultadoDoPedido =
  | {
      ok: true;
      linhas: LinhaDoPedido[];
      moeda: string;
      subtotal_cents: number;
      desconto_cents: number;
      total_cents: number;
    }
  | { ok: false; motivo: "itens_recusados"; itens: ItemRecusado[] }
  | { ok: false; motivo: "pedido_vazio" }
  | { ok: false; motivo: "desconto_acima_do_permitido"; maximo_bp: number };

export const QUANTIDADE_MAXIMA_POR_ITEM = 99;
export const ITENS_MAXIMOS = 30;

function normalizarCodigo(c: string): string {
  return c.trim().toUpperCase();
}

/**
 * Junta o mesmo produto pedido duas vezes ("1 fone… e mais 1 fone") numa linha
 * só: o estoque é conferido contra a SOMA, senão duas linhas de 3 passariam
 * num estoque de 4.
 */
function agrupar(itens: readonly ItemPedido[]): ItemPedido[] {
  const mapa = new Map<string, number>();
  for (const i of itens) {
    const c = normalizarCodigo(i.codigo);
    mapa.set(c, (mapa.get(c) ?? 0) + i.quantidade);
  }
  return [...mapa].map(([codigo, quantidade]) => ({ codigo, quantidade }));
}

/**
 * Monta o pedido. `descontoBp` é o desconto pedido sobre o subtotal, em
 * pontos-base (500 = 5%); 0 quando não há.
 */
export function montarPedido(
  itensPedidos: readonly ItemPedido[],
  catalogo: readonly ProdutoDoCatalogo[],
  descontoBp: number,
  politica: PoliticaDeDesconto,
): ResultadoDoPedido {
  const itens = agrupar(itensPedidos);
  if (itens.length === 0) return { ok: false, motivo: "pedido_vazio" };

  const porCodigo = new Map(catalogo.map((p) => [normalizarCodigo(p.codigo), p]));
  const recusados: ItemRecusado[] = [];
  const linhas: LinhaDoPedido[] = [];
  const produtos: ProdutoDoCatalogo[] = [];
  // A moeda do pedido é a do PRIMEIRO produto existente e ativo, mesmo que ele
  // seja recusado por estoque: senão um item em outra moeda, pedido depois de um
  // sem estoque, viraria a moeda do pedido e passaria sem recusa.
  const moedaDoPedido =
    itens.map((i) => porCodigo.get(i.codigo)).find((x): x is ProdutoDoCatalogo => !!x && x.ativo)?.moeda ?? null;

  if (itens.length > ITENS_MAXIMOS) {
    return { ok: false, motivo: "itens_recusados", itens: itens.map((i) => ({ codigo: i.codigo, motivo: "quantidade_invalida" })) };
  }

  for (const item of itens) {
    const p = porCodigo.get(item.codigo);
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1 || item.quantidade > QUANTIDADE_MAXIMA_POR_ITEM) {
      recusados.push({ codigo: item.codigo, motivo: "quantidade_invalida" });
      continue;
    }
    if (!p) {
      recusados.push({ codigo: item.codigo, motivo: "produto_inexistente" });
      continue;
    }
    if (!p.ativo) {
      recusados.push({ codigo: item.codigo, motivo: "produto_inativo" });
      continue;
    }
    if (p.controla_estoque && p.quantidade < item.quantidade) {
      recusados.push({ codigo: item.codigo, motivo: "sem_estoque", disponivel: Math.max(0, p.quantidade) });
      continue;
    }
    if (p.moeda !== moedaDoPedido) {
      recusados.push({ codigo: item.codigo, motivo: "moeda_diferente" });
      continue;
    }
    produtos.push(p);
    linhas.push({
      codigo: p.codigo,
      nome: p.nome,
      quantidade: item.quantidade,
      preco_unitario_cents: p.preco_cents,
      subtotal_cents: p.preco_cents * item.quantidade,
    });
  }

  if (recusados.length > 0) return { ok: false, motivo: "itens_recusados", itens: recusados };

  const subtotal = linhas.reduce((s, l) => s + l.subtotal_cents, 0);
  const maximoBp = descontoMaximoBp(linhas, produtos, politica);
  const pedidoBp = Math.max(0, Math.trunc(descontoBp));
  if (pedidoBp > maximoBp) return { ok: false, motivo: "desconto_acima_do_permitido", maximo_bp: maximoBp };

  // Arredonda o desconto para BAIXO: o centavo de diferença fica com a loja,
  // nunca abaixo do piso que acabou de ser conferido.
  const desconto = Math.floor((subtotal * pedidoBp) / 10000);
  return {
    ok: true,
    linhas,
    moeda: moedaDoPedido as string,
    subtotal_cents: subtotal,
    desconto_cents: desconto,
    total_cents: subtotal - desconto,
  };
}

/**
 * O maior desconto, em pontos-base, que não leva NENHUM item abaixo do custo e
 * que respeita o teto dos itens sem custo. O mais restritivo dos itens vale
 * para o pedido inteiro — o desconto é um percentual só sobre o subtotal.
 */
export function descontoMaximoBp(
  linhas: readonly LinhaDoPedido[],
  produtos: readonly ProdutoDoCatalogo[],
  politica: PoliticaDeDesconto,
): number {
  let maximo = 10000;
  linhas.forEach((l, i) => {
    const p = produtos[i];
    if (!p || l.preco_unitario_cents <= 0) return;
    if (p.custo_cents === null) {
      maximo = Math.min(maximo, Math.max(0, Math.trunc(politica.tetoSemCustoBp)));
      return;
    }
    const margem = l.preco_unitario_cents - p.custo_cents;
    const bp = margem <= 0 ? 0 : Math.floor((margem * 10000) / l.preco_unitario_cents);
    maximo = Math.min(maximo, bp);
  });
  return maximo;
}
