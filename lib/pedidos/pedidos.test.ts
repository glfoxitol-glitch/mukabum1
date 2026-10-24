/**
 * O PEDIDO DA IA E O AVISO AO LOJISTA — as regras da spec 28, sem banco.
 *
 *  1. o preço sai do catálogo, nunca do pedido;
 *  2. um item que não fecha recusa o pedido inteiro, com o motivo de cada um;
 *  3. o mesmo produto pedido duas vezes soma ANTES de conferir o estoque;
 *  4. desconto nunca leva item abaixo do custo; sem custo, vale o teto da loja;
 *  5. o aviso traz itens, total, entrega e link, e nunca o telefone;
 *  6. o resumo do dia não soma moedas diferentes.
 */
import { describe, expect, it } from "vitest";

import { avisoDeVenda, resumoDoDia } from "./aviso";
import { montarPedido, type ProdutoDoCatalogo } from "./montar";

const p = (o: Partial<ProdutoDoCatalogo> & Pick<ProdutoDoCatalogo, "codigo">): ProdutoDoCatalogo => ({
  nome: o.codigo,
  preco_cents: 10000,
  moeda: "BRL",
  custo_cents: null,
  controla_estoque: true,
  quantidade: 10,
  ativo: true,
  ...o,
});

const catalogo = [
  p({ codigo: "CEL-A55", nome: "Galaxy A55", preco_cents: 149900, custo_cents: 120000, quantidade: 3 }),
  p({ codigo: "FON-BT", nome: "Fone BT", preco_cents: 24990, custo_cents: 15000, quantidade: 4 }),
  p({ codigo: "CAPA", nome: "Capinha", preco_cents: 5990, custo_cents: null, controla_estoque: false, quantidade: 0 }),
  p({ codigo: "VELHO", ativo: false }),
  p({ codigo: "USD-1", moeda: "USD" }),
];
const semDesconto = { tetoSemCustoBp: 0 };

describe("montar o pedido", () => {
  it("o preço vem do catálogo e o total fecha", () => {
    const r = montarPedido([{ codigo: "cel-a55", quantidade: 1 }, { codigo: "FON-BT", quantidade: 2 }], catalogo, 0, semDesconto);
    expect(r).toEqual({
      ok: true,
      moeda: "BRL",
      linhas: [
        { codigo: "CEL-A55", nome: "Galaxy A55", quantidade: 1, preco_unitario_cents: 149900, subtotal_cents: 149900 },
        { codigo: "FON-BT", nome: "Fone BT", quantidade: 2, preco_unitario_cents: 24990, subtotal_cents: 49980 },
      ],
      subtotal_cents: 199880,
      desconto_cents: 0,
      total_cents: 199880,
    });
  });

  it("um item ruim recusa tudo, com o motivo de cada um", () => {
    const r = montarPedido(
      [
        { codigo: "CEL-A55", quantidade: 5 },
        { codigo: "NAO-EXISTE", quantidade: 1 },
        { codigo: "VELHO", quantidade: 1 },
        { codigo: "FON-BT", quantidade: 0 },
        { codigo: "USD-1", quantidade: 1 },
      ],
      catalogo,
      0,
      semDesconto,
    );
    expect(r).toEqual({
      ok: false,
      motivo: "itens_recusados",
      itens: [
        { codigo: "CEL-A55", motivo: "sem_estoque", disponivel: 3 },
        { codigo: "NAO-EXISTE", motivo: "produto_inexistente" },
        { codigo: "VELHO", motivo: "produto_inativo" },
        { codigo: "FON-BT", motivo: "quantidade_invalida" },
        { codigo: "USD-1", motivo: "moeda_diferente" },
      ],
    });
  });

  it("o mesmo produto em duas linhas soma antes de conferir o estoque", () => {
    const r = montarPedido([{ codigo: "FON-BT", quantidade: 3 }, { codigo: "fon-bt", quantidade: 2 }], catalogo, 0, semDesconto);
    expect(r).toEqual({ ok: false, motivo: "itens_recusados", itens: [{ codigo: "FON-BT", motivo: "sem_estoque", disponivel: 4 }] });
  });

  it("produto sem controle de estoque vende mesmo com quantidade zero", () => {
    const r = montarPedido([{ codigo: "CAPA", quantidade: 2 }], catalogo, 0, semDesconto);
    expect(r.ok && r.total_cents).toBe(11980);
  });

  it("pedido vazio é recusado", () => {
    expect(montarPedido([], catalogo, 0, semDesconto)).toEqual({ ok: false, motivo: "pedido_vazio" });
  });
});

describe("desconto", () => {
  it("o piso é o custo do item mais apertado", () => {
    // A55: margem 29.900 / 149.900 = 19,94% → 1994 bp. Fone: 39,97%. Vale 1994.
    const pedido = [{ codigo: "CEL-A55", quantidade: 1 }, { codigo: "FON-BT", quantidade: 1 }];
    expect(montarPedido(pedido, catalogo, 1995, semDesconto)).toEqual({
      ok: false,
      motivo: "desconto_acima_do_permitido",
      maximo_bp: 1994,
    });
    const r = montarPedido(pedido, catalogo, 1000, semDesconto);
    expect(r.ok && [r.subtotal_cents, r.desconto_cents, r.total_cents]).toEqual([174890, 17489, 157401]);
  });

  it("item sem custo usa o teto da loja, e sem teto não há desconto", () => {
    const capa = [{ codigo: "CAPA", quantidade: 1 }];
    expect(montarPedido(capa, catalogo, 1, semDesconto)).toEqual({ ok: false, motivo: "desconto_acima_do_permitido", maximo_bp: 0 });
    expect(montarPedido(capa, catalogo, 500, { tetoSemCustoBp: 500 }).ok).toBe(true);
    expect(montarPedido(capa, catalogo, 501, { tetoSemCustoBp: 500 }).ok).toBe(false);
  });

  it("o desconto arredonda para baixo: o centavo fica com a loja", () => {
    const r = montarPedido([{ codigo: "CAPA", quantidade: 1 }], catalogo, 333, { tetoSemCustoBp: 1000 });
    // 5990 × 3,33% = 199,467 → 199
    expect(r.ok && r.desconto_cents).toBe(199);
  });
});

describe("aviso ao lojista", () => {
  const base = {
    linhas: [{ nome: "Galaxy A55", quantidade: 1 }, { nome: "Fone BT", quantidade: 2 }],
    total_cents: 199880,
    moeda: "BRL",
    cliente: "Ana Paula Souza",
    pagamento: "Pix",
    entrega: { quando: "amanhã, 14h–16h", endereco: "Rua X, 123 — Centro" },
    link: "https://app.exemplo.com/app/crm/lead/1",
  };

  it("traz total, itens, primeiro nome, pagamento, entrega e link", () => {
    expect(avisoDeVenda(base)).toBe(
      [
        "🛒 Venda fechada pela IA: R$ 1.998,80",
        "Itens: 1× Galaxy A55, 2× Fone BT",
        "Cliente: Ana",
        "Pagamento: Pix",
        "🚚 Entrega: amanhã, 14h–16h — Rua X, 123 — Centro",
        "Abrir pedido: https://app.exemplo.com/app/crm/lead/1",
      ].join("\n").replace(/R\$ /, "R$ "),
    );
  });

  it("sem entrega agendada, diz isso em vez de calar", () => {
    expect(avisoDeVenda({ ...base, entrega: null, link: null, pagamento: null })).toContain("ainda não agendada");
  });

  it("o telefone do cliente nunca entra no aviso", () => {
    expect(avisoDeVenda(base)).not.toMatch(/\+?55\s?\d{2}|\d{4,5}-\d{4}/);
  });
});

describe("resumo do dia", () => {
  it("soma as vendas e conta as entregas", () => {
    expect(resumoDoDia([{ total_cents: 100000, moeda: "BRL" }, { total_cents: 380000, moeda: "BRL" }], 3)).toBe(
      "Hoje: 2 vendas, R$ 4.800,00. Amanhã: 3 entregas.",
    );
  });

  it("singular, vazio e moedas diferentes", () => {
    expect(resumoDoDia([{ total_cents: 5000, moeda: "BRL" }], 1)).toBe("Hoje: 1 venda, R$ 50,00. Amanhã: 1 entrega.");
    expect(resumoDoDia([], 0)).toBe("Hoje: nenhuma venda. Amanhã: nenhuma entrega agendada.");
    expect(resumoDoDia([{ total_cents: 5000, moeda: "BRL" }, { total_cents: 1000, moeda: "USD" }], 0)).toContain(" + ");
  });
});
