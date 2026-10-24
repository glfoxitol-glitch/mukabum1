/**
 * O AVISO DE VENDA PARA O LOJISTA — o texto, sem banco (spec 28 §4).
 *
 * Vai para o número da equipe pela ação `notify_team` (que já existe e nunca
 * escreve na conversa do cliente), para a notificação no celular e para o
 * resumo do dia. O lojista lê na tela de bloqueio do celular, então:
 *
 *  - a primeira linha diz o que aconteceu e quanto vale;
 *  - endereço e horário entram, porque é com eles que a entrega sai;
 *  - telefone do cliente NÃO entra: quem precisa dele abre o pedido pelo link,
 *    logado. A tela de bloqueio é lida por qualquer um perto do celular;
 *  - nenhum texto nomeia a loja (uma imagem serve todas as marcas).
 */
import type { LinhaDoPedido } from "./montar";

export function formatarDinheiro(cents: number, moeda = "BRL"): string {
  try {
    return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: moeda });
  } catch {
    return `${moeda} ${(cents / 100).toFixed(2)}`;
  }
}

export interface EntregaAgendada {
  /** Já no fuso da loja, pronto para ler: "amanhã, 14h–16h" ou "sex 25/10, 9h–11h". */
  quando: string;
  endereco: string;
}

export interface PedidoParaAviso {
  linhas: readonly Pick<LinhaDoPedido, "nome" | "quantidade">[];
  total_cents: number;
  moeda: string;
  /** Primeiro nome só. */
  cliente: string;
  pagamento: string | null;
  entrega: EntregaAgendada | null;
  link: string | null;
}

function primeiroNome(nome: string): string {
  const n = nome.trim().split(/\s+/)[0] ?? "";
  return n || "Cliente";
}

function itens(linhas: PedidoParaAviso["linhas"]): string {
  return linhas.map((l) => `${l.quantidade}× ${l.nome}`).join(", ");
}

export function avisoDeVenda(p: PedidoParaAviso): string {
  const linhas = [
    `🛒 Venda fechada pela IA: ${formatarDinheiro(p.total_cents, p.moeda)}`,
    `Itens: ${itens(p.linhas)}`,
    `Cliente: ${primeiroNome(p.cliente)}`,
  ];
  if (p.pagamento) linhas.push(`Pagamento: ${p.pagamento}`);
  linhas.push(p.entrega ? `🚚 Entrega: ${p.entrega.quando} — ${p.entrega.endereco}` : "🚚 Entrega: ainda não agendada");
  if (p.link) linhas.push(`Abrir pedido: ${p.link}`);
  return linhas.join("\n");
}

export interface PedidoDoDia {
  total_cents: number;
  moeda: string;
}

/**
 * "Hoje: 5 vendas, R$ 4.800,00. Amanhã: 3 entregas." Moedas diferentes não se
 * somam: cada uma sai com o seu total, em vez de um número que não existe.
 */
export function resumoDoDia(vendas: readonly PedidoDoDia[], entregasAmanha: number): string {
  if (vendas.length === 0 && entregasAmanha === 0) return "Hoje: nenhuma venda. Amanhã: nenhuma entrega agendada.";
  const porMoeda = new Map<string, number>();
  for (const v of vendas) porMoeda.set(v.moeda, (porMoeda.get(v.moeda) ?? 0) + v.total_cents);
  const totais = [...porMoeda].map(([m, c]) => formatarDinheiro(c, m)).join(" + ");
  const vendasTxt =
    vendas.length === 0 ? "nenhuma venda" : `${vendas.length} ${vendas.length === 1 ? "venda" : "vendas"}, ${totais}`;
  const entregasTxt =
    entregasAmanha === 0
      ? "nenhuma entrega agendada"
      : `${entregasAmanha} ${entregasAmanha === 1 ? "entrega" : "entregas"}`;
  return `Hoje: ${vendasTxt}. Amanhã: ${entregasTxt}.`;
}
