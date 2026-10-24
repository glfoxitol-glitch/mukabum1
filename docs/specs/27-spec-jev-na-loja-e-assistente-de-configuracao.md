---
title: Spec Técnica 27 — Jev na loja e assistente de configuração
depends_on: jev-roteador-sob-demanda.md, 10-spec-ai-agents-runtime.md, 26-spec-webchat-nativo.md
version: 0.1
status: rascunho
date: 2026-10-24
---

# Spec Técnica 27: Jev na loja e assistente de configuração

> Rascunho escrito depois de ler `lib/ai/decisao/` (o registro de tarefas do Jev), `lib/ai/pontos/provedores.ts`
> e o catálogo de modelos do baseline. Nada aqui foi implementado.

## 1. Princípio: o Jev decide, a IA de escrita escreve

| Papel | Quem | Por quê |
|---|---|---|
| **Decidir** (escolha, sim/não, nota) | **Jev** (provedor `typesafe`, já embutido) | Resposta estruturada em milissegundos, sem texto livre para errar |
| **Escrever** (resposta ao cliente, textos de configuração) | **IA de escrita da empresa**: Claude Haiku 5.5 **ou** DeepSeek (ver §5) | Precisa de linguagem natural e de chamar ferramentas |

Nada nesta spec cria um provedor novo. Os dois papéis usam o que existe: o registro de tarefas do
Jev (`lib/ai/decisao/tarefas.ts`) e os provedores de IA (`lib/ai/pontos/provedores.ts`), onde
`anthropic` e `deepseek` já são nativos.

## 2. Tarefas novas do Jev no atendimento

Cada uma entra em `TAREFAS` como as nove de hoje: estados desligada → observando → decidindo,
aceite da empresa, régua de concordância com a IA de sempre e textos para leigo. Valem as regras do
registro: alcance maior que o aceite ⇒ desligada (falha fechada); alcance `conversa` nunca começa
sozinha; e a escolha do Jev só vale com a IA de sempre tendo respondido (R2), salvo decisão
explícita por tarefa.

| id | Primitiva | Alcance | Família | Pergunta | Consumidor |
|---|---|---|---|---|---|
| `intencao_da_loja` | `choice` | `mensagem` | `substitui` | Comprar · ver catálogo · agendar entrega · acompanhar pedido · suporte/troca · outra | Leva ao agente certo do roteador (as intenções saem do roteador da empresa, nunca de uma lista fixa no código) |
| `categoria_do_catalogo` | `choice` | `mensagem` | `cascata` | Qual categoria do catálogo da empresa a mensagem pede ("quero ver celulares") | Filtra `crm_search_products` antes de o agente montar a resposta. As opções saem das categorias distintas de `catalog_products` da organização |
| `confirmacao_do_cliente` | `noul` | `conversa` | `cascata` | O cliente aceitou o que o agente propôs (produto, horário de entrega)? | Avança o lead no funil. **Nunca** marca nem paga nada sozinho: só a ferramenta do agente marca, e só a pessoa paga |

**Por que `cascata` nas duas últimas:** a regra do próprio agente (a ferramenta que ele chamou, as
palavras configuradas) decide primeiro, e o Jev só é perguntado onde ela não decidiu. Errar ali
não pode marcar uma entrega que ninguém pediu.

**Opções dinâmicas:** `categoria_do_catalogo` monta a lista de escolhas por organização. Lista com
mais de N categorias (N a medir com o fornecedor) cai para a IA de escrita, registrado como
`skipped: 'opcoes_demais'`, nunca omitido (invariante 4 da doutrina de canal).

## 3. Assistente de configuração (o cliente monta o CRM conversando)

### 3.1 O fluxo
O dono da empresa descreve o negócio em texto livre. O assistente devolve **rascunhos**. Nada é
publicado sem ele clicar em publicar (a regra das propostas da IA: aplicadas só com aprovação humana).

| Passo | Quem | Saída |
|---|---|---|
| 1. Nicho | Jev `choice` entre os modelos que existem (`lib/followup/modelos/`, a skill `deskcomm-cliente-novo`) | Qual modelo pronto usar |
| 2. Peças | Jev `noul` × N: vende produto? entrega? agenda? catálogo? pagamento online? | Quais módulos ligar |
| 3. Lacunas | Jev `score` 0–100 de "pronto para atender" + a lacuna mais cara | A próxima pergunta ao dono |
| 4. Textos | IA de escrita | FAQ, boas-vindas, prompt do agente de vendas, `config.js` do site |
| 5. Rascunhos | Servidor | Tipo de agendamento "Entrega" (faixa, jornada, capacidade = entregadores), agente em rascunho, funil, site |

### 3.2 Onde mora
- Tela **"Configurar com IA"** no onboarding (`app/onboarding/`) e em Configurações, com porta em
  `lib/navigation/catalogo.ts`.
- Cada rascunho usa a **rota que já cria aquela peça** (agentes, tipos de agendamento, funil), com
  a mesma autorização (`requireRole('admin')`), o mesmo audit e o mesmo `Idempotency-Key`. O
  assistente **não** ganha um caminho de escrita próprio, que seria uma segunda porta para o mesmo
  efeito.
- O site sai como `config.js` gerado e validado contra um schema Zod do formato do `site-modelo`,
  para baixar ou, na Fase 3, publicar.

### 3.3 Laço de retorno
Rascunho descartado ou editado antes de publicar é sinal de que o assistente errou. Ele entra no
painel de evolução que já existe ("Evolução da IA"), com o que o dono mudou.

## 4. Chave do Jev da instalação
Hoje a credencial do Jev é **por organização** (`credencialEmUsoPeloJev`, `chaveDaOrganizacao`).
Para o dono da instalação fornecer o Jev a todas as empresas:
- uma **chave da instalação** para o provedor `typesafe`, na mesma ordem da IA de conversa
  (`lib/ai/gateway-binding.ts`): a da empresa primeiro, senão a da instalação;
- gasto do Jev medido por organização e somado ao teto do plano (`teto_ia_usd_cents`);
- tela em `/admin` (chave da instalação) e aviso no cartão do Jev da empresa dizendo **de quem** é
  a chave em uso.

É mudança de schema (tripla) e precisa de `pnpm test:db`.

## 5. Qual IA de escrita: Claude Haiku 5.5 ou DeepSeek

**As duas já entram sem código:** `anthropic` e `deepseek` são provedores nativos, e o catálogo da
DeepSeek é sincronizável (`catalogoSincronizavel: true`), então um modelo novo dela aparece pela
tela de provedores. A escolha é **por empresa e por agente**. Falta só o Haiku 5.5 no catálogo de
modelos e na tabela de custo (`lib/ai/runtime/cost.ts`), que ainda listam o Haiku 4.5.

**A decisão é por medição, não por opinião.** O que pesa neste produto, em ordem:
1. **Acerto ao chamar ferramentas**: marcar entrega no horário certo, buscar o produto certo, criar
   o pedido. Um modelo que conversa bem mas erra a ferramenta vende errado.
2. **Português de atendimento**: tom, objeções, não inventar preço.
3. **Tempo de resposta** (p50 e p95) no WhatsApp.
4. **Custo por conversa concluída**, não por mensagem: modelo barato que precisa de mais turnos ou
   escala mais para humano pode sair mais caro.

**Como medir:** o mesmo conjunto de 30–50 conversas reais anonimizadas (compra, entrega, objeção,
troca), rodado nos dois modelos pelo botão "Testar" do agente, mais o painel de execuções e custo.
A prova em par da doutrina vale aqui: o caso que passa pelo agente é conferido também chamando a
ferramenta direto.

**Ponto de produto a decidir:** os dois provedores processam os dados fora do Brasil. O CRM já trata
envio ao exterior como **aceite da empresa** no Jev. A IA de escrita deveria declarar o mesmo na
tela, com o país do processamento, para o seu cliente decidir com informação (LGPD).

## 6. Fatias

| # | Fatia | Prova |
|---|---|---|
| 1 | Haiku 5.5 no catálogo + custo | `pnpm test:db` + teste de custo |
| 2 | `intencao_da_loja` em observando (só mede concordância) | unit + régua de concordância no cartão |
| 3 | `categoria_do_catalogo` + `confirmacao_do_cliente` | unit + spec Playwright pelo agente (prova em par) |
| 4 | Chave do Jev da instalação | tripla + `test:db` + tela |
| 5 | Assistente de configuração (rascunhos) | spec Playwright: descreve o negócio → rascunhos → publica |
| 6 | Medição Haiku 5.5 × DeepSeek | relatório com as 4 réguas da §5 |

## 7. O que esta spec NÃO mediu
- A latência real do Jev e dos dois modelos neste CRM: nenhum teste foi rodado.
- O limite de opções por pergunta `choice` do Jev.
- Se os modelos de nicho de hoje cobrem "loja com entrega" ou se é preciso um modelo novo.
