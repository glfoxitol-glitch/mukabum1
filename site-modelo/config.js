// ============================================================
//  CONFIGURAÇÃO DO SITE — edite só este arquivo para cada cliente
// ============================================================
window.SITE = {
  nome: "Clínica Sorriso",
  slogan: "Odontologia para toda a família",
  descricao: "Clínica odontológica com atendimento humanizado. Agende sua avaliação pelo WhatsApp.",

  // Cores da marca (formato #RRGGBB)
  cor: "#0f766e",
  corEscura: "#115e59",

  // Caminho do logo (ex.: "img/logo.png"). Deixe "" para usar a inicial do nome.
  logo: "",

  // O MESMO número conectado ao CRM, com DDI + DDD (só números)
  whatsapp: {
    numero: "5511999999999",
    // Mensagem que já vem escrita quando o visitante abre o WhatsApp
    mensagem: "Olá! Vim pelo site e gostaria de mais informações.",
    // Opcional: mensagens diferentes por botão (ajuda a saber de onde veio o lead no CRM)
    mensagens: {
      hero: "Olá! Vim pelo site e quero agendar uma avaliação.",
      flutuante: "Olá! Vim pelo site e tenho uma dúvida.",
      cta: "Olá! Vim pelo site e quero agendar.",
    },
    // Balão que aparece ao lado do botão flutuante ("" para desligar)
    balao: "Olá! 👋 Precisa de ajuda? Fale com a gente.",
  },

  // Chat dentro do site (balão no canto da tela)
  chat: {
    titulo: "Clínica Sorriso",            // nome no topo do chat
    status: "Online agora",
    boasVindas: "Olá! 👋 Sou o assistente da Clínica Sorriso. Como posso ajudar?",
    botaoFalar: "Agendar ou falar com a equipe",
    abrirSozinhoEm: 0,                   // segundos para abrir sozinho (0 = não abre)
  },

  hero: {
    selo: "Atendimento em até 5 minutos",
    titulo: "Seu sorriso bem cuidado, sem complicação",
    texto: "Avaliação, limpeza, clareamento e implantes com profissionais experientes. Agende direto pelo WhatsApp.",
    botao: "Agendar pelo WhatsApp",
    imagem: "", // ex.: "img/hero.jpg"
  },

  servicos: {
    titulo: "Nossos serviços",
    texto: "Tudo o que você precisa em um só lugar.",
    itens: [
      { icone: "🦷", nome: "Avaliação", descricao: "Consulta completa para entender o que seu sorriso precisa.", preco: "" },
      { icone: "✨", nome: "Clareamento", descricao: "Dentes mais brancos com técnicas seguras e acompanhamento.", preco: "A partir de R$ 490" },
      { icone: "🪥", nome: "Limpeza", descricao: "Remoção de tártaro e prevenção de cáries e gengivite.", preco: "" },
      { icone: "🔩", nome: "Implantes", descricao: "Recupere a função e a estética com implantes de qualidade.", preco: "" },
      { icone: "😁", nome: "Ortodontia", descricao: "Aparelhos fixos e alinhadores invisíveis.", preco: "" },
      { icone: "👶", nome: "Odontopediatria", descricao: "Cuidado especial e acolhedor para as crianças.", preco: "" },
    ],
  },

  sobre: {
    titulo: "Cuidado de verdade, do primeiro contato ao pós-tratamento",
    paragrafos: [
      "Somos uma clínica focada em atendimento humanizado e tecnologia moderna.",
      "Você tira dúvidas, recebe orçamentos e agenda tudo pelo WhatsApp, a qualquer hora.",
    ],
    numeros: [
      { valor: "10+", rotulo: "anos de experiência" },
      { valor: "5 mil", rotulo: "pacientes atendidos" },
      { valor: "4,9★", rotulo: "no Google" },
    ],
    imagem: "", // ex.: "img/equipe.jpg"
  },

  // Deixe a lista vazia [] para esconder a seção
  depoimentos: [
    { texto: "Fui super bem atendida, desde o WhatsApp até a consulta.", autor: "Mariana S." },
    { texto: "Respondem rápido e explicam tudo. Recomendo muito!", autor: "Carlos A." },
    { texto: "Meu filho perdeu o medo de dentista aqui.", autor: "Juliana P." },
  ],

  // Perguntas frequentes: aparecem no site E são respondidas pelo chat.
  // "palavras" (opcional) ajuda o chat a reconhecer outras formas de perguntar.
  // Deixe a lista vazia [] para esconder a seção.
  faq: [
    { pergunta: "Como faço para agendar?", resposta: "Clique em qualquer botão do WhatsApp. Respondemos na hora e marcamos o melhor horário para você.", palavras: "agendar marcar consulta horario" },
    { pergunta: "Vocês aceitam convênio?", resposta: "Trabalhamos com os principais convênios. Envie o nome do seu pelo WhatsApp que confirmamos.", palavras: "plano saude unimed amil" },
    { pergunta: "Quais as formas de pagamento?", resposta: "Pix, cartão de crédito em até 12x e débito.", palavras: "pagar parcelar cartao pix valor" },
    { pergunta: "Onde vocês ficam?", resposta: "Rua Exemplo, 123 — Centro, São Paulo/SP. Seg a Sex 8h às 19h e Sáb 8h às 12h.", palavras: "endereco local localizacao horario funcionamento" },
  ],

  cta: {
    titulo: "Pronto para cuidar do seu sorriso?",
    texto: "Fale agora com a nossa equipe e agende sua avaliação.",
  },

  contato: {
    endereco: "Rua Exemplo, 123 — Centro, São Paulo/SP",
    horario: "Seg a Sex 8h às 19h · Sáb 8h às 12h",
  },

  // Links das redes ("" para esconder)
  redes: {
    instagram: "https://instagram.com/",
    facebook: "",
    google: "",
  },
};
