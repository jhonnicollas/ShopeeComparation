// Pages Function: proxy /api/* to API Worker, serve static assets otherwise
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const apiUrl = `https://shopee-product-research-api.indiehomesungairaya.workers.dev${url.pathname}${url.search}`;
      const newHeaders = new Headers(request.headers);
      newHeaders.set("Origin", "https://shopee-product-research-web.pages.dev");
      newHeaders.delete("Host");

      const init = { method: request.method, headers: newHeaders };
      if (request.method !== "GET" && request.method !== "HEAD") {
        init.body = request.body;
      }

      const response = await fetch(apiUrl, init);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "https://shopee-product-research-web.pages.dev");
      responseHeaders.set("Access-Control-Allow-Credentials", "true");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Cookie");
      responseHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      const headers = new Headers(assetResponse.headers);
      headers.set("Cache-Control", "no-cache, must-revalidate");
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers,
      });
    }
    return new Response("Not found", { status: 404 });
  },
};
