/**
 * AS INTENÇÕES DE UMA LOJA QUE VENDE E ENTREGA — o "o que o cliente quer?" da
 * spec 27 §2.
 *
 * Não é uma tarefa nova do Jev, e a escolha é deliberada: o roteador de
 * intenção JÁ faz essa pergunta ao Jev a cada mensagem (`lib/ai/decisao/roteador.ts`,
 * tarefa `roteador`), com estados, aceite, régua de concordância e a IA de
 * sempre como reserva. Uma tarefa `intencao_da_loja` ao lado faria a mesma
 * pergunta duas vezes, com duas réguas e dois custos (anti-pattern 2 do
 * CLAUDE.md). O que faltava era o CONTEÚDO: as intenções de uma loja, escritas
 * de um jeito que o Jev separa sem ambiguidade. É isto.
 *
 * ⚠️ REGRAS QUE OS TEXTOS OBEDECEM, E QUE NÃO SÃO ESTILO:
 *
 * 1. **As fronteiras são ditas nas duas pontas.** "Comprar" e "ver catálogo"
 *    se parecem; a descrição de cada uma diz o que é DA OUTRA. Sem isso, a
 *    pergunta "tem celular até 1500?" cai ora numa, ora noutra, e a régua de
 *    concordância mede ruído.
 * 2. **Pedido JÁ FEITO nunca é compra.** "Cadê meu pedido" e "quero trocar"
 *    vão para quem cuida do pós-venda, nunca de volta para o vendedor.
 * 3. **Nenhum texto nomeia a loja, marca de produto ou preço.** Uma imagem
 *    serve todas as marcas (doutrina de marca própria), e o modelo é instalado
 *    em lojas de qualquer ramo.
 * 4. **Nenhum exemplo aparece em duas intenções**, conferido em `modelos.test.ts`.
 */
import type { ModeloDeRoteador } from "./tipos";

export const MODELO_LOJA_COM_ENTREGA: ModeloDeRoteador = {
  id: "loja_com_entrega",
  nicho: "loja",
  rotulo: "Loja que vende e entrega",
  oQueFaz:
    "Separa quem quer comprar, quem só quer ver opções, quem quer marcar a entrega, quem acompanha um pedido e quem precisa de suporte, e manda cada um para o agente certo.",
  intencoes: [
    {
      nome: "comprar",
      descricao:
        "O cliente quer comprar um produto que ele já sabe qual é: pergunta preço, disponibilidade ou forma de pagamento DESSE produto, pede para fechar o pedido ou diz que vai levar. Se ainda não escolheu e quer ver opções, é ver_catalogo. Se o pedido já foi feito, não é esta intenção",
      exemplos: [
        "quero comprar esse celular",
        "quanto está o fone que vi no site?",
        "tem o modelo de 256GB disponível?",
        "vou levar, como faço o pagamento?",
        "aceita pix nesse notebook?",
      ],
      papel: "vendas",
    },
    {
      nome: "ver_catalogo",
      descricao:
        "O cliente ainda não escolheu o produto: quer ver opções, uma categoria, novidades, promoções ou recomendação dentro de uma faixa de preço. Se ele já cita o produto que quer comprar, é comprar",
      exemplos: [
        "quais celulares vocês têm?",
        "me mostra os fones",
        "tem alguma promoção hoje?",
        "qual notebook você indica para estudar?",
        "tem celular até 1500?",
      ],
      papel: "vendas",
    },
    {
      nome: "agendar_entrega",
      descricao:
        "O cliente quer escolher, mudar ou confirmar o dia, o horário ou o endereço da entrega, ou pergunta sobre frete e se entregam na região dele. Se pergunta onde está um pedido que já saiu, é acompanhar_pedido",
      exemplos: [
        "pode entregar amanhã à tarde?",
        "quero mudar o horário da entrega",
        "vocês entregam no meu bairro?",
        "quanto fica o frete?",
        "o endereço de entrega é outro",
      ],
      papel: "entrega",
    },
    {
      nome: "acompanhar_pedido",
      descricao:
        "O cliente já fez um pedido e quer saber como ele está: se saiu para entrega, se está atrasado, quem vai entregar, ou pede a nota fiscal ou o comprovante. Mudar o horário combinado é agendar_entrega; produto com defeito é suporte_troca",
      exemplos: [
        "cadê meu pedido?",
        "o entregador já saiu?",
        "meu pedido está atrasado",
        "pode mandar a nota fiscal?",
        "já fiz o pagamento, quando chega?",
      ],
      papel: "entrega",
    },
    {
      nome: "suporte_troca",
      descricao:
        "O cliente tem problema com um produto que já recebeu: defeito, não funciona, veio errado, quer trocar, devolver, usar a garantia ou cancelar uma compra feita",
      exemplos: [
        "o fone parou de funcionar",
        "veio a cor errada",
        "quero trocar por outro modelo",
        "como funciona a garantia?",
        "quero cancelar a compra",
      ],
      papel: "suporte",
    },
  ],
};

export const MODELOS_DE_LOJA: readonly ModeloDeRoteador[] = [MODELO_LOJA_COM_ENTREGA];
