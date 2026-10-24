/**
 * AS INTENÇÕES DE QUEM VENDE HORÁRIO — barbearia, salão, estética, estúdio,
 * consultório, oficina com hora marcada.
 *
 * O produto aqui é o HORÁRIO, e a agenda do CRM já cuida do que importa:
 * horário ocupado some da lista, a corrida é travada no banco e cada
 * profissional tem a própria jornada. O roteador só separa quem quer marcar de
 * quem quer mexer numa marcação, de quem tem dúvida e de quem reclama.
 *
 * Mesmas regras do modelo de loja: fronteiras ditas nas duas pontas, nenhum
 * exemplo em duas intenções, e nenhum texto nomeia o ramo, o serviço ou o
 * preço — o mesmo modelo serve a barbearia e o estúdio de tatuagem.
 */
import type { ModeloDeRoteador } from "./tipos";

export const MODELO_SERVICOS_COM_AGENDA: ModeloDeRoteador = {
  id: "servicos_com_agenda",
  nicho: "servicos",
  rotulo: "Serviço com horário marcado",
  oQueFaz:
    "Separa quem quer marcar um horário, quem quer remarcar ou cancelar, quem tem dúvida sobre serviços e preços e quem precisa de suporte, e manda cada um para o agente certo.",
  intencoes: [
    {
      nome: "marcar_horario",
      descricao:
        "O cliente quer marcar um horário novo: pergunta se tem vaga, escolhe dia, horário ou profissional. Se já tem horário marcado e quer mudar, é remarcar_ou_cancelar. Se só pergunta o que é feito ou quanto custa, é duvida_servico",
      exemplos: [
        "tem horário amanhã?",
        "quero marcar para sábado de manhã",
        "consigo encaixe hoje?",
        "quero agendar com o mesmo profissional da última vez",
        "qual o primeiro horário livre?",
      ],
      papel: "agenda",
    },
    {
      nome: "remarcar_ou_cancelar",
      descricao:
        "O cliente já tem um horário marcado e quer mudar o dia ou a hora, confirmar, avisar que vai atrasar ou cancelar. Marcar um horário novo é marcar_horario",
      exemplos: [
        "preciso remarcar meu horário",
        "vou atrasar uns 15 minutos",
        "não vou conseguir ir, pode cancelar?",
        "confirmo meu horário de amanhã",
        "dá para passar para mais tarde?",
      ],
      papel: "agenda",
    },
    {
      nome: "duvida_servico",
      descricao:
        "O cliente quer saber sobre os serviços antes de decidir: o que é feito, quanto custa, quanto tempo leva, formas de pagamento, endereço ou horário de funcionamento. Se já quer escolher dia e hora, é marcar_horario",
      exemplos: [
        "quanto custa?",
        "quais serviços vocês fazem?",
        "quanto tempo demora?",
        "onde fica?",
        "aceita cartão?",
      ],
      papel: "vendas",
    },
    {
      nome: "suporte_reclamacao",
      descricao:
        "O cliente reclama de um atendimento que já aconteceu, não ficou satisfeito, quer refazer, pede reembolso ou relata um problema com o serviço feito",
      exemplos: [
        "não gostei do resultado",
        "quero refazer",
        "fui mal atendido",
        "quero meu dinheiro de volta",
        "ficou diferente do que pedi",
      ],
      papel: "suporte",
    },
  ],
};

export const MODELOS_DE_SERVICOS: readonly ModeloDeRoteador[] = [MODELO_SERVICOS_COM_AGENDA];
