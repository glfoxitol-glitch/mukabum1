/**
 * OS MODELOS DE ROTEADOR — o que precisa valer antes de um modelo chegar a uma
 * empresa, conferido aqui e não na instalação, longe de quem escreveu o texto.
 *
 *  1. cabe na rota de membros (nome ≤ 120, descrição ≤ 2000) e na pergunta do Jev;
 *  2. o nome é o que o Jev devolve: único, minúsculas e `_`, nunca `none`;
 *  3. nenhum exemplo aparece em duas intenções (é o que faz o Jev hesitar);
 *  4. toda intenção citada numa descrição existe (renomear uma não deixa a
 *     fronteira apontando para o nada);
 *  5. nenhum texto nomeia preço da loja nem interpola campo;
 *  6. a pergunta ao Jev sai com uma escolha por intenção e mais o "nenhuma";
 *  7. papel sem agente é erro, e a empresa pequena liga tudo a um agente só.
 */
import { describe, expect, it } from "vitest";

import { perguntaDoRoteador } from "@/lib/ai/decisao/roteador";

import { membrosDoModelo, modeloDeRoteadorPorId, MODELOS_DE_ROTEADOR, PAPEIS } from "./index";
import { DESCRICAO_DA_INTENCAO_MAXIMO, NOME_DA_INTENCAO_MAXIMO } from "./tipos";

const AGENTE = "11111111-1111-4111-8111-111111111111";

describe.each(MODELOS_DE_ROTEADOR.map((m) => [m.id, m] as const))("modelo %s", (_id, modelo) => {
  const nomes = modelo.intencoes.map((i) => i.nome);

  it("cabe na rota de membros", () => {
    for (const i of modelo.intencoes) {
      expect(i.nome.length).toBeGreaterThan(0);
      expect(i.nome.length).toBeLessThanOrEqual(NOME_DA_INTENCAO_MAXIMO);
      expect(i.descricao.length).toBeGreaterThan(0);
      expect(i.descricao.length).toBeLessThanOrEqual(DESCRICAO_DA_INTENCAO_MAXIMO);
      expect(i.exemplos.length).toBeGreaterThanOrEqual(3);
      expect(PAPEIS).toContain(i.papel);
    }
  });

  it("os nomes são únicos, em minúsculas com _, e nenhum é none", () => {
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const n of nomes) {
      expect(n).toMatch(/^[a-z][a-z_]*$/);
      expect(n).not.toBe("none");
    }
  });

  it("nenhum exemplo aparece em duas intenções", () => {
    const vistos = new Map<string, string>();
    for (const i of modelo.intencoes) {
      for (const e of i.exemplos) {
        const chave = e.trim().toLowerCase();
        expect(vistos.get(chave), `"${e}" está em ${vistos.get(chave)} e em ${i.nome}`).toBeUndefined();
        vistos.set(chave, i.nome);
      }
    }
  });

  it("toda intenção citada numa descrição existe neste modelo", () => {
    for (const i of modelo.intencoes) {
      const citadas = i.descricao.match(/\b[a-z]+_[a-z_]+\b/g) ?? [];
      for (const c of citadas) expect(nomes, `${i.nome} cita ${c}`).toContain(c);
    }
  });

  it("nenhum texto traz preço da loja ou campo interpolado", () => {
    const textos = [modelo.rotulo, modelo.oQueFaz, ...modelo.intencoes.flatMap((i) => [i.descricao, ...i.exemplos])];
    for (const t of textos) {
      expect(t).not.toMatch(/R\$/);
      expect(t).not.toContain("{{");
    }
  });

  it("a pergunta ao Jev tem uma escolha por intenção e mais o nenhuma", () => {
    const r = membrosDoModelo(modelo, { vendas: AGENTE, entrega: AGENTE, suporte: AGENTE });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const pergunta = perguntaDoRoteador(r.membros);
    expect(pergunta).not.toBeNull();
    expect(pergunta?.tipo).toBe("choice");
    const criterios = (pergunta as { criterios: Record<string, string> }).criterios;
    expect(Object.keys(criterios).sort()).toEqual([...nomes, "none"].sort());
    // Os exemplos chegam ao Jev junto com o critério.
    for (const i of modelo.intencoes) expect(criterios[i.nome]).toContain(i.exemplos[0]);
  });
});

describe("loja com entrega", () => {
  const modelo = modeloDeRoteadorPorId("loja_com_entrega");

  it("existe no catálogo e separa as cinco intenções da spec 27", () => {
    expect(modelo?.intencoes.map((i) => i.nome)).toEqual([
      "comprar",
      "ver_catalogo",
      "agendar_entrega",
      "acompanhar_pedido",
      "suporte_troca",
    ]);
  });

  it("as fronteiras parecidas são ditas nas duas pontas", () => {
    const d = Object.fromEntries((modelo?.intencoes ?? []).map((i) => [i.nome, i.descricao]));
    expect(d.comprar).toContain("ver_catalogo");
    expect(d.ver_catalogo).toContain("comprar");
    expect(d.agendar_entrega).toContain("acompanhar_pedido");
    expect(d.acompanhar_pedido).toContain("agendar_entrega");
    expect(d.acompanhar_pedido).toContain("suporte_troca");
  });

  it("papel sem agente é erro, com o nome do papel", () => {
    if (!modelo) throw new Error("modelo ausente");
    expect(membrosDoModelo(modelo, { vendas: AGENTE })).toEqual({
      ok: false,
      papeisSemAgente: ["entrega", "suporte"],
    });
  });

  it("a empresa pequena liga os três papéis ao mesmo agente", () => {
    if (!modelo) throw new Error("modelo ausente");
    const r = membrosDoModelo(modelo, { vendas: AGENTE, entrega: AGENTE, suporte: AGENTE });
    expect(r.ok && r.membros.every((m) => m.agentId === AGENTE)).toBe(true);
  });

  it("um id desconhecido devolve undefined, não erro", () => {
    expect(modeloDeRoteadorPorId("nao_existe")).toBeUndefined();
  });
});
