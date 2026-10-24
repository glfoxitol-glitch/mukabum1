/*
 * Chat do site: uma janela de conversa dentro da página.
 *
 * Fase 1 (este arquivo): o chat recebe o visitante, responde as perguntas
 * frequentes do config.js e, quando o visitante quer falar com a empresa,
 * pede nome + mensagem e continua a conversa no WhatsApp já com o contexto.
 * A conversa chega no CRM pelo número conectado, onde a IA assume.
 *
 * Fase 2 (planejada): as mensagens passam a ir direto para o CRM por um canal
 * "webchat" nativo, e a resposta da IA aparece aqui dentro, sem abrir o WhatsApp.
 *
 * Funciona sozinho em qualquer site: basta definir window.SITE (ver config.js)
 * e incluir <script src="chat.js"></script>.
 */
(function () {
  var site = window.SITE;
  if (!site || !site.whatsapp) return;
  var chat = site.chat || {};
  var numero = String(site.whatsapp.numero || "").replace(/\D/g, "");
  var CHAVE = "chat-site:" + numero;

  var txt = {
    titulo: chat.titulo || site.nome,
    status: chat.status || "Online agora",
    boasVindas: chat.boasVindas || "Olá! 👋 Como posso ajudar?",
    sugestoesTitulo: "Perguntas frequentes",
    falar: chat.botaoFalar || "Falar com a equipe",
    pedirNome: "Claro! Qual é o seu nome?",
    pedirMensagem: function (n) { return "Prazer, " + n + "! Conte em poucas palavras o que você precisa."; },
    pronto: "Perfeito! Vou te levar para o WhatsApp com a sua mensagem pronta. É só tocar em enviar. 📲",
    abrirWhats: "Continuar no WhatsApp",
    naoEntendi: "Não encontrei uma resposta pronta para isso. Quer falar direto com a nossa equipe?",
    placeholder: "Digite sua mensagem…",
  };

  // ---------- estilo (prefixo cs- para não colidir com o site) ----------
  var css = [
    ".cs-lancador{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:var(--cor,#0f766e);color:#fff;display:grid;place-items:center;box-shadow:0 10px 28px rgba(0,0,0,.25);transition:transform .15s}",
    ".cs-lancador:hover{transform:scale(1.06)}",
    ".cs-lancador svg{width:28px;height:28px}",
    ".cs-badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#e11d48;color:#fff;font:700 12px/20px system-ui,sans-serif;text-align:center}",
    ".cs-janela{position:fixed;right:20px;bottom:92px;z-index:2147483000;width:370px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:var(--fundo,#fff);color:var(--texto,#1c2321);border:1px solid var(--borda,#e2e8e6);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,.22);display:flex;flex-direction:column;overflow:hidden;font-family:inherit;opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .2s,transform .2s}",
    ".cs-janela.cs-aberta{opacity:1;transform:none;pointer-events:auto}",
    ".cs-topo{background:var(--cor,#0f766e);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px}",
    ".cs-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:grid;place-items:center;font-weight:800;flex-shrink:0;overflow:hidden}",
    ".cs-avatar img{width:100%;height:100%;object-fit:cover}",
    ".cs-topo strong{display:block;font-size:15px;line-height:1.2}",
    ".cs-topo small{font-size:12px;opacity:.9;display:flex;align-items:center;gap:6px}",
    ".cs-topo small::before{content:'';width:8px;height:8px;border-radius:50%;background:#4ade80}",
    ".cs-fechar{margin-left:auto;background:transparent;border:0;color:#fff;cursor:pointer;font-size:22px;line-height:1;padding:4px 8px;border-radius:8px}",
    ".cs-fechar:hover{background:rgba(255,255,255,.15)}",
    ".cs-corpo{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--fundo-alt,#f4f7f6)}",
    ".cs-msg{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;animation:cs-entra .2s ease}",
    ".cs-bot{background:var(--fundo,#fff);border:1px solid var(--borda,#e2e8e6);border-bottom-left-radius:4px;align-self:flex-start}",
    ".cs-eu{background:var(--cor,#0f766e);color:#fff;border-bottom-right-radius:4px;align-self:flex-end}",
    ".cs-digitando{display:flex;gap:4px;padding:14px}",
    ".cs-digitando span{width:7px;height:7px;border-radius:50%;background:var(--texto-suave,#5b6663);opacity:.5;animation:cs-pula 1s infinite}",
    ".cs-digitando span:nth-child(2){animation-delay:.15s}.cs-digitando span:nth-child(3){animation-delay:.3s}",
    ".cs-opcoes{display:flex;flex-wrap:wrap;gap:8px;align-self:flex-start;max-width:100%}",
    ".cs-opcao{background:transparent;border:1.5px solid var(--cor,#0f766e);color:var(--cor,#0f766e);padding:7px 12px;border-radius:999px;font:600 13px/1.2 inherit;font-family:inherit;cursor:pointer;text-align:left}",
    ".cs-opcao:hover{background:var(--cor,#0f766e);color:#fff}",
    ".cs-whats{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;background:#25d366;color:#06301a;text-decoration:none;font-weight:700;font-size:14px;padding:11px 16px;border-radius:999px}",
    ".cs-whats svg{width:18px;height:18px}",
    ".cs-rodape{display:flex;gap:8px;padding:12px;border-top:1px solid var(--borda,#e2e8e6);background:var(--fundo,#fff)}",
    ".cs-rodape input{flex:1;min-width:0;border:1px solid var(--borda,#e2e8e6);background:var(--fundo,#fff);color:inherit;border-radius:999px;padding:11px 15px;font:15px inherit;font-family:inherit;outline:none}",
    ".cs-rodape input:focus{border-color:var(--cor,#0f766e)}",
    ".cs-enviar{width:44px;height:44px;flex-shrink:0;border-radius:50%;border:0;background:var(--cor,#0f766e);color:#fff;cursor:pointer;display:grid;place-items:center}",
    ".cs-enviar svg{width:20px;height:20px}",
    ".cs-assina{text-align:center;font-size:11px;color:var(--texto-suave,#5b6663);padding:0 0 8px;background:var(--fundo,#fff)}",
    "@keyframes cs-entra{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}",
    "@keyframes cs-pula{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}",
    "@media (max-width:600px){.cs-janela{right:0;bottom:0;width:100vw;max-width:100vw;height:100%;max-height:100%;border-radius:0;border:0}.cs-lancador.cs-escondido{display:none}}",
    "@media (prefers-reduced-motion:reduce){.cs-msg,.cs-digitando span{animation:none}.cs-janela{transition:none}}",
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var ICONE_CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  var ICONE_ENVIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
  var ICONE_WHATS = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.7 6.5L3 29l6.7-1.7c1.9 1 4.1 1.6 6.3 1.6 7.2 0 13-5.8 13-13S23.2 3 16 3zm5.9 15.6c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.7 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>';

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ---------- estrutura ----------
  var lancador = el("button", "cs-lancador", ICONE_CHAT);
  lancador.setAttribute("aria-label", "Abrir chat");
  var badge = el("span", "cs-badge", "1");
  lancador.appendChild(badge);

  var janela = el("div", "cs-janela");
  janela.setAttribute("role", "dialog");
  janela.setAttribute("aria-label", "Chat com " + txt.titulo);
  var topo = el("div", "cs-topo");
  var avatar = el("div", "cs-avatar");
  if (site.logo) { var img = document.createElement("img"); img.src = site.logo; img.alt = ""; avatar.appendChild(img); }
  else avatar.textContent = site.nome.charAt(0);
  var info = el("div");
  var nomeEl = el("strong"); nomeEl.textContent = txt.titulo;
  var statusEl = el("small"); statusEl.textContent = txt.status;
  info.appendChild(nomeEl); info.appendChild(statusEl);
  var fechar = el("button", "cs-fechar", "&times;");
  fechar.setAttribute("aria-label", "Fechar chat");
  topo.appendChild(avatar); topo.appendChild(info); topo.appendChild(fechar);

  var corpo = el("div", "cs-corpo");
  corpo.setAttribute("aria-live", "polite");
  var rodape = el("form", "cs-rodape");
  var input = el("input");
  input.type = "text";
  input.placeholder = txt.placeholder;
  input.setAttribute("aria-label", "Mensagem");
  input.maxLength = 500;
  var enviar = el("button", "cs-enviar", ICONE_ENVIAR);
  enviar.type = "submit";
  enviar.setAttribute("aria-label", "Enviar");
  rodape.appendChild(input); rodape.appendChild(enviar);
  var assina = el("div", "cs-assina");
  assina.textContent = "Atendimento continua no WhatsApp";

  janela.appendChild(topo); janela.appendChild(corpo); janela.appendChild(rodape); janela.appendChild(assina);
  document.body.appendChild(janela);
  document.body.appendChild(lancador);

  // ---------- estado (sobrevive ao recarregar a página) ----------
  var estado = { etapa: "livre", nome: "", historico: [] };
  try { var salvo = JSON.parse(sessionStorage.getItem(CHAVE)); if (salvo) estado = salvo; } catch (e) {}
  function salvar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) {} }

  function rolar() { corpo.scrollTop = corpo.scrollHeight; }
  function bolha(texto, quem, gravar) {
    var m = el("div", "cs-msg " + (quem === "eu" ? "cs-eu" : "cs-bot"));
    m.textContent = texto;
    corpo.appendChild(m);
    if (gravar !== false) { estado.historico.push({ q: quem, t: texto }); salvar(); }
    rolar();
  }
  function botDiz(texto, depois) {
    var d = el("div", "cs-msg cs-bot cs-digitando", "<span></span><span></span><span></span>");
    corpo.appendChild(d); rolar();
    setTimeout(function () {
      d.remove();
      bolha(texto, "bot");
      if (depois) depois();
    }, Math.min(1200, 400 + texto.length * 12));
  }
  function opcoes(lista) {
    var box = el("div", "cs-opcoes");
    lista.forEach(function (o) {
      var b = el("button", "cs-opcao");
      b.type = "button";
      b.textContent = o.rotulo;
      b.onclick = function () { box.remove(); o.acao(); };
      box.appendChild(b);
    });
    corpo.appendChild(box); rolar();
  }
  function linkWhats(texto) {
    return "https://wa.me/" + numero + "?text=" + encodeURIComponent(texto);
  }
  function botaoWhats(texto) {
    var a = el("a", "cs-whats", ICONE_WHATS + "<span></span>");
    a.querySelector("span").textContent = txt.abrirWhats;
    a.href = linkWhats(texto);
    a.target = "_blank";
    a.rel = "noopener";
    corpo.appendChild(a); rolar();
  }

  // ---------- respostas ----------
  var faq = site.faq || [];
  function normalizar(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ");
  }
  var VAZIAS = { a: 1, o: 1, e: 1, de: 1, da: 1, do: 1, que: 1, como: 1, para: 1, com: 1, um: 1, uma: 1, os: 1, as: 1, no: 1, na: 1, voces: 1, vcs: 1, eu: 1, me: 1, meu: 1, minha: 1, qual: 1, quais: 1, faco: 1, tem: 1, ter: 1 };
  function palavras(s) {
    return normalizar(s).split(/\s+/).filter(function (p) { return p.length > 2 && !VAZIAS[p]; });
  }
  function buscarResposta(pergunta) {
    var alvo = palavras(pergunta);
    if (!alvo.length) return null;
    var melhor = null, nota = 0;
    faq.forEach(function (f) {
      var base = palavras(f.pergunta + " " + (f.palavras || ""));
      var n = 0;
      alvo.forEach(function (p) {
        base.forEach(function (b) { if (b === p || (p.length > 4 && b.indexOf(p.slice(0, 5)) === 0)) n++; });
      });
      if (n > nota) { nota = n; melhor = f; }
    });
    return nota > 0 ? melhor : null;
  }

  function menu() {
    var lista = faq.slice(0, 4).map(function (f) {
      return { rotulo: f.pergunta, acao: function () { bolha(f.pergunta, "eu"); botDiz(f.resposta, depoisDaResposta); } };
    });
    lista.push({ rotulo: "💬 " + txt.falar, acao: function () { bolha(txt.falar, "eu"); iniciarContato(); } });
    opcoes(lista);
  }
  function depoisDaResposta() {
    opcoes([
      { rotulo: "💬 " + txt.falar, acao: function () { bolha(txt.falar, "eu"); iniciarContato(); } },
      { rotulo: "Outra pergunta", acao: function () { bolha("Outra pergunta", "eu"); botDiz("Claro! Escolha abaixo ou digite sua dúvida.", menu); } },
    ]);
  }
  function iniciarContato() {
    if (estado.nome) { estado.etapa = "mensagem"; salvar(); botDiz(txt.pedirMensagem(estado.nome)); }
    else { estado.etapa = "nome"; salvar(); botDiz(txt.pedirNome); }
    input.focus();
  }
  function finalizar(mensagem) {
    estado.etapa = "livre"; salvar();
    var pagina = document.title + (location.protocol.indexOf("http") === 0 ? " (" + location.href.split("#")[0] + ")" : "");
    var texto = "Olá! Meu nome é " + estado.nome + ".\n" + mensagem + "\n\n— Enviado pelo chat do site " + pagina;
    botDiz(txt.pronto, function () { botaoWhats(texto); });
  }

  function aoEnviar(texto) {
    texto = texto.trim();
    if (!texto) return;
    bolha(texto, "eu");
    if (estado.etapa === "nome") {
      estado.nome = texto.slice(0, 60); estado.etapa = "mensagem"; salvar();
      botDiz(txt.pedirMensagem(estado.nome));
      return;
    }
    if (estado.etapa === "mensagem") { finalizar(texto); return; }
    var achou = buscarResposta(texto);
    if (achou) botDiz(achou.resposta, depoisDaResposta);
    else botDiz(txt.naoEntendi, function () {
      opcoes([
        { rotulo: "💬 Sim, falar com a equipe", acao: function () { bolha("Sim, falar com a equipe", "eu"); iniciarContato(); } },
        { rotulo: "Ver perguntas frequentes", acao: function () { bolha("Ver perguntas frequentes", "eu"); botDiz(txt.sugestoesTitulo + ":", menu); } },
      ]);
    });
  }

  rodape.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = input.value; input.value = "";
    aoEnviar(v);
  });

  // ---------- abrir / fechar ----------
  var iniciado = false;
  function abrir() {
    janela.classList.add("cs-aberta");
    lancador.classList.add("cs-escondido");
    lancador.setAttribute("aria-expanded", "true");
    badge.style.display = "none";
    if (!iniciado) {
      iniciado = true;
      if (estado.historico.length) {
        estado.historico.forEach(function (h) { bolha(h.t, h.q, false); });
        if (estado.etapa === "livre") menu();
      } else {
        botDiz(txt.boasVindas, menu);
      }
    }
    setTimeout(function () { input.focus(); }, 200);
  }
  function fecharJanela() {
    janela.classList.remove("cs-aberta");
    lancador.classList.remove("cs-escondido");
    lancador.setAttribute("aria-expanded", "false");
    lancador.focus();
  }
  lancador.addEventListener("click", function () { janela.classList.contains("cs-aberta") ? fecharJanela() : abrir(); });
  fechar.addEventListener("click", fecharJanela);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && janela.classList.contains("cs-aberta")) fecharJanela(); });
  document.querySelectorAll("[data-abrir-chat]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); abrir(); });
  });

  if (chat.abrirSozinhoEm > 0) {
    setTimeout(function () { if (!iniciado) abrir(); }, chat.abrirSozinhoEm * 1000);
  }
  window.ChatDoSite = { abrir: abrir, fechar: fecharJanela };
})();
