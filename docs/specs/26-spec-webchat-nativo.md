---
title: Spec Técnica 26 — Chat do site (canal `webchat` nativo)
depends_on: 01-spec-platform-base.md, 07-spec-events-workers.md, 10-spec-ai-agents-runtime.md, redes-sociais-nativas.md
version: 0.1
status: rascunho
date: 2026-10-24
---

# Spec Técnica 26: Chat do site (canal `webchat` nativo)

> Rascunho de desenho, escrito depois de medir o código (`lib/channels/`, a ingestão das redes
> sociais e a doutrina de canal). Nada aqui foi implementado ainda. Os números de migration ficam
> em aberto até a alocação (ver CLAUDE.md, Doutrina de Migrations §1).

## 1. Visão geral

### 1.1 O que é
Um canal de conversa em que o **visitante do site** da organização fala com ela por uma janela de
chat embutida (`site-modelo/chat.js`). A mensagem entra na inbox como qualquer outra, o agente de IA
responde pelo mesmo runtime (`runAgentTurn`), e a resposta aparece no widget **sem o visitante sair
do site**.

### 1.2 Por que é canal, e não formulário de captação
Os webhooks de captação (`lib/captacao`) criam lead, mas não têm volta: o CRM não consegue
responder. Aqui a conversa é **bidirecional**, com thread, histórico, atribuição, handoff IA↔humano
e métricas. Pela régua da doutrina, isso é canal (entrega mensagem a um contato), não plataforma de
anúncio.

### 1.3 Núcleo ou extensão
**Núcleo**, pela pergunta de `docs/doctrine/extensoes.md`: o canal mexe em ingestão, `channel_sessions`,
`conversations.channel` e na cadeia de envio, e extensão não pode tocar nenhuma dessas peças.
Se nenhuma organização ligar o chat, a operação comum continua inteira, porque o canal nasce
desligado por organização.

### 1.4 Fora de escopo (v1)
- Upload de arquivos pelo visitante (só texto na v1).
- Identificação do visitante por login: ele é anônimo até informar nome, telefone ou e-mail.
- Notificação push para o visitante que fechou a aba.

## 2. Física do canal (doutrina de restrição)

| Capability | Valor | Razão |
|---|---|---|
| `freeformOutsideWindow` | `true` | Não há plataforma impondo janela |
| `requiresTemplates` / `canManageTemplates` | `false` / `false` | Não há definição hospedada |
| `banRisk` | `false` | Ninguém bane. As cortesias (horário, fuso) **continuam armadas** (invariante 3) |
| `minIntervalMs` | `null` | |
| `voiceNote` | `"server-convert"` | Irrelevante na v1, que é só texto. Fica declarado porque a matriz é exaustiva |
| `groups` | `"none"` | |
| `costPerMessage` | `false` | |
| `alteraMensagemEnviada` | `false` | |
| `phonebook` | `false` | |

**A restrição real deste canal é de presença**: o visitante só recebe enquanto a aba está aberta.
Ela não é auto nem hetero-restrição, e por isso não entra na cadeia de envio. Quem cuida é o widget
(busca o histórico ao reabrir) e o laço de retorno da §7: se o visitante deixou telefone, a
conversa pode continuar pelo WhatsApp.

## 3. Modelo de dados

**Princípio DIRC:** reusar `channel_sessions`, `contacts`, `conversations` e `messages`. Nenhuma
tabela nova para mensagens.

| Peça | Mudança | Tripla |
|---|---|---|
| `channel_sessions.provider` | Aceitar `'webchat'` no CHECK `channel_sessions_provider_check` | migration + apêndice no baseline + `-- manifest:` |
| `channel_sessions` | `metadata.webchat`: `{ origens_permitidas: string[], saudacao, cor }`. A chave pública do widget é o identificador da sessão (ver §4.1) | sem DDL, mas com schema Zod central (anti-pattern 6) |
| `conversations.channel` | Aceitar `'site'` no CHECK `conversations_channel_check` e na lista derivada de `lib/channels/canais-de-conversa.ts` | migration + baseline. O invariante `vocabulario-banco-x-typescript` reprova se só um dos lados andar |
| `conversations.provider_conversation_id` | Recebe o **id do visitante** (`v_<uuid>`), que é a thread do canal, como nas redes sociais | sem DDL |
| `contacts` | O visitante informa o WhatsApp antes de conversar (§9.1): a ingestão casa por telefone com `encontrarContatoPorTelefone` e só cria ficha nova se não houver. `metadata.webchat_visitor_id` guarda o vínculo com o widget | sem DDL |
| `messages.external_id` | `wc_<uuid>` gerado pelo servidor; `unique (organization_id, external_id)` dá a idempotência | sem DDL |

Constraint nova **não** precisa de backfill: os dois CHECKs só ganham valores.

## 4. Superfícies públicas

Todas ficam em `app/api/v1/webchat/[chave]/…`, entram em `lib/auth/public-paths.ts` com âncora `$`,
e **nenhuma** confia no body para saber a organização.

### 4.1 A chave do widget
- `chave` = token aleatório de 32 bytes (base64url), gerado pelo servidor quando o chat é ligado e
  mostrado na tela de configuração. **Não é segredo**, porque vai no HTML do site, mas também não é
  enumerável.
- A rota resolve `chave → (organization_id, channel_session_id)` com service role e filtra
  `archived_at is null`. A organização sai **só** daí.
- `Origin` / `Referer` precisam estar em `origens_permitidas`, senão a resposta é 403. Isso não é
  autenticação (o header é forjável fora do navegador). Serve para impedir que o widget seja
  embutido em site alheio.

### 4.2 O visitante
- Na primeira mensagem, o servidor emite `visitante_id` + `visitante_token` (32 bytes). Só o
  **SHA-256 do token** vai para o banco (anti-pattern 13), em `contacts.metadata.webchat_token_hash`.
- Toda leitura e escrita posterior exige o token no header `Authorization: Bearer`, **nunca na
  query string** (anti-pattern 12). Sem o token certo, o visitante não lê a conversa de outro.

### 4.3 Rotas
| Rota | O que faz | Rate limit (`checkRateLimit`) |
|---|---|---|
| `GET  /api/v1/webchat/[chave]/config` | Nome, cor, saudação e status online | 60/min por IP |
| `POST /api/v1/webchat/[chave]/mensagens` | Envia mensagem (Zod: texto 1–2000; nome, telefone e e-mail opcionais). Cria visitante na primeira | 10/min por visitante, 30/min por IP, teto diário por organização |
| `GET  /api/v1/webchat/[chave]/mensagens?depois=<cursor>` | Busca as respostas novas (cursor opaco com HMAC). O widget pergunta a cada 3 s com a aba visível e a cada 15 s em segundo plano | 40/min por visitante |

Respostas em `{ data }` / `{ error }` (`ok()` / `fail()`), com `X-RateLimit-*` e `Retry-After`.

**Contrato que o widget já consome** (`site-modelo/chat.js`, testado contra um CRM simulado):

| Chamada | `data` devolvido |
|---|---|
| `POST /mensagens` (primeira, sem token) | `{ visitante_token, mensagem: { id } }`. O token é entregue **uma vez** |
| `POST /mensagens` (seguintes, `Authorization: Bearer`) | `{ mensagem: { id } }` |
| `GET /mensagens?depois=` | `{ mensagens: [{ id, direcao: "inbound" \| "outbound", texto, criada_em }], cursor }` |

| Erro | O widget faz |
|---|---|
| `401` | Esquece o token e pede o WhatsApp de novo |
| `422 whatsapp_invalido` | Reabre o formulário |
| `429` (qualquer teto) | Oferece continuar pelo WhatsApp |
| Rede ou `5xx` | Oferece continuar pelo WhatsApp |

As regras puras já estão em `lib/channels/webchat/` (entrada, credenciais, origem, tetos), com testes.

**Por que polling e não Realtime direto:** o Realtime do Supabase exige a anon key e uma policy
para o visitante. Abrir RLS para um papel anônimo em `messages` contraria o modelo inteiro de
tenancy. O polling passa pela rota, que filtra a organização e o visitante no servidor. Se o volume
justificar, a v2 troca por SSE na mesma rota, sem expor o banco.

### 4.4 Anti-abuso
- Rate limit em três níveis (visitante, IP e organização).
- Teto diário de conversas novas por organização (knob em `channel_knobs`), para que um bot não
  esgote o orçamento de IA. Quando estourar, aparece um aviso na Central, nunca um corte silencioso.
- Detector de STOP (`lib/opt-out/deteccao.ts`): aplica igual. Bloqueia o visitante, não a sessão.
- O orçamento de IA por organização (`budget`) continua sendo o freio final.

## 5. Entrada e saída

```
widget ──POST──▶ rota pública ──▶ ingestWebchatInbound (lib/channels/webchat/ingest.ts)
                                   ├─ contato (visitante) + conversa (thread = visitante_id)
                                   ├─ insert messages (direction=inbound, external_id=wc_…)
                                   └─ aplicarEfeitosPosEntrada  ← o MESMO pós-entrada dos outros canais
                                        └─ trigger → event_log → agent-worker → runAgentTurn
                                                                      │
widget ◀──GET (polling)── rota pública ◀── messages (outbound) ◀── webchatAdapter.send
```

- **Entrada:** `lib/channels/webchat/ingest.ts`, nos moldes de `lib/channels/zernio/ingest.ts`: a
  thread vem antes da âncora, a idempotência por `external_id` e a captura do `23505`.
- **Saída:** `webchatAdapter` (`lib/channels/adapters/webchat.ts`). O transporte é o próprio banco.
  `send` não faz HTTP: valida o envelope, devolve `external_id = wc_<uuid>` e deixa a mensagem
  `sent` (o visitante a busca pela rota). `resolveRecipient` = `"provider-thread"`, como nas redes
  sociais. `checkHealth` = `WORKING` se a sessão está ativa e com origem configurada; senão `FAILED`
  com o motivo.
- **Lida:** quando o widget busca uma mensagem `outbound`, a rota a marca `delivered`.

## 6. Configuração com superfície (doutrina)

- Tela **Conexões › Chat do site** (`app/app/settings/...`, porta em `lib/navigation/catalogo.ts`):
  - ligar e desligar, origens permitidas, saudação e cor;
  - o **código de instalação** pronto para copiar (`<script>` com a chave);
  - o teste do chat dentro da própria tela.
- Escrita pela rota com service role, filtrando `organization_id` da sessão (a armadilha do no-op da
  §"Toda configuração tem superfície").
- Origem não configurada: a tela mostra um aviso e o `checkHealth` fica `FAILED`, nunca um `return`
  mudo.

## 7. Sistema vivo (checklist)

| Invariante | Resposta concreta |
|---|---|
| Nada é ilha | Entrada = rota pública. Saída = inbox, agente, funil (regras QUANDO/SE/ENTÃO veem `channel = 'site'`) |
| Continuidade IA↔humano | Handoff igual aos outros canais. O atendente responde pela inbox e o visitante recebe no widget |
| Log universal | `api_audit_log` para ligar, desligar e mudar origens. A mensagem fica na timeline do contato |
| Nenhuma demanda sem próximo passo | Visitante que saiu sem resposta: se deixou telefone, o follow-up pode continuar pelo WhatsApp (decisão de produto, ver §9) |
| Laço de retorno | Teto diário estourado ou sessão `FAILED` geram aviso na Central |

## 8. Fatias de entrega

| # | Fatia | Prova |
|---|---|---|
| 1 | Tripla de schema (dois CHECKs) + `capabilities.ts` + `webchatAdapter` | `pnpm test:db` (install e update) + matriz de capabilities + `lint:channels` |
| 2 | `ingest.ts` + as três rotas públicas + rate limit + hash do token | testes de unidade + invariante de isolamento (visitante da org A não lê a org B; token errado → 401) |
| 3 | Tela Conexões › Chat do site + porta na navegação | spec Playwright pela tela (DoD 12), em ambiente fresco |
| 4 | `chat.js` com formulário de WhatsApp + consentimento, usando o canal quando houver `chave` (o WhatsApp direto fica como reserva) + recuperação pelo WhatsApp (§9.2) | spec Playwright: visitante pergunta → agente responde no widget (prova em par com a chamada direta) |
| 5 | Fragmento em `.changes/` (`capacidade_nova`) + docs | `pnpm release:conferir` |

## 9. Decisões do dono do produto (24/10/2026)

### 9.1 WhatsApp obrigatório antes do chat
O widget abre com um formulário curto, **antes** da primeira mensagem:

- **Nome** (opcional) e **WhatsApp** (obrigatório), validado e normalizado com `canonicalPhoneBR`;
- **Consentimento explícito**, uma caixa desmarcada por padrão: *"Aceito receber contato da
  {empresa} pelo WhatsApp sobre este atendimento"*. Sem a caixa marcada, o chat continua
  funcionando, mas a recuperação da §9.2 **não** dispara.

Com o telefone em mãos, o contato **não** nasce anônimo: a ingestão passa por
`encontrarContatoPorTelefone` antes de criar ficha. Assim, quem já falou pelo WhatsApp é a **mesma
pessoa** no site (um contato, duas conversas: `channel = 'site'` e `channel = 'whatsapp'`). Isso
substitui o "visitante anônimo" da §3. O consentimento é gravado com o fluxo LGPD existente
(`lgpd.consent_changed`, com origem `webchat`), não num campo solto.

### 9.2 Recuperação pelo WhatsApp quando o visitante desiste
Quando o visitante para de responder no site (ou fecha a aba no meio), a IA tenta reconquistá-lo
**pelo WhatsApp**, para entender por que desistiu e conduzir à contratação.

**Reuso, não motor novo:** o follow-up já tem o gatilho de silêncio (`lib/followup/silence-sweep.ts`),
com cooldown, 1 fluxo vivo por contato (`idx_followup_enrollments_one_live`) e agente publicado como
gate. O que falta é um ponto só: **o follow-up de uma conversa do site sai por outro canal.**
- Novo `trigger_config.kind = 'site_abandonado'` (ou filtro `channel = 'site'` no gatilho de
  silêncio, a decidir na fatia 4 medindo `trigger_config`).
- O envio resolve a **conversa de WhatsApp do mesmo contato** (abrindo uma, se não houver, pelo
  canal WhatsApp padrão da organização). A mensagem leva o contexto: *"Oi {nome}, vi que você estava
  conversando com a gente no site sobre {assunto}…"*, com o resumo da conversa do site como memória
  do agente.
- **Só dispara com consentimento marcado** e telefone válido. Responder STOP encerra tudo
  (`lib/opt-out/deteccao.ts`).

**Física do WhatsApp (doutrina de restrição):**
- **API oficial:** o primeiro contato está **fora da janela de 24h**, porque o visitante nunca
  escreveu para aquele número. Exige **template aprovado** (`requiresTemplates`). A organização
  precisa de um template de "retomada de atendimento" aprovado na Meta. Sem ele, o envio vira aviso
  na Central, nunca falha muda.
- **QR (WAHA):** pode enviar texto livre, mas com `banRisk`. Valem o throttle, a janela de disparo
  e o warm-up. Mensagem para número que nunca falou com o aparelho é o padrão que mais causa
  banimento. Por isso o padrão é **no máximo 2 tentativas**.

**Padrão de tentativas (configurável por organização):**

| Tentativa | Quando | Objetivo |
|---|---|---|
| 1 | 30 min depois do último silêncio no site | Retomar: "ficou alguma dúvida?" |
| 2 | 24 h depois, se não respondeu | Entender a objeção e oferecer ajuda ou condição |
| — | Depois disso | Para, sem 3ª tentativa automática. O lead fica no funil para a equipe decidir |

Qualquer resposta do contato encerra a sequência e devolve a conversa ao agente normal.

### 9.3 Teto diário (padrões recomendados)

| Proteção | Padrão | Por quê |
|---|---|---|
| Conversas **novas** no site por empresa/dia | **100** | Cobre com folga um pequeno ou médio negócio. Um robô que passe disso só consegue criar 100 conversas |
| Mensagens do visitante por conversa | **40** | Uma conversa real raramente passa de 20. Depois disso, oferece "continuar pelo WhatsApp" |
| Mensagens por visitante | **10/min** | Ritmo humano |
| Tentativas de recuperação por contato | **2** a cada **7 dias** | Evita spam e protege o número contra banimento |

Os quatro são knobs em `channel_knobs`, com tela em Conexões › Chat do site. Estourar qualquer
teto gera **aviso na Central** (laço de retorno), nunca um corte silencioso. Acima de todos fica o
**teto de gasto de IA do plano** (`teto_ia_usd_cents`), que continua sendo o freio final.

## 10. O que esta spec NÃO mediu
- Desempenho do polling com muitos visitantes simultâneos (nenhum teste de carga).
- Se `aplicarEfeitosPosEntrada` assume telefone em algum ramo. Precisa ser lido linha a linha na
  fatia 2.
- Nenhuma suíte de banco foi rodada: este ambiente não tem Docker nem pgvector, então `pnpm test:db`
  não roda aqui.
