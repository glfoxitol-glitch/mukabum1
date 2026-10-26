# Vídeo de apresentação: adicionar a voz

Esta pasta tem o vídeo animado de apresentação do produto (CRM + Site com IA) **sem narração** e tudo o que é preciso para colocar a voz.

| Arquivo | O que é |
|---|---|
| `video-sem-voz.mp4` | O vídeo pronto: 1920×1080, 30 fps, 82 s, com trilha e legendas na imagem |
| `trilha.m4a` | A trilha sonora sozinha (sem direitos autorais, gerada) |
| `narracao.json` | O texto da narração de cada uma das 10 cenas, com o segundo de início e de fim |
| `gerar-voz.py` | Gera um MP3 por cena (voz da Microsoft grátis, ou OpenAI) |
| `juntar-voz.py` | Coloca cada fala no início da sua cena, abaixa a trilha enquanto a voz fala e gera `video-com-voz.mp4` |
| `fonte/filme.html` | A animação original (HTML + CSS), para mudar textos, marca ou contato |
| `fonte/quadros.mjs` | Renderiza o `filme.html` quadro a quadro (Playwright), para gerar o vídeo de novo |

## Tarefa para o Codex

> Adicione a narração em português do Brasil ao `video-sem-voz.mp4` desta pasta, seguindo os passos abaixo, e entregue `video-com-voz.mp4`.

### 1. Preparar
```bash
cd marketing/video-apresentacao
python3 -m venv .venv && . .venv/bin/activate
pip install edge-tts          # ou: pip install openai
ffmpeg -version               # precisa estar instalado
```

### 2. Gerar a voz (uma das opções)
```bash
# Voz neural da Microsoft, grátis (precisa de internet com acesso a speech.platform.bing.com)
python3 gerar-voz.py --motor edge --voz pt-BR-AntonioNeural      # masculina
# python3 gerar-voz.py --motor edge --voz pt-BR-FranciscaNeural  # feminina

# ou API da OpenAI (paga)
# export OPENAI_API_KEY=...
# python3 gerar-voz.py --motor openai --voz onyx
```
Isso cria `voz/cena01.mp3` … `voz/cena10.mp3`. Se preferir a sua própria voz, grave cada cena com esses nomes e pule este passo.

### 3. Juntar a voz ao vídeo
```bash
python3 juntar-voz.py
```
Gera `video-com-voz.mp4`. Se aparecer `ATENÇÃO cena N: a fala tem Xs e a cena tem Ys`, acelere a voz (`--velocidade +12%` no edge) ou encurte o texto daquela cena em `narracao.json` e rode os passos 2 e 3 de novo.

### 4. Conferir
Assista ao `video-com-voz.mp4` inteiro: cada fala deve começar junto com a sua cena, e a trilha deve ficar baixa enquanto a voz fala.

## Mudar textos, marca ou contato

1. Edite `fonte/filme.html` (por exemplo: troque "Sua Loja", "CRM + Site com IA" e "Fale com a gente no WhatsApp").
2. Renderize de novo:
   ```bash
   cd fonte && npm i playwright && npx playwright install chromium
   mkdir -p q && node quadros.mjs video 30 q        # 2.460 quadros (82 s × 30 fps)
   ffmpeg -framerate 30 -i q/f%05d.jpg -i ../trilha.m4a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a copy -shortest ../video-sem-voz.mp4
   ```
   Para ir mais rápido, divida em partes: `node quadros.mjs video 30 q 0 615`, `615 1230`, `1230 1845`, `1845 2460`, rodando ao mesmo tempo.
3. Rode o passo 3 (juntar a voz) de novo.

## Mapa das cenas

| Cena | Tempo | Conteúdo |
|---|---|---|
| 1 | 0–7 s | Celular às 23:47 recebendo mensagens sem resposta |
| 2 | 7–16 s | O que é um CRM: cartões bagunçados se organizam no funil |
| 3 | 16–24 s | Por que ter um CRM: quatro benefícios |
| 4 | 24–34 s | IA respondendo no WhatsApp (conversa ilustrativa) |
| 5 | 34–45 s | Site sendo montado e conectado ao CRM e ao WhatsApp |
| 6 | 45–54 s | Agenda: dois clientes no mesmo horário, só um consegue |
| 7 | 54–62 s | Funil: clientes andando até "Vendido" |
| 8 | 62–68 s | Notificação de venda ganha no celular |
| 9 | 68–75 s | Tudo em órbita ao redor do CRM |
| 10 | 75–82 s | Chamada final |
