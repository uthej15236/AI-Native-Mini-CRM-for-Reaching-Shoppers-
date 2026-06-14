// @ts-nocheck

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const getBackendBaseUrl = () => {
  const value = process.env.BACKEND_API_URL?.trim() ?? process.env.RENDER_BACKEND_URL?.trim();
  if (!value) {
    throw new Error("Missing BACKEND_API_URL");
  }

  return value.replace(/\/+$/, "");
};

const readRequestBody = async (req) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks);
};

const copyRequestHeaders = (sourceHeaders) => {
  const headers = new Headers();

  for (const [key, value] of Object.entries(sourceHeaders ?? {})) {
    if (!value) {
      continue;
    }

    if (hopByHopHeaders.has(key.toLowerCase()) || key.toLowerCase() === "host") {
      continue;
    }

    headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }

  return headers;
};

const copyResponseHeaders = (sourceHeaders, res) => {
  for (const [key, value] of sourceHeaders.entries()) {
    if (hopByHopHeaders.has(key.toLowerCase())) {
      continue;
    }

    res.setHeader(key, value);
  }
};

export default async function handler(req, res) {
  try {
    const backendBaseUrl = getBackendBaseUrl();
    const requestUrl = new URL(req.url ?? "/api", "http://localhost");
    const upstreamPath = requestUrl.pathname.replace(/^\/api\/?/, "");
    const targetUrl = new URL(upstreamPath, `${backendBaseUrl}/`);
    targetUrl.search = requestUrl.search;

    const upstream = await fetch(targetUrl, {
      method: req.method ?? "GET",
      headers: copyRequestHeaders(req.headers),
      body: await readRequestBody(req),
    });

    res.status(upstream.status);
    copyResponseHeaders(upstream.headers, res);

    if (upstream.status === 204 || upstream.status === 304 || req.method === "HEAD") {
      res.end();
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "API proxy failed.";
    res.status(500).json({
      success: false,
      message,
    });
  }
}
