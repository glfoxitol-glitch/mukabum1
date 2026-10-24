# Plano do produto: CRM + Site com IA

Este repositório tem duas partes:

| Pasta | O que é |
|---|---|
| raiz (`app/`, `lib/`, `supabase/`…) | O **DeskcommCRM** (licença MIT), importado com o histórico original. É a base do CRM que você vai vender. |
| `site-modelo/` | O **modelo de site** com chat e WhatsApp, entregue no pacote "Completo". |

O projeto original continua configurado como `upstream`. Para trazer as atualizações dele:

```bash
git fetch upstream main
git merge upstream/main
```

---

## O produto

| Pacote | Inclui |
|---|---|
| **CRM** | CRM, WhatsApp com IA, funil de vendas e atendimento |
| **CRM + Site** | Tudo do pacote CRM + site com chat e botão de WhatsApp ligados ao CRM |

```
Visitante → Site (chat / botão WhatsApp) → WhatsApp da empresa → CRM → IA atende → lead no funil
                                                                   ↑
                                       Cliente acessa o painel pelo navegador
```

---

## Quem monta o site de cada cliente?

| Opção | Vantagens | Desvantagens |
|---|---|---|
| **A. Você monta**, com as suas IAs e o modelo | Rápido para começar, qualidade controlada, pode cobrar à parte | Toma o seu tempo a cada cliente |
| **B. O cliente monta sozinho no CRM**, com IA | Escala sem você e é um diferencial forte | Leva semanas para desenvolver e o cliente pode fazer um site ruim |
| **C. Os dois** (recomendado) | Começa vendendo já e evolui para o automático | — |

### Recomendação: começar pela A e evoluir para a B

O modelo foi feito para que **todo o conteúdo do site fique num único arquivo** (`config.js`). Por isso:

- **Hoje (opção A):** você pede às suas IAs: "gere o `config.js` para uma clínica de estética chamada X, com estes serviços…". Em minutos o site do cliente está pronto.
- **Depois (opção B):** o editor dentro do CRM faz exatamente a mesma coisa. O cliente descreve a empresa, a IA preenche o `config.js` e um formulário permite ajustar textos, cores e fotos. Não é preciso construir um "Wix" do zero, porque a IA só precisa preencher um formulário bem definido.

Assim a opção B vira uma evolução natural da A, sem jogar trabalho fora.

---

## Fases

### Fase 0: preparar a base (1–2 semanas)
- [ ] Instalar o CRM numa VPS própria (`install.sh`, 4 GB de RAM, domínio próprio)
- [ ] Usar no próprio WhatsApp, com a **API oficial da Meta**, por algumas semanas
- [ ] Configurar a **marca** (`/admin/marca`), a **cobrança** (`/admin/cobranca`, Asaas para Pix e boleto) e os **planos**, incluindo o teto de gasto de IA
- [ ] Cadastrar a chave de IA da instalação (usada pelos clientes sem chave própria)
- [ ] Decidir o modelo de hospedagem: uma instalação para todos ou uma por cliente (a documentação do CRM recomenda uma por cliente)
- [ ] Revisar os 3 alertas de segurança do repositório original

### Fase 1: vender com o modelo de site (já disponível)
- [x] Modelo de site com WhatsApp (`site-modelo/`)
- [x] Chat dentro do site: responde as perguntas frequentes e leva o visitante ao WhatsApp com nome e mensagem prontos
- [ ] Criar 3 ou 4 variações por nicho (clínica, loja, serviços, imobiliária)
- [ ] Rotina de entrega: a IA gera o `config.js` → revisão → publicação no Netlify ou na Vercel → domínio do cliente

### Fase 2: chat nativo no CRM
Desenho técnico: `docs/specs/26-spec-webchat-nativo.md`.

O chat deixa de levar ao WhatsApp e passa a conversar dentro do site, com a **IA do CRM respondendo ao vivo**, e a conversa aparece na inbox junto com as do WhatsApp.
- [ ] Novo canal `webchat` no CRM (`lib/channels/`), seguindo o contrato `ChannelAdapter`
- [ ] Endpoint público por empresa, com token do site, limite de requisições e proteção anti-spam
- [ ] Respostas em tempo real no widget (Supabase Realtime)
- [ ] Tela no CRM para ligar o chat e copiar o código de instalação no site
- [ ] Migration e `baseline.sql` (o CRM exige que andem juntos) e testes de isolamento entre empresas
- [ ] Atualizar `chat.js` para usar o canal quando ele estiver configurado, mantendo o WhatsApp como reserva

Estimativa: 2 a 4 semanas de desenvolvimento, porque toca banco, segurança, inbox e IA.

### Fase 2B: loja no site + vendas com entrega agendada
Para clientes que vendem produtos (exemplo: loja de eletrônicos). O que **já existe** no CRM e o que falta:

| Peça | Situação |
|---|---|
| Catálogo de produtos com fotos, preço, estoque e importação por planilha (`catalog_products`, tela `/app/products`) | ✅ já existe |
| IA busca produtos e manda fotos no WhatsApp (`crm_search_products`, `fotos-do-produto`) | ✅ já existe |
| Agenda com horários livres, marcar, remarcar, confirmar e lembrete (`crm_find_free_slots`, `crm_book_appointment`…) | ✅ já existe |
| Integração com Nuvemshop (produtos e pedidos de loja já pronta) | ✅ já existe |
| **Vitrine no site** lendo o catálogo do CRM (produto cadastrado no CRM aparece no site sozinho) | ⚠️ metade: a vitrine do `site-modelo` está pronta (`vitrine.js`, categorias, busca, esgotado) e lê `catalogo.url`; falta a rota pública do CRM que devolve o catálogo |
| **IA cria o pedido** na conversa (carrinho → pedido → link de pagamento) | ⚠️ regras prontas e testadas em `lib/pedidos/` (preço, estoque, desconto, aviso); falta a ferramenta `crm_create_order` e a gravação (spec 28) |
| **Entrega agendada** (cliente escolhe dia/horário de entrega e endereço) | ⚠️ quase tudo existe, ver abaixo |
| Botão "Comprar pelo WhatsApp" em cada produto do site | ✅ pronto no `site-modelo`: abre o chat (modo canal) ou o WhatsApp com o produto escrito |

#### Aviso de venda para o lojista (sem ele olhar o computador)
O CRM roda **24 horas no servidor (VPS)**, não no computador do lojista. Os avisos que **já existem**:
- **Notificação no celular** (o CRM instalado como app pela tela inicial): negócio ganho, novo lead
  atribuído, nova mensagem (`lib/notifications/`, tipo `lead_won`).
- **Mensagem no WhatsApp da equipe** pela automação "quando o negócio for ganho → avisar a equipe"
  (`notify_team`), com os dados do cliente. O número da equipe é interno e não vira conversa de cliente.
- **E-mail** pela ação de automação `send_email`.

**O que falta para o fluxo da loja:** quando a IA fechar o pedido (Fase 2B), ela precisa **mover o
lead para "Pedido confirmado" / marcar como ganho**, com produto, valor, endereço e horário de
entrega. É essa transição que dispara os avisos acima. Sugestão a construir: um **resumo do dia**
para o lojista ("5 vendas hoje, 3 entregas amanhã").

#### Entrega agendada: horário ocupado não é oferecido de novo
A agenda do CRM já resolve o conflito que você descreveu, em três camadas:

1. **O motor de horários livres** (`lib/agenda/horarios-livres.ts`) remove da lista o que já está
   marcado. Se o cliente A reservou terça às 14h, a IA **nem oferece** terça às 14h ao cliente B:
   mostra os horários livres de cada dia (`crm_find_free_slots`).
2. **A trava no banco** (migration 0182): se dois clientes tentam o mesmo horário no mesmo segundo,
   só um consegue. O outro recebe "horário já ocupado" e a IA oferece os próximos livres.
3. **Capacidade por horário** (`service_capacity`): se a loja tem **2 entregadores**, cada faixa
   aceita 2 entregas antes de sair da lista.

Configuração (pela tela, sem programar): tipo de agendamento **"Entrega"** com duração da faixa
(ex.: 2 h), jornada da loja, antecedência mínima e capacidade = número de entregadores.
**O que falta construir:** o endereço de entrega ligado ao pedido e o lembrete de saída para entrega.

Fluxo alvo:
```
Cliente no WhatsApp: "quero ver celulares até R$ 1.500"
  → IA busca no catálogo (o mesmo que aparece no site) e manda fotos + preços
  → cliente escolhe → IA monta o pedido e envia o link de pagamento
  → IA oferece horários de entrega livres → cliente escolhe → entrega agendada
  → lembrete no dia + pedido no funil para a equipe separar e entregar
```

### IA: Jev (TypeSafe) + IA de escrita (Claude Haiku 5.5 ou DeepSeek)
Desenho técnico: `docs/specs/27-spec-jev-na-loja-e-assistente-de-configuracao.md`.

O **Jev da TypeSafe já está embutido neste CRM** (`lib/ai/decisao/`, provedor `typesafe`). Ele
responde três tipos de pergunta em milissegundos: **escolha** (uma opção de uma lista), **sim/não**
e **nota**. Hoje ele já cuida de 9 tarefas: roteador (qual agente atende), clima da conversa,
pedido de humano, pedido para parar contato, urgência, follow-up, campo do negócio, tentativa de
manipulação e afirmação de fato. Cada tarefa liga em três estados (desligada → observando →
decidindo), com aceite da empresa.

**A divisão que encaixa a sua ideia:** o Jev **decide** (rápido e barato) e o Haiku 5.5 **escreve**
(rápido e com qualidade de texto).

#### Novas tarefas do Jev no atendimento da loja
| Tarefa nova | Primitiva | Para quê |
|---|---|---|
| Intenção da mensagem: comprar, ver catálogo, agendar entrega, suporte, troca | escolha | Já leva o cliente ao fluxo certo, sem a IA de conversa gastar um turno para entender |
| Categoria do catálogo pedida ("quero ver celulares") | escolha (entre as categorias da loja) | Filtra o catálogo antes de o Haiku montar a resposta com fotos e preços |
| "Já escolheu o produto?" / "Aceitou o horário?" | sim/não | Avança o pedido e a entrega no funil sozinho |

#### Assistente de configuração (Fase 3): o cliente monta o CRM e o site conversando
O cliente escreve: *"Vendo eletrônicos, entrego das 9h às 18h, tenho 2 entregadores, aceito Pix e cartão"*.

```
Jev (escolha)  → nicho: loja │ clínica │ serviços │ imobiliária …      → escolhe o MODELO pronto
Jev (sim/não)  → tem entrega? tem agenda? vende produto? tem catálogo?  → liga só as peças certas
Jev (nota)     → o que falta para ficar pronto (0–100)                   → próxima pergunta ao cliente
Haiku 5.5      → escreve textos: FAQ, boas-vindas, prompt do agente, config.js do site
       ↓
RASCUNHOS: tipo de agendamento "Entrega" (faixa, horário, capacidade = entregadores),
           agente de vendas, FAQ, funil, site (config.js)  →  o cliente revisa e publica
```

Por que funciona bem com o Jev: montar um CRM é, na maior parte, **escolher entre opções que já
existem** (modelo de nicho, quais módulos ligar, quais etapas de funil). Isso é exatamente o que o
Jev faz em milissegundos. Só os textos precisam de um modelo de linguagem, e para isso o Haiku 5.5
basta. Tudo sai como **rascunho**: a regra do próprio CRM é que proposta da IA só vale com aprovação
humana.

#### A sua chave para todos os clientes
Hoje a chave do Jev é **por empresa** (cada organização cadastra a sua). Para você fornecer o Jev a
todos os clientes com a **sua** conta, falta uma **chave da instalação** para o Jev, como a que já
existe para a IA de conversa (`lib/ai/gateway-binding.ts`: chave da empresa primeiro, senão a da
instalação), com o gasto medido por empresa e o teto do plano. É mudança de banco, para a sessão
com Docker.

### Fase 3: editor de site com IA dentro do CRM
- [ ] Tela "Meu site" no painel da empresa
- [ ] Assistente: o cliente descreve o negócio e a IA gera o `config.js` (textos, serviços, FAQ, cores)
- [ ] Formulário para ajustar tudo, com envio de logo e fotos (Supabase Storage)
- [ ] Publicação automática: subdomínio (`cliente.suamarca.com.br`) ou domínio próprio
- [ ] O FAQ do site alimenta também a base de conhecimento da IA do WhatsApp

### Fase 4: escala
- [ ] Domínio próprio por cliente com HTTPS automático
- [ ] Estatísticas do site: visitas, cliques e conversas iniciadas
- [ ] Modelos por nicho prontos dentro do editor

---

## Riscos e cuidados
- **WhatsApp:** use a API oficial. O QR code pode fazer o número ser banido.
- **Custo de IA:** defina o teto por plano com folga em relação ao preço cobrado.
- **LGPD:** contrato com os clientes definindo responsabilidades. Backups ficam com você.
- **Atualizações do upstream:** o projeto muda muito rápido. Teste numa instalação sua antes de atualizar a dos clientes.
- **Licença MIT:** mantenha o arquivo `LICENSE` original no código.
