/**
 * Cliente HTTP autenticado compartilhado.
 * Preserva o cookie HttpOnly e utiliza o token Bearer
 * quando disponivel na sessao atual.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('dorange_token');
  const headers = new Headers(options.headers);

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  });
}