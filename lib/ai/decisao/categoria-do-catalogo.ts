/**
 * "QUAL CATEGORIA DO CATÁLOGO O CLIENTE PEDIU?" — a pergunta ao Jev, sem banco
 * (spec 27 §2, tarefa `categoria_do_catalogo`).
 *
 * ═══ AS OPÇÕES SÃO DA EMPRESA, NUNCA DO CÓDIGO ═══
 *
 * O CRM atende lojas de qualquer ramo, restaurantes e prestadores de serviço
 * que também vendem produtos. Nenhuma lista de categorias cabe em todos. Por
 * isso as escolhas saem das categorias que a PRÓPRIA organização cadastrou em
 * `catalog_products.categoria`, lidas a cada pergunta: a loja que cria uma
 * categoria nova amanhã já é entendida amanhã, sem deploy. Este arquivo
 * não contém o nome de nenhuma categoria, e o teste reprova se passar a conter.
 *
 * ═══ AS CHAVES SÃO NOSSAS, OS TEXTOS SÃO DELA ═══
 *
 * A categoria vem digitada pelo dono da loja, com qualquer caractere. Usá-la
 * como chave da pergunta exporia a chamada a um nome que o fornecedor recuse —
 * e uma pergunta malformada derruba a chamada inteira (medido, ver
 * `roteador.ts`). A chave é `cat_<n>`; o nome da categoria vai no critério, e
 * `categoriaDaEscolha` traduz de volta.
 *
 * ═══ QUANDO NÃO HÁ O QUE PERGUNTAR ═══
 *
 * Menos de duas categorias não é escolha, e mais do que o fornecedor aceita
 * derrubaria a chamada. Nos dois casos a função devolve o MOTIVO, para o turno
 * registrar `skipped` com razão (invariante 4 da doutrina de canal) — e quem
 * busca o produto segue sem filtro, como hoje.
 */
import type { Pergunta } from "./cliente";

/** O fornecedor aceita até 255 opções; uma é o "nenhuma". */
export const CATEGORIAS_NO_MAXIMO = 254;

const NENHUMA = "none";

const INSTRUCAO =
  "Qual categoria do catálogo da loja a ÚLTIMA mensagem do cliente pede? Escolha nenhuma se ele não pede produto, pede produto sem dizer de que tipo, ou pede de várias categorias ao mesmo tempo.";

export interface LinhaDoCatalogo {
  categoria: string | null;
  ativo: boolean;
}

/** "  Linha Infantil " e "linha infantil" são grafias da mesma categoria? A chave diz. */
function chave(categoria: string): string {
  return categoria
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * As categorias perguntáveis: só de produto ATIVO (categoria só de produto
 * desligado levaria o cliente a uma prateleira vazia), agrupando grafias da
 * mesma categoria e ficando com a grafia mais usada. Ordem: mais produtos
 * primeiro, empate pelo nome — determinística, para a pergunta ser a mesma a
 * cada mensagem.
 */
export function categoriasDoCatalogo(linhas: readonly LinhaDoCatalogo[]): string[] {
  const grupos = new Map<string, { total: number; grafias: Map<string, number> }>();
  for (const l of linhas) {
    if (!l.ativo || !l.categoria) continue;
    const exibida = l.categoria.trim().replace(/\s+/g, " ");
    const k = chave(exibida);
    if (!k) continue;
    const g = grupos.get(k) ?? { total: 0, grafias: new Map<string, number>() };
    g.total += 1;
    g.grafias.set(exibida, (g.grafias.get(exibida) ?? 0) + 1);
    grupos.set(k, g);
  }
  return [...grupos.values()]
    .map((g) => ({
      total: g.total,
      nome: [...g.grafias].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))[0]![0],
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"))
    .map((c) => c.nome);
}

export type PerguntaDaCategoria =
  | { ok: true; pergunta: Pergunta; opcoes: Record<string, string> }
  | { ok: false; motivo: "categorias_insuficientes" | "opcoes_demais" };

export function perguntaDaCategoria(categorias: readonly string[]): PerguntaDaCategoria {
  if (categorias.length < 2) return { ok: false, motivo: "categorias_insuficientes" };
  if (categorias.length > CATEGORIAS_NO_MAXIMO) return { ok: false, motivo: "opcoes_demais" };
  const opcoes: Record<string, string> = {};
  const criterios: Record<string, string> = {};
  categorias.forEach((c, i) => {
    const id = `cat_${i + 1}`;
    opcoes[id] = c;
    criterios[id] = `O cliente pede produtos da categoria "${c}".`;
  });
  criterios[NENHUMA] = "Não pede produto, não diz o tipo, ou pede de mais de uma categoria.";
  return { ok: true, pergunta: { tipo: "choice", instrucao: INSTRUCAO, criterios }, opcoes };
}

/**
 * A categoria que o Jev escolheu, ou `null`: "nenhuma", uma chave que não foi
 * perguntada, ou confiança abaixo do mínimo. `null` não é erro — é buscar sem
 * filtro, que é o comportamento de hoje.
 */
export function categoriaDaEscolha(
  escolha: string,
  confianca: number,
  opcoes: Readonly<Record<string, string>>,
  confiancaMinima: number,
): string | null {
  if (escolha === NENHUMA || confianca < confiancaMinima) return null;
  return Object.prototype.hasOwnProperty.call(opcoes, escolha) ? (opcoes[escolha] ?? null) : null;
}
