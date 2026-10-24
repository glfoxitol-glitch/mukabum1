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
O chat deixa de levar ao WhatsApp e passa a conversar dentro do site, com a **IA do CRM respondendo ao vivo**, e a conversa aparece na inbox junto com as do WhatsApp.
- [ ] Novo canal `webchat` no CRM (`lib/channels/`), seguindo o contrato `ChannelAdapter`
- [ ] Endpoint público por empresa, com token do site, limite de requisições e proteção anti-spam
- [ ] Respostas em tempo real no widget (Supabase Realtime)
- [ ] Tela no CRM para ligar o chat e copiar o código de instalação no site
- [ ] Migration e `baseline.sql` (o CRM exige que andem juntos) e testes de isolamento entre empresas
- [ ] Atualizar `chat.js` para usar o canal quando ele estiver configurado, mantendo o WhatsApp como reserva

Estimativa: 2 a 4 semanas de desenvolvimento, porque toca banco, segurança, inbox e IA.

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
