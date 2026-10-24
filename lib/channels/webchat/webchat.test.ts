/**
 * O CHAT DO SITE — as regras puras da spec 26, sem banco.
 *
 *  1. o WhatsApp digitado como se fala vira E.164 brasileiro, e nunca americano;
 *  2. consentimento só liga com o booleano `true`;
 *  3. o token do visitante só confere com o hash certo, e nunca vem da query;
 *  4. a lista de origens falha fechada e o curinga não casa com o domínio nu;
 *  5. os tetos caem no padrão, ficam dentro da faixa e devolvem o MOTIVO.
 */
import { describe, expect, it } from "vitest";

import {
  formaDeChaveValida,
  gerarChaveDoWidget,
  gerarVisitante,
  hashDoToken,
  tokenConfere,
  tokenDoHeader,
} from "./credenciais";
import { normalizarWhatsappDoVisitante, primeiraMensagemSchema, mensagemSeguinteSchema } from "./entrada";
import { normalizarOrigem, origemPermitida } from "./origem";
import {
  podeAbrirConversa,
  podeMandarMensagem,
  podeTentarRecuperacao,
  resolverTetos,
  TETOS_PADRAO,
} from "./tetos";

describe("WhatsApp do visitante", () => {
  it.each([
    ["(11) 98765-4321", "+5511987654321"],
    ["11987654321", "+5511987654321"],
    ["5511987654321", "+5511987654321"],
    ["+55 11 98765-4321", "+5511987654321"],
    // Sem o nono dígito: o CRM guarda a forma COM o nono (phone-variants).
    ["1187654321", "+5511987654321"],
    // Estrangeiro com + passa como veio.
    ["+1 415 555 0123", "+14155550123"],
  ])("%s → %s", (bruto, esperado) => {
    expect(normalizarWhatsappDoVisitante(bruto)).toBe(esperado);
  });

  it("número sem DDD, curto demais ou com DDD impossível é recusado", () => {
    for (const bruto of ["", "   ", "98765-4321", "123", "(01) 98765-4321", "abc"]) {
      expect(normalizarWhatsappDoVisitante(bruto)).toBeNull();
    }
  });

  it("controle: sem o 55 explícito, o normalizador do CRM sozinho erraria o país", async () => {
    const { canonicalPhoneBR } = await import("@/lib/channels/phone-variants");
    expect(canonicalPhoneBR("11987654321")).toBe("+11987654321");
  });
});

describe("primeira mensagem", () => {
  const base = { whatsapp: "(11) 98765-4321", texto: "Oi, quero um orçamento" };

  it("normaliza o WhatsApp e o consentimento nasce falso", () => {
    const r = primeiraMensagemSchema.parse(base);
    expect(r.whatsapp).toBe("+5511987654321");
    expect(r.consentimento_whatsapp).toBe(false);
    expect(r.nome ?? null).toBeNull();
  });

  it("só o booleano true liga o consentimento", () => {
    expect(primeiraMensagemSchema.parse({ ...base, consentimento_whatsapp: true }).consentimento_whatsapp).toBe(true);
    for (const v of ["on", 1, "true"]) {
      expect(primeiraMensagemSchema.safeParse({ ...base, consentimento_whatsapp: v }).success).toBe(false);
    }
  });

  it("sem WhatsApp válido, recusa com o motivo", () => {
    const r = primeiraMensagemSchema.safeParse({ ...base, whatsapp: "123" });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain("whatsapp_invalido");
  });

  it("texto vazio ou gigante é recusado", () => {
    expect(mensagemSeguinteSchema.safeParse({ texto: "   " }).success).toBe(false);
    expect(mensagemSeguinteSchema.safeParse({ texto: "a".repeat(2001) }).success).toBe(false);
    expect(mensagemSeguinteSchema.safeParse({ texto: "a".repeat(2000) }).success).toBe(true);
  });
});

describe("credenciais", () => {
  it("a chave do widget tem forma fixa e não se repete", () => {
    const a = gerarChaveDoWidget();
    expect(formaDeChaveValida(a)).toBe(true);
    expect(a).not.toBe(gerarChaveDoWidget());
    expect(formaDeChaveValida("wck_curta")).toBe(false);
    expect(formaDeChaveValida(a.replace("wck_", "wcv_"))).toBe(false);
  });

  it("o token confere com o próprio hash e com nenhum outro", () => {
    const v = gerarVisitante();
    expect(v.tokenHash).toBe(hashDoToken(v.token));
    expect(v.tokenHash).not.toContain(v.token);
    expect(tokenConfere(v.token, v.tokenHash)).toBe(true);
    expect(tokenConfere(gerarVisitante().token, v.tokenHash)).toBe(false);
    expect(tokenConfere(null, v.tokenHash)).toBe(false);
    expect(tokenConfere(v.token, null)).toBe(false);
    expect(tokenConfere("qualquer-coisa", v.tokenHash)).toBe(false);
  });

  it("o token vem só do header Bearer", () => {
    expect(tokenDoHeader("Bearer wcv_abc")).toBe("wcv_abc");
    expect(tokenDoHeader("bearer   wcv_abc")).toBe("wcv_abc");
    expect(tokenDoHeader("Basic wcv_abc")).toBeNull();
    expect(tokenDoHeader(null)).toBeNull();
  });
});

describe("origem", () => {
  const lista = ["https://loja.com.br", "https://*.loja.com.br"];

  it("normaliza esquema, caixa e porta padrão", () => {
    expect(normalizarOrigem("https://Loja.com.br:443/produto?x=1")).toBe("https://loja.com.br");
    expect(normalizarOrigem("http://localhost:3000/")).toBe("http://localhost:3000");
    expect(normalizarOrigem("javascript:alert(1)")).toBeNull();
    expect(normalizarOrigem("lixo")).toBeNull();
  });

  it("aceita a origem listada e subdomínios pelo curinga", () => {
    expect(origemPermitida({ origin: "https://loja.com.br", referer: null }, lista)).toBe(true);
    expect(origemPermitida({ origin: "https://www.loja.com.br", referer: null }, lista)).toBe(true);
  });

  it("recusa site alheio, domínio parecido e protocolo trocado", () => {
    expect(origemPermitida({ origin: "https://outraloja.com.br", referer: null }, lista)).toBe(false);
    expect(origemPermitida({ origin: "https://loja.com.br.evil.com", referer: null }, lista)).toBe(false);
    expect(origemPermitida({ origin: "http://loja.com.br", referer: null }, lista)).toBe(false);
  });

  it("o curinga não casa com o domínio nu", () => {
    expect(origemPermitida({ origin: "https://loja.com.br", referer: null }, ["https://*.loja.com.br"])).toBe(false);
  });

  it("sem Origin usa o Referer; sem os dois, ou com lista vazia, recusa", () => {
    expect(origemPermitida({ origin: null, referer: "https://loja.com.br/contato" }, lista)).toBe(true);
    expect(origemPermitida({ origin: null, referer: null }, lista)).toBe(false);
    expect(origemPermitida({ origin: "https://loja.com.br", referer: null }, [])).toBe(false);
  });
});

describe("tetos", () => {
  it("sem configuração, valem os padrões da spec", () => {
    expect(resolverTetos(null)).toEqual({
      conversasNovasPorDia: 100,
      mensagensPorConversa: 40,
      mensagensPorMinuto: 10,
      tentativasDeRecuperacao: 2,
      janelaDeRecuperacaoDias: 7,
    });
  });

  it("inválido cai no padrão e fora da faixa é trazido para dentro", () => {
    const t = resolverTetos({
      conversasNovasPorDia: "250",
      mensagensPorConversa: 0,
      mensagensPorMinuto: "lixo",
      tentativasDeRecuperacao: 99,
    });
    expect(t.conversasNovasPorDia).toBe(250);
    expect(t.mensagensPorConversa).toBe(5);
    expect(t.mensagensPorMinuto).toBe(TETOS_PADRAO.mensagensPorMinuto);
    expect(t.tentativasDeRecuperacao).toBe(3);
  });

  it("decisões devolvem o motivo, nunca só falso", () => {
    expect(podeAbrirConversa(99, TETOS_PADRAO)).toEqual({ pode: true });
    expect(podeAbrirConversa(100, TETOS_PADRAO)).toEqual({ pode: false, motivo: "teto_diario_de_conversas" });
    expect(podeMandarMensagem(40, 0, TETOS_PADRAO)).toEqual({ pode: false, motivo: "teto_de_mensagens_da_conversa" });
    expect(podeMandarMensagem(3, 10, TETOS_PADRAO)).toEqual({ pode: false, motivo: "ritmo_do_visitante" });
    expect(podeMandarMensagem(3, 2, TETOS_PADRAO)).toEqual({ pode: true });
  });

  it("recuperação exige consentimento, contato livre e tentativa sobrando", () => {
    const base = { consentiu: true, bloqueado: false, tentativasNaJanela: 0, tetos: TETOS_PADRAO };
    expect(podeTentarRecuperacao(base)).toEqual({ pode: true });
    expect(podeTentarRecuperacao({ ...base, consentiu: false })).toEqual({ pode: false, motivo: "sem_consentimento" });
    expect(podeTentarRecuperacao({ ...base, bloqueado: true })).toEqual({ pode: false, motivo: "contato_bloqueado" });
    expect(podeTentarRecuperacao({ ...base, tentativasNaJanela: 2 })).toEqual({
      pode: false,
      motivo: "tentativas_esgotadas",
    });
  });
});
