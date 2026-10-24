/**
 * A CATEGORIA DO CATÁLOGO — a mesma regra para qualquer ramo de loja.
 *
 *  1. as opções saem do catálogo da empresa, de qualquer ramo;
 *  2. grafias da mesma categoria viram uma, com a grafia mais usada;
 *  3. categoria só de produto inativo não é oferecida;
 *  4. menos de 2 ou mais do que o fornecedor aceita devolve o motivo;
 *  5. a chave é nossa (cat_n) e o nome da loja volta pela tradução;
 *  6. o arquivo não contém o nome de nenhuma categoria de nenhum ramo.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CATEGORIAS_NO_MAXIMO,
  categoriaDaEscolha,
  categoriasDoCatalogo,
  perguntaDaCategoria,
} from "./categoria-do-catalogo";

const ativo = (categoria: string | null) => ({ categoria, ativo: true });

describe.each([
  ["eletrônicos", ["Celulares", "Celulares", "Fones", "Acessórios"], ["Celulares", "Acessórios", "Fones"]],
  ["videogames", ["Consoles", "Jogos", "Jogos", "Jogos", "Controles"], ["Jogos", "Consoles", "Controles"]],
  ["brinquedos", ["Bonecas", "Carrinhos", "Jogos de tabuleiro", "Bonecas"], ["Bonecas", "Carrinhos", "Jogos de tabuleiro"]],
  ["comida", ["Lanches", "Pizzas", "Bebidas", "Pizzas", "Sobremesas"], ["Pizzas", "Bebidas", "Lanches", "Sobremesas"]],
  ["barbearia que vende produtos", ["Pomadas", "Shampoos", "Óleos para barba"], ["Óleos para barba", "Pomadas", "Shampoos"]],
])("ramo: %s", (_ramo, cadastradas, esperadas) => {
  it("as opções são as categorias da própria loja, mais pedidas primeiro", () => {
    expect(categoriasDoCatalogo(cadastradas.map(ativo))).toEqual(esperadas);
  });

  it("a pergunta tem uma escolha por categoria e o nenhuma, e a escolha volta com o nome da loja", () => {
    const r = perguntaDaCategoria(esperadas);
    if (!r.ok) throw new Error(r.motivo);
    expect(r.pergunta.tipo).toBe("choice");
    const criterios = (r.pergunta as { criterios: Record<string, string> }).criterios;
    expect(Object.keys(criterios)).toEqual([...esperadas.map((_, i) => `cat_${i + 1}`), "none"]);
    expect(categoriaDaEscolha("cat_1", 0.9, r.opcoes, 0.5)).toBe(esperadas[0]);
  });
});

describe("categorias do catálogo", () => {
  it("grafias da mesma categoria viram uma, com a mais usada", () => {
    expect(
      categoriasDoCatalogo([ativo("Video Games"), ativo("videogames"), ativo(" Video  Games "), ativo("Vídeo games"), ativo("Jogos")]),
    ).toEqual(["Video Games", "Jogos"]);
  });

  it("produto inativo, sem categoria ou com categoria vazia não conta", () => {
    expect(
      categoriasDoCatalogo([
        { categoria: "Promoção antiga", ativo: false },
        ativo(null),
        ativo("   "),
        ativo("---"),
        ativo("Pizzas"),
      ]),
    ).toEqual(["Pizzas"]);
  });

  it("a ordem é estável no empate", () => {
    expect(categoriasDoCatalogo([ativo("Bebidas"), ativo("Açaí")])).toEqual(["Açaí", "Bebidas"]);
  });
});

describe("quando não há o que perguntar", () => {
  it("uma categoria só não é escolha", () => {
    expect(perguntaDaCategoria(["Pizzas"])).toEqual({ ok: false, motivo: "categorias_insuficientes" });
    expect(perguntaDaCategoria([])).toEqual({ ok: false, motivo: "categorias_insuficientes" });
  });

  it("mais do que o fornecedor aceita devolve o motivo em vez de derrubar a chamada", () => {
    const muitas = Array.from({ length: CATEGORIAS_NO_MAXIMO + 1 }, (_, i) => `Categoria ${i}`);
    expect(perguntaDaCategoria(muitas)).toEqual({ ok: false, motivo: "opcoes_demais" });
    expect(perguntaDaCategoria(muitas.slice(0, CATEGORIAS_NO_MAXIMO)).ok).toBe(true);
  });
});

describe("a escolha do Jev", () => {
  const r = perguntaDaCategoria(["Lanches", "Bebidas"]);
  const opcoes = r.ok ? r.opcoes : {};

  it("nenhuma, chave desconhecida ou confiança baixa viram busca sem filtro", () => {
    expect(categoriaDaEscolha("none", 0.99, opcoes, 0.5)).toBeNull();
    expect(categoriaDaEscolha("cat_9", 0.99, opcoes, 0.5)).toBeNull();
    expect(categoriaDaEscolha("__proto__", 0.99, opcoes, 0.5)).toBeNull();
    expect(categoriaDaEscolha("cat_2", 0.4, opcoes, 0.5)).toBeNull();
    expect(categoriaDaEscolha("cat_2", 0.5, opcoes, 0.5)).toBe("Bebidas");
  });

  it("o nome com qualquer caractere vai no critério, nunca na chave", () => {
    const esquisita = perguntaDaCategoria(['Jogos "retrô" & 8-bits', "Placas: GPU/CPU"]);
    if (!esquisita.ok) throw new Error(esquisita.motivo);
    const chaves = Object.keys((esquisita.pergunta as { criterios: Record<string, string> }).criterios);
    for (const k of chaves) expect(k).toMatch(/^(cat_\d+|none)$/);
  });
});

describe("nenhum ramo fixo no código", () => {
  it("o arquivo não nomeia categoria de loja nenhuma", () => {
    const fonte = readFileSync(path.join(__dirname, "categoria-do-catalogo.ts"), "utf8").toLowerCase();
    for (const palavra of ["celular", "fone", "videogame", "console", "brinquedo", "pizza", "lanche", "barba", "roupa"]) {
      expect(fonte, palavra).not.toContain(palavra);
    }
  });
});
