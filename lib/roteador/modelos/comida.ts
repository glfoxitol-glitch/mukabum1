/**
 * AS INTENÇÕES DE QUEM VENDE COMIDA COM ENTREGA OU RETIRADA — lanchonete,
 * pizzaria, restaurante, marmita, doceria, açaí.
 *
 * Difere da loja em dois pontos que mudam o atendimento: o pedido é decidido
 * em minutos e entregue em minutos (não há "agendar para quinta" na maioria
 * dos casos, e quem quer agendar diz isso), e "cadê meu pedido" chega 20
 * minutos depois de pedir, com fome — por isso acompanhar_pedido nunca vai
 * para o vendedor.
 *
 * Mesmas regras dos outros modelos: fronteiras nas duas pontas, nenhum exemplo
 * repetido, nenhum prato, ramo ou preço nomeado — o cardápio é o catálogo da
 * empresa.
 */
import type { ModeloDeRoteador } from "./tipos";

export const MODELO_COMIDA_COM_ENTREGA: ModeloDeRoteador = {
  id: "comida_com_entrega",
  nicho: "comida",
  rotulo: "Comida com entrega ou retirada",
  oQueFaz:
    "Separa quem quer fazer um pedido, quem quer ver o cardápio, quem acompanha um pedido feito e quem tem problema com o que recebeu, e manda cada um para o agente certo.",
  intencoes: [
    {
      nome: "fazer_pedido",
      descricao:
        "O cliente quer pedir: diz o que quer e a quantidade, monta o pedido, escolhe entrega ou retirada, pergunta a taxa de entrega ou quer pagar. Se ainda está vendo o que tem, é ver_cardapio. Se o pedido já foi feito, não é esta intenção",
      exemplos: [
        "quero pedir dois desse",
        "manda um combo para entrega",
        "vou retirar aí",
        "quanto fica a taxa para o meu endereço?",
        "pode fechar, vou pagar no pix",
      ],
      papel: "vendas",
    },
    {
      nome: "ver_cardapio",
      descricao:
        "O cliente ainda não sabe o que vai pedir: quer o cardápio, as opções do dia, promoções, sabores ou se tem opção para alguma restrição. Se já diz o que quer pedir, é fazer_pedido",
      exemplos: [
        "manda o cardápio",
        "o que tem hoje?",
        "tem promoção?",
        "quais sabores tem?",
        "tem opção sem lactose?",
      ],
      papel: "vendas",
    },
    {
      nome: "acompanhar_pedido",
      descricao:
        "O cliente já fez o pedido e quer saber quanto falta, se saiu para entrega, se o motoboy está perto, ou quer mudar algo de um pedido feito. Problema com o que chegou é suporte_pedido",
      exemplos: [
        "meu pedido vai demorar?",
        "já saiu para entrega?",
        "o motoboy está perto?",
        "esqueci de pedir sem cebola, ainda dá?",
        "pedi faz uma hora e nada",
      ],
      papel: "entrega",
    },
    {
      nome: "suporte_pedido",
      descricao:
        "O cliente recebeu o pedido e tem problema: veio errado, faltou item, chegou frio ou derramado, ou quer reembolso ou cancelar um pedido feito",
      exemplos: [
        "veio faltando um item",
        "chegou frio",
        "veio o pedido errado",
        "quero cancelar meu pedido",
        "quero reembolso",
      ],
      papel: "suporte",
    },
  ],
};

export const MODELOS_DE_COMIDA: readonly ModeloDeRoteador[] = [MODELO_COMIDA_COM_ENTREGA];
