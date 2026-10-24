/*
 * Vitrine de produtos do site.
 *
 * De onde vêm os produtos (o primeiro que existir):
 *   1. `SITE.catalogo.url`: o catálogo público do CRM (os mesmos produtos que a
 *      IA conhece no WhatsApp). Cadastrou no CRM, aparece aqui sozinho.
 *   2. `SITE.produtos`: lista escrita no config.js, para quem ainda não ligou o CRM.
 *
 * O botão "Comprar" de cada produto:
 *   - com o chat ligado ao CRM (modo canal), abre o chat já com o produto escrito;
 *   - senão, abre o WhatsApp da loja com a mensagem pronta.
 *
 * Formato esperado de `catalogo.url` (rota pública do CRM, a construir — ver
 * PLANO-DO-PRODUTO.md, Fase 2B):
 *   { "data": { "produtos": [ { "codigo", "nome", "descricao", "categoria",
 *       "preco_cents", "moeda", "foto_url", "disponivel" } ] } }
 */
(function () {
  var site = window.SITE;
  var secao = document.getElementById("produtos");
  if (!site || !secao) return;
  var conf = site.catalogo || {};
  var numero = String((site.whatsapp && site.whatsapp.numero) || "").replace(/\D/g, "");

  var css = [
    ".vt-filtros{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:24px}",
    ".vt-cats{display:flex;flex-wrap:wrap;gap:8px}",
    ".vt-cat{border:1.5px solid var(--borda);background:var(--fundo);color:var(--texto);padding:8px 14px;border-radius:999px;font:600 14px inherit;font-family:inherit;cursor:pointer}",
    ".vt-cat[aria-pressed=true]{background:var(--cor);border-color:var(--cor);color:#fff}",
    ".vt-busca{flex:1;min-width:200px;max-width:320px;border:1.5px solid var(--borda);background:var(--fundo);color:var(--texto);border-radius:999px;padding:10px 16px;font:15px inherit;font-family:inherit;outline:none}",
    ".vt-busca:focus{border-color:var(--cor)}",
    ".vt-grade{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}",
    ".vt-card{background:var(--fundo);border:1px solid var(--borda);border-radius:var(--raio);overflow:hidden;display:flex;flex-direction:column}",
    ".vt-foto{aspect-ratio:1/1;background:var(--fundo-alt);display:grid;place-items:center;font-size:2.6rem;overflow:hidden}",
    ".vt-foto img{width:100%;height:100%;object-fit:cover}",
    ".vt-info{padding:16px;display:flex;flex-direction:column;gap:6px;flex:1}",
    ".vt-info h3{font-size:1rem;line-height:1.3}",
    ".vt-info p{color:var(--texto-suave);font-size:.88rem;line-height:1.45;flex:1}",
    ".vt-preco{font-size:1.2rem;font-weight:800;color:var(--cor)}",
    ".vt-esgotado{font-size:.85rem;font-weight:600;color:#be123c}",
    ".vt-comprar{margin-top:8px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--whatsapp);color:#06301a;border:0;border-radius:999px;padding:11px 14px;font:700 14px inherit;font-family:inherit;cursor:pointer;text-decoration:none}",
    ".vt-comprar[aria-disabled=true]{background:var(--fundo-alt);color:var(--texto-suave);cursor:not-allowed}",
    ".vt-rotulo-curto{display:none}",
    ".vt-vazio{text-align:center;color:var(--texto-suave);padding:32px 0}",
    "@media (max-width:1000px){.vt-grade{grid-template-columns:repeat(3,1fr)}}",
    "@media (max-width:760px){.vt-grade{grid-template-columns:repeat(2,1fr);gap:12px}.vt-info{padding:12px}.vt-busca{max-width:none}.vt-rotulo-longo{display:none}.vt-rotulo-curto{display:inline}}",
  ].join("");
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
  }

  function preco(p) {
    if (typeof p.preco === "string") return p.preco;
    if (typeof p.preco_cents !== "number") return "";
    try {
      return (p.preco_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: p.moeda || "BRL" });
    } catch (e) {
      return "R$ " + (p.preco_cents / 100).toFixed(2).replace(".", ",");
    }
  }

  function textoDoPedido(p) {
    var v = preco(p);
    return "Olá! Tenho interesse no produto: " + p.nome + (p.codigo ? " (cód. " + p.codigo + ")" : "") +
      (v ? " — " + v : "") + ". Está disponível?";
  }

  function comprar(p) {
    var texto = textoDoPedido(p);
    if (window.ChatDoSite && window.ChatDoSite.conversaComCrm && window.ChatDoSite.abrirCom) {
      window.ChatDoSite.abrirCom(texto);
      return;
    }
    window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
  }

  var todos = [];
  var categoria = "";
  var termo = "";

  var titulo = secao.querySelector("h2");
  var subtitulo = secao.querySelector(".titulo-secao p");
  if (titulo) titulo.textContent = conf.titulo || "Nossos produtos";
  if (subtitulo) subtitulo.textContent = conf.texto || "Escolha o produto e fale com a gente para comprar.";

  var filtros = el("div", "vt-filtros");
  var cats = el("div", "vt-cats");
  var busca = el("input", "vt-busca");
  busca.type = "search";
  busca.placeholder = "Buscar produto…";
  busca.setAttribute("aria-label", "Buscar produto");
  filtros.appendChild(cats);
  filtros.appendChild(busca);
  var grade = el("div", "vt-grade");
  var lugar = secao.querySelector(".vt-lugar") || secao.querySelector(".container");
  lugar.appendChild(filtros);
  lugar.appendChild(grade);

  function normal(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function desenharCategorias() {
    var lista = [];
    todos.forEach(function (p) { if (p.categoria && lista.indexOf(p.categoria) < 0) lista.push(p.categoria); });
    cats.innerHTML = "";
    if (lista.length < 2) return;
    [""].concat(lista).forEach(function (c) {
      var b = el("button", "vt-cat", c || "Todos");
      b.type = "button";
      b.setAttribute("aria-pressed", String(c === categoria));
      b.onclick = function () { categoria = c; desenharCategorias(); desenhar(); };
      cats.appendChild(b);
    });
  }

  function desenhar() {
    var t = normal(termo);
    var visiveis = todos.filter(function (p) {
      if (categoria && p.categoria !== categoria) return false;
      return !t || normal(p.nome + " " + (p.descricao || "") + " " + (p.categoria || "")).indexOf(t) >= 0;
    });
    grade.innerHTML = "";
    if (!visiveis.length) {
      grade.appendChild(el("div", "vt-vazio", "Nenhum produto encontrado."));
      grade.firstChild.style.gridColumn = "1 / -1";
      return;
    }
    visiveis.forEach(function (p) {
      var card = el("article", "vt-card");
      var foto = el("div", "vt-foto");
      if (p.foto_url || p.foto) {
        var img = document.createElement("img");
        img.src = p.foto_url || p.foto;
        img.alt = p.nome;
        img.loading = "lazy";
        foto.appendChild(img);
      } else {
        foto.textContent = p.icone || "📦";
      }
      var info = el("div", "vt-info");
      info.appendChild(el("h3", null, p.nome));
      if (p.descricao) info.appendChild(el("p", null, p.descricao));
      var v = preco(p);
      if (v) info.appendChild(el("div", "vt-preco", v));
      var disponivel = p.disponivel !== false;
      if (!disponivel) info.appendChild(el("div", "vt-esgotado", "Esgotado"));
      var rotulo = disponivel ? (conf.botao || "Comprar pelo WhatsApp") : "Avise-me quando chegar";
      var botao = el("button", "vt-comprar");
      botao.appendChild(el("span", "vt-rotulo-longo", rotulo));
      botao.appendChild(el("span", "vt-rotulo-curto", disponivel ? (conf.botaoCurto || "Comprar") : "Avise-me"));
      botao.type = "button";
      botao.onclick = function () {
        if (disponivel) return comprar(p);
        var aviso = "Olá! Quero ser avisado quando o produto " + p.nome + " voltar ao estoque.";
        if (window.ChatDoSite && window.ChatDoSite.conversaComCrm && window.ChatDoSite.abrirCom) window.ChatDoSite.abrirCom(aviso);
        else window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(aviso), "_blank", "noopener");
      };
      info.appendChild(botao);
      card.appendChild(foto);
      card.appendChild(info);
      grade.appendChild(card);
    });
  }

  busca.addEventListener("input", function () { termo = busca.value; desenhar(); });

  function usar(lista) {
    todos = (lista || []).filter(function (p) { return p && p.nome; });
    var menu = document.getElementById("menu-produtos");
    if (!todos.length) { secao.style.display = "none"; if (menu) menu.hidden = true; return; }
    secao.style.display = "";
    if (menu) menu.hidden = false;
    desenharCategorias();
    desenhar();
  }

  if (conf.url) {
    fetch(conf.url, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (j) { usar(j && j.data && j.data.produtos); })
      // O CRM fora do ar não pode deixar a loja sem vitrine: cai na lista do config.js.
      .catch(function () { usar(site.produtos); });
  } else {
    usar(site.produtos);
  }
})();
