// Pages Function: proxy all /api/* requests to the API Worker
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const apiUrl = `https://shopee-product-research-api.indiehomesungairaya.workers.dev${url.pathname}${url.search}`;

  const newHeaders = new Headers(context.request.headers);
  newHeaders.set("Origin", "https://shopee-product-research-web.pages.dev");
  newHeaders.delete("Host");

  const response = await fetch(apiUrl, {
    method: context.request.method,
    headers: newHeaders,
    body: context.request.method !== "GET" && context.request.method !== "HEAD" ? context.request.body : undefined,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Access-Control-Allow-Origin", "https://shopee-product-research-web.pages.dev");
  responseHeaders.set("Access-Control-Allow-Credentials", "true");
  responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Cookie");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}