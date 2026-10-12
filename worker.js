export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, env.API_ORIGIN);
    return fetch(new Request(target, request));
  },
};