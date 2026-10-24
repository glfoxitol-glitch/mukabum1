/**
 * DE QUAL SITE O WIDGET PODE SER USADO (spec 26 §4.1).
 *
 * Isto NÃO é autenticação: `Origin` e `Referer` são forjáveis por quem chama a
 * rota fora de um navegador. O que a lista impede é o widget de uma empresa ser
 * embutido no site de outra — e a conta de IA da primeira pagar a conversa da
 * segunda. Quem segura abuso de verdade é o rate limit e o teto diário.
 *
 * Falha FECHADA: lista vazia recusa tudo. Uma empresa que ligou o chat e não
 * disse em qual site ele roda vê o aviso na tela de configuração, em vez de ter
 * um widget aberto para a internet inteira.
 */

/** `https://Loja.com.br:443/x` → `https://loja.com.br`. Inválido → `null`. */
export function normalizarOrigem(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    // `URL.host` já omite a porta padrão (443 em https, 80 em http).
    return `${url.protocol}//${url.host.toLowerCase()}`;
  } catch {
    return null;
  }
}

/**
 * Uma entrada da lista casa com a origem quando é igual, ou quando é
 * `https://*.loja.com.br` e a origem é um subdomínio dela. O curinga NÃO casa
 * com o domínio nu (`loja.com.br`), para que a lista diga isso explicitamente.
 */
function casa(entrada: string, origem: string): boolean {
  const curinga = /^(https?):\/\/\*\.(.+)$/i.exec(entrada.trim());
  if (curinga?.[1] && curinga[2]) {
    const protocolo = curinga[1];
    const dominio = curinga[2];
    const alvo = normalizarOrigem(origem);
    if (!alvo) return false;
    const url = new URL(alvo);
    return url.protocol === `${protocolo.toLowerCase()}:` && url.host.endsWith(`.${dominio.toLowerCase()}`);
  }
  return normalizarOrigem(entrada) === origem;
}

/**
 * Decide pela `Origin`; sem ela (alguns navegadores omitem em GET), pela origem
 * do `Referer`. Sem nenhuma das duas, recusa.
 */
export function origemPermitida(
  cabecalhos: { origin: string | null; referer: string | null },
  permitidas: readonly string[],
): boolean {
  if (permitidas.length === 0) return false;
  const origem = normalizarOrigem(cabecalhos.origin) ?? normalizarOrigem(cabecalhos.referer);
  if (!origem) return false;
  return permitidas.some((entrada) => casa(entrada, origem));
}
