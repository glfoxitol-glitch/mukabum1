---
title: Spec Técnica 28 — Pedido pela IA, entrega e aviso ao lojista
depends_on: 10-spec-ai-agents-runtime.md, 11-spec-mcp-server-internal.md, 27-spec-jev-na-loja-e-assistente-de-configuracao.md
version: 0.1
status: rascunho
date: 2026-10-24
---

# Spec Técnica 28: Pedido pela IA, entrega e aviso ao lojista

> Fecha o ciclo da venda da loja (PLANO-DO-PRODUTO.md, Fase 2B). As regras puras já estão em
> `lib/pedidos/` com testes. O resto é desenho.

## 1. O fluxo

```
cliente escolhe → agente chama crm_create_order(itens, desconto?)
                    └─ montarPedido(): preço, estoque e desconto pelo catálogo (lib/pedidos/montar.ts)
                 → agente oferece horários (crm_find_free_slots, tipo "Entrega") → crm_book_appointment
                 → pedido gravado + lead movido para "Pedido confirmado" (ganho)
                    └─ automação "negócio ganho → avisar equipe" (notify_team) + push lead_won
                         └─ texto: avisoDeVenda() (lib/pedidos/aviso.ts)
```

## 2. Regras de negócio (implementadas e testadas)

`montarPedido(itens, catalogo, descontoBp, politica)`, em `lib/pedidos/montar.ts`:

| Regra | Por quê |
|---|---|
| O agente manda **só código e quantidade**. O preço sai de `catalog_products` | "Não inventar preço" garantido por construção, não por prompt |
| Um item que não fecha **recusa o pedido inteiro**, com o motivo de cada item (`sem_estoque` com `disponivel`, `produto_inexistente`, `produto_inativo`, `quantidade_invalida`, `moeda_diferente`) | Pedido pela metade seria um pedido que o cliente não fez; com a lista, a IA pergunta "o carregador acabou, levo só os fones?" |
| O mesmo produto em duas linhas **soma antes** de conferir o estoque | Duas linhas de 3 não passam num estoque de 4 |
| A moeda do pedido é a do primeiro produto existente e ativo | Achado no teste: sem isso, um item em outra moeda passava quando o anterior faltava em estoque |
| Desconto **nunca** leva item abaixo de `custo_cents`. Item sem custo usa o teto da loja (padrão: **0**, ou seja, sem desconto) | É a razão de existir da coluna `custo_cents` |
| O desconto arredonda para baixo | O centavo fica com a loja, nunca abaixo do piso |

`avisoDeVenda()` e `resumoDoDia()`, em `lib/pedidos/aviso.ts`: total, itens, **primeiro nome**,
pagamento, entrega (quando e endereço) e link. **Sem telefone do cliente**, porque o texto aparece na
tela de bloqueio do celular. Moedas diferentes nunca se somam no resumo.

## 3. O que falta (precisa de banco, sessão com Docker)

| Peça | Decisão proposta |
|---|---|
| **Origem do pedido** | Novo valor `'crm'` em `orders_external_provider_check`, no **bloco único** dessa constraint (issue #159), com `external_id = <uuid>`. Não reusar `'external'`, que é das pontes de plataformas de fora |
| **Itens do pedido** | `orders.payload.itens` (as `LinhaDoPedido`), com schema Zod central (anti-pattern 6). Tabela `order_items` só se aparecer consumidor que precise consultar item a item |
| **Baixa de estoque** | No mesmo comando do INSERT do pedido, `update catalog_products set quantidade = quantidade - n where quantidade >= n`. Zero linhas afetadas = corrida perdida, e o pedido é recusado com `sem_estoque` |
| **Ferramenta `crm_create_order`** | Em `lib/mcp/tools/comercio.ts`, ao lado de `crm_search_products`. Escrita revalida ator, organização e papel (`escopo-das-escritas.ts`); `Idempotency-Key` derivada do turno (`sourceJobId` + hash do input), como a criação de agendamentos |
| **Entrega** | Tipo de agendamento "Entrega" + `crm_book_appointment`, com o `order_id` no compromisso e o endereço em `location_details`. Ocupado já some da lista (motor de horários), a corrida já é travada no banco (0182) e a capacidade por faixa já existe |
| **Ganho** | O pedido criado move o lead para a etapa marcada como ganho. É essa transição que dispara `notify_team` e o push `lead_won`, que já existem |
| **Texto do aviso** | `carregarResumoParaAEquipe` ganha o bloco do pedido quando o lead tem pedido do CRM (usa `avisoDeVenda`) |
| **Resumo do dia** | Cron diário por organização no fuso dela, que só envia quando houve venda ou entrega (cron vazio não audita nem envia) |
| **Link de pagamento** | Fase seguinte. A cobrança de hoje (Asaas/Stripe) é do **revendedor** para as empresas; cobrar o cliente final é outro contrato (conta da loja), e a decisão é do dono do produto |

## 4. Sistema vivo
- **Entrada:** a ferramenta do agente (e, depois, a tela de pedidos).
- **Saída:** pedido, entrega na agenda, lead ganho, aviso à equipe e push.
- **Laço de retorno:** pedido recusado (estoque, desconto) fica no trace do turno com o motivo. Muitos
  `sem_estoque` do mesmo produto viram aviso na Central ("produto mais pedido sem estoque").

## 5. O que esta spec NÃO mediu
- Nenhuma parte com banco foi rodada (sem Docker neste ambiente).
- O agente chamando a ferramenta de verdade (prova em par: o agente + a ferramenta direto, com o mesmo texto).
