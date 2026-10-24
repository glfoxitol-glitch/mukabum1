// ============================================================
//  EXEMPLO: loja de eletrônicos com vitrine e entrega agendada
//  Para usar: copie este arquivo por cima do config.js da pasta do cliente.
// ============================================================
window.SITE = {
  nome: "TecnoMais",
  slogan: "Eletrônicos com entrega no mesmo dia",
  descricao: "Celulares, fones, notebooks e acessórios com entrega agendada. Compre pelo WhatsApp.",

  cor: "#1d4ed8",
  corEscura: "#1e3a8a",
  logo: "",

  whatsapp: {
    numero: "5511999999999",
    mensagem: "Olá! Vim pelo site e quero comprar.",
    mensagens: {
      hero: "Olá! Vim pelo site e quero ver os produtos.",
      cta: "Olá! Vim pelo site e quero comprar com entrega.",
    },
    balao: "",
  },

  chat: {
    titulo: "TecnoMais",
    status: "Online agora",
    boasVindas: "Olá! 👋 Sou o assistente da TecnoMais. Posso te mostrar produtos e agendar a entrega.",
    botaoFalar: "Comprar ou agendar entrega",
    abrirSozinhoEm: 0,
    crmUrl: "",
    chave: "",
  },

  // Vitrine: com "url" preenchida, os produtos vêm do catálogo do CRM.
  catalogo: {
    url: "",            // ex.: "https://app.suamarca.com.br/api/v1/vitrine/<chave>/produtos"
    titulo: "Produtos em destaque",
    texto: "Escolha, fale com a gente e receba em casa no horário que preferir.",
    botao: "Comprar pelo WhatsApp",
  },

  // Usada enquanto o catálogo do CRM não estiver ligado (ou se ele falhar).
  produtos: [
    { codigo: "CEL-A55", nome: "Galaxy A55 128GB", categoria: "Celulares", descricao: "Tela 6,6\", câmera tripla 50MP, bateria 5000mAh.", preco_cents: 149900, icone: "📱" },
    { codigo: "CEL-MOTO", nome: "Moto G85 256GB", categoria: "Celulares", descricao: "Tela pOLED 120Hz, 8GB de RAM.", preco_cents: 129900, icone: "📱" },
    { codigo: "FON-BT", nome: "Fone Bluetooth JBL Tune", categoria: "Áudio", descricao: "Até 40h de bateria, graves reforçados.", preco_cents: 24990, icone: "🎧" },
    { codigo: "CX-GO", nome: "Caixa de Som JBL Go 4", categoria: "Áudio", descricao: "À prova d'água, 7h de bateria.", preco_cents: 29990, icone: "🔊", disponivel: false },
    { codigo: "NB-I5", nome: "Notebook Intel i5 16GB", categoria: "Informática", descricao: "SSD 512GB, tela 15,6\" Full HD.", preco_cents: 349900, icone: "💻" },
    { codigo: "CAR-65W", nome: "Carregador Turbo 65W", categoria: "Acessórios", descricao: "USB-C, carrega celular e notebook.", preco_cents: 12990, icone: "🔌" },
    { codigo: "PEL-A55", nome: "Película + Capinha A55", categoria: "Acessórios", descricao: "Kit proteção completo.", preco_cents: 5990, icone: "🛡️" },
    { codigo: "SMW-FIT", nome: "Smartwatch Fit 3", categoria: "Acessórios", descricao: "Monitor cardíaco, GPS e 14 dias de bateria.", preco_cents: 39990, icone: "⌚" },
  ],

  hero: {
    selo: "🚚 Entrega agendada no mesmo dia",
    titulo: "Tecnologia na sua casa, no horário que você escolher",
    texto: "Escolha o produto, fale com a gente pelo WhatsApp e agende a entrega. Simples assim.",
    botao: "Comprar pelo WhatsApp",
    imagem: "",
  },

  servicos: {
    titulo: "Por que comprar na TecnoMais",
    texto: "Atendimento rápido e entrega sem complicação.",
    itens: [
      { icone: "🚚", nome: "Entrega agendada", descricao: "Você escolhe o dia e o horário. Sem ficar esperando o dia todo." },
      { icone: "💳", nome: "Pague como quiser", descricao: "Pix, cartão em até 12x ou na entrega." },
      { icone: "🛡️", nome: "Garantia", descricao: "Todos os produtos com nota fiscal e garantia." },
    ],
  },

  sobre: {
    titulo: "Atendimento de verdade, do pedido à entrega",
    paragrafos: [
      "Somos uma loja da sua região, com estoque próprio e entregadores próprios.",
      "Pelo WhatsApp você tira dúvidas, recebe fotos, fecha o pedido e agenda a entrega.",
    ],
    numeros: [
      { valor: "2h", rotulo: "entrega mais rápida" },
      { valor: "12x", rotulo: "sem juros" },
      { valor: "4,8★", rotulo: "no Google" },
    ],
    imagem: "",
  },

  depoimentos: [
    { texto: "Pedi pelo WhatsApp de manhã e chegou à tarde, no horário que escolhi.", autor: "Rafael M." },
    { texto: "Me mandaram fotos de tudo antes de comprar. Atendimento nota 10.", autor: "Patrícia L." },
  ],

  faq: [
    { pergunta: "Como funciona a entrega?", resposta: "Depois do pedido, mostramos os horários livres e você escolhe o dia e a faixa de horário. Cada horário atende um número limitado de entregas, então reserve cedo.", palavras: "entrega entregar horario agendar frete" },
    { pergunta: "Qual o valor do frete?", resposta: "Grátis acima de R$ 199 na cidade. Abaixo disso, informamos o valor pelo WhatsApp conforme o bairro.", palavras: "frete taxa valor entrega gratis" },
    { pergunta: "Quais as formas de pagamento?", resposta: "Pix, cartão de crédito em até 12x ou pagamento na entrega.", palavras: "pagar parcelar cartao pix" },
    { pergunta: "Os produtos têm garantia?", resposta: "Sim, todos com nota fiscal e garantia do fabricante.", palavras: "garantia nota fiscal defeito troca" },
  ],

  cta: {
    titulo: "Escolheu? A gente entrega hoje.",
    texto: "Fale com a gente e agende o melhor horário para receber.",
  },

  contato: {
    endereco: "Av. Exemplo, 456 — Centro, São Paulo/SP",
    horario: "Seg a Sáb 9h às 20h",
  },

  redes: { instagram: "https://instagram.com/", facebook: "", google: "" },
};
