# Modelo de site com WhatsApp + CRM

Site de uma página para entregar no pacote "Completo". Todo botão abre o WhatsApp da empresa, e a conversa cai direto no CRM (inbox, IA e funil).

```
Visitante no site → botão do WhatsApp → número conectado ao CRM → IA atende → lead no funil
```

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site. Não precisa mexer. |
| `chat.js` | O chat dentro do site. Funciona sozinho: também pode ser colocado em qualquer outro site, junto com o `config.js`. |
| `config.js` | **Tudo o que muda de um cliente para outro**: nome, cores, logo, número do WhatsApp, textos, serviços, depoimentos, FAQ, endereço e redes sociais. |

## Como criar o site de um cliente novo

1. Copie a pasta `site-modelo` inteira e dê a ela o nome do cliente.
2. Abra o `config.js` e troque:
   - `nome`, `slogan`, `descricao`
   - `cor` e `corEscura`: as cores da marca
   - `logo`: coloque o arquivo numa pasta `img/` e escreva o caminho, por exemplo `"img/logo.png"`
   - `whatsapp.numero`: **o mesmo número que está conectado ao CRM**, só números, com 55 + DDD, por exemplo `5511987654321`
   - Os textos de `hero`, `servicos`, `sobre`, `depoimentos`, `faq`, `cta` e `contato`
3. Para conferir, abra o `index.html` no navegador.
4. Publique (veja abaixo).

Depoimentos e FAQ são opcionais: deixe a lista vazia `[]` para esconder a seção.

## Saber de onde veio o lead

Cada botão pode mandar uma mensagem inicial diferente (`whatsapp.mensagens`). Exemplo: o botão principal envia "quero agendar" e o flutuante envia "tenho uma dúvida". No CRM, dá para usar essas frases nas regras de automação e na IA para identificar a origem e a intenção do lead.

## Onde publicar (grátis ou barato)

- **Netlify** ou **Vercel**: arraste a pasta do cliente no painel e o site fica no ar em segundos. Depois é só ligar o domínio do cliente.
- **Hostinger, HostGator ou qualquer hospedagem**: envie os arquivos para a pasta `public_html`.
- **GitHub Pages**: gratuito, se o cliente não precisar de painel de hospedagem.

O site é só HTML, CSS e JavaScript. Não precisa de servidor, banco de dados nem instalação.

## Chat do site

O balão no canto da tela abre um chat que:

1. dá as boas-vindas e mostra as perguntas frequentes;
2. responde dúvidas digitadas, buscando no `faq` do `config.js` (o campo `palavras` ajuda a reconhecer outras formas de perguntar);
3. quando o visitante quer falar com a empresa, pede o nome e a mensagem e abre o WhatsApp com tudo pronto. A conversa cai no CRM, onde a IA assume.

As opções ficam em `chat` no `config.js`: título, status, boas-vindas, texto do botão e abertura automática.

Qualquer botão com `data-abrir-chat` abre o chat, e também é possível abrir pelo JavaScript com `ChatDoSite.abrir()`.

### Modo canal (Fase 2)

Com `chat.crmUrl` e `chat.chave` preenchidos no `config.js`, o chat:

1. pede **nome**, **WhatsApp (obrigatório)** e a **autorização de contato** antes de começar;
2. conversa direto com o CRM, e a resposta da IA aparece dentro do site;
3. se o CRM não responder ou um limite for atingido, oferece continuar pelo WhatsApp.

O formulário e a conversa já estão prontos e testados contra um CRM simulado. As rotas do CRM (`/api/v1/webchat/...`) ainda vão ser construídas (ver `docs/specs/26-spec-webchat-nativo.md`). Até lá, deixe os dois campos vazios e o chat funciona no modo da Fase 1.
