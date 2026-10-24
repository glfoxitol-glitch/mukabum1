/**
 * "O CLIENTE ACEITOU?" — as regras da spec 27, para qualquer ramo.
 *
 *  1. a regra reconhece o aceite curto e só ele;
 *  2. aceite com condição, dúvida ou recusa nunca é aceite pela regra;
 *  3. só proposta vigente (2 h) pode ser aceita;
 *  4. cascata: onde a regra reconheceu, o Jev nem é perguntado;
 *  5. o Jev só confirma acima do corte, e a ausência dele nunca vira sim;
 *  6. a pergunta leva o resumo da proposta e diz que condição é não.
 */
import { describe, expect, it } from "vitest";

import {
  aceiteExplicito,
  CORTE_DA_CONFIRMACAO,
  JANELA_DA_PROPOSTA_MIN,
  perguntaDeConfirmacao,
  precisaPerguntarAoJev,
  propostaVigente,
  vereditoDaConfirmacao,
} from "./confirmacao-do-cliente";

const agora = new Date("2026-10-24T15:00:00Z");
const minutosAtras = (m: number) => new Date(agora.getTime() - m * 60_000);
const proposta = { feitaEm: minutosAtras(5) };

describe("a regra reconhece o aceite curto", () => {
  it.each(["sim", "Sim!", "SIM 👍", "pode ser", "Fechado.", "ok", "beleza", "isso mesmo", "sim sim", "pode pode", "bora", "Confirmo", "ótimo", "esse horário"])(
    "%s",
    (t) => expect(aceiteExplicito(t)).toBe(true),
  );
});

describe("a regra NÃO reconhece o que não é aceite limpo", () => {
  it.each([
    "não",
    "nao quero",
    "sim, mas só depois do dia 10",
    "ok, vou pensar",
    "pode ser, quanto fica o frete?",
    "vou ver com minha esposa",
    "tem outro horário?",
    "sim?",
    "ok obrigado",
    "manda esse mesmo então",
    "",
    "   ",
    "👍",
  ])("%s", (t) => {
    // "manda esse mesmo então" e o "👍" puro são aceites que a regra deixa
    // para o Jev: estreita de propósito, errar para o não custa uma pergunta.
    expect(aceiteExplicito(t)).toBe(false);
  });

  it("controle: a mesma palavra de aceite com uma condição volta para o Jev", () => {
    expect(aceiteExplicito("pode")).toBe(true);
    expect(aceiteExplicito("pode amanhã")).toBe(false);
  });
});

describe("proposta vigente", () => {
  it(`vale até ${JANELA_DA_PROPOSTA_MIN} minutos, e proposta do futuro não vale`, () => {
    expect(propostaVigente({ feitaEm: minutosAtras(JANELA_DA_PROPOSTA_MIN) }, agora)).toBe(true);
    expect(propostaVigente({ feitaEm: minutosAtras(JANELA_DA_PROPOSTA_MIN + 1) }, agora)).toBe(false);
    expect(propostaVigente({ feitaEm: new Date(agora.getTime() + 60_000) }, agora)).toBe(false);
  });
});

describe("cascata", () => {
  it("onde a regra reconheceu, o Jev nem é perguntado", () => {
    expect(precisaPerguntarAoJev(proposta, agora, "fechado")).toBe(false);
    expect(precisaPerguntarAoJev(proposta, agora, "manda esse mesmo então")).toBe(true);
  });

  it("sem proposta, ou com proposta vencida, não há o que perguntar", () => {
    expect(precisaPerguntarAoJev(null, agora, "manda esse")).toBe(false);
    expect(precisaPerguntarAoJev({ feitaEm: minutosAtras(500) }, agora, "manda esse")).toBe(false);
  });
});

describe("veredito", () => {
  it("a regra decide sem o Jev", () => {
    expect(vereditoDaConfirmacao({ proposta, agora, texto: "sim", probabilidadeDoJev: null })).toEqual({
      veredito: "aceitou",
      por: "regra",
    });
  });

  it("o Jev confirma só a partir do corte", () => {
    const base = { proposta, agora, texto: "manda esse mesmo então" };
    expect(vereditoDaConfirmacao({ ...base, probabilidadeDoJev: CORTE_DA_CONFIRMACAO })).toEqual({ veredito: "aceitou", por: "jev" });
    expect(vereditoDaConfirmacao({ ...base, probabilidadeDoJev: CORTE_DA_CONFIRMACAO - 0.01 })).toEqual({
      veredito: "nao_aceitou",
      por: "jev",
    });
  });

  it("a ausência do Jev nunca vira sim", () => {
    for (const p of [null, Number.NaN]) {
      expect(vereditoDaConfirmacao({ proposta, agora, texto: "manda esse", probabilidadeDoJev: p })).toEqual({
        veredito: "nao_aceitou",
        por: "sem_resposta_do_jev",
      });
    }
  });

  it("um sim fora da janela não confirma a proposta antiga", () => {
    expect(
      vereditoDaConfirmacao({ proposta: { feitaEm: minutosAtras(300) }, agora, texto: "sim", probabilidadeDoJev: 0.99 }),
    ).toEqual({ veredito: "nao_aceitou", por: "proposta_vencida" });
    expect(vereditoDaConfirmacao({ proposta: null, agora, texto: "sim", probabilidadeDoJev: 0.99 })).toEqual({
      veredito: "nao_aceitou",
      por: "sem_proposta",
    });
  });
});

describe("a pergunta ao Jev", () => {
  it.each([
    ["produto", "1× Pomada modeladora por R$ 39,90", "o produto"],
    ["horario", "sábado, 10h, corte com o Marcos", "o horário"],
    ["pedido", "2× Pizza grande + 1 refrigerante, entrega em 40 min", "o pedido"],
  ] as const)("%s: leva o resumo e diz que condição é não", (tipo, resumo, rotulo) => {
    const p = perguntaDeConfirmacao({ tipo, resumo });
    expect(p.tipo).toBe("noul");
    expect(p.instrucao).toContain(resumo);
    expect(p.instrucao).toContain(rotulo);
    if (p.tipo !== "noul" || !p.criterios) throw new Error("sem critérios");
    expect(p.criterios.false).toContain("condição");
  });

  it("o resumo vai cortado em 300 caracteres", () => {
    const p = perguntaDeConfirmacao({ tipo: "pedido", resumo: "x".repeat(1000) });
    expect(p.instrucao).toContain("x".repeat(300));
    expect(p.instrucao).not.toContain("x".repeat(301));
  });
});
