/* GitHub OAuth bridge for Decap CMS. Deploy independently of GitHub Pages.
 * CLIENT_SECRET stays in Worker secrets. Tokens are never logged or put in URLs.
 */
const COOKIE = "__Host-nahyun_oauth";
const encoder = new TextEncoder();
const base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const random = () => base64url(crypto.getRandomValues(new Uint8Array(32)));
const digest = async (value) => base64url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
const keyFor = (secret) => crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
const decode = (value) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function pack(payload, secret) {
  const data = base64url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await keyFor(secret), encoder.encode("nahyun-cms:" + data));
  return data + "." + base64url(signature);
}
async function unpack(value, secret) {
  try {
    const [data, signature, extra] = value.split(".");
    if (extra || !data || !signature) return null;
    const valid = await crypto.subtle.verify("HMAC", await keyFor(secret), decode(signature), encoder.encode("nahyun-cms:" + data));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode(data)));
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}
const cookie = (value, age = 600) => `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
const baseHeaders = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const text = (message, status = 400, clear = false) =>
  new Response(message, {
    status,
    headers: { ...baseHeaders, "Content-Type": "text/plain; charset=utf-8", ...(clear ? { "Set-Cookie": cookie("", 0) } : {}) },
  });
function finish(origin, result, success) {
  const nonce = random();
  const message = `authorization:github:${success ? "success" : "error"}:${JSON.stringify(result)}`;
  const literal = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><title>GitHub sign-in</title><p>Returning to your editor… You can close this window after sign-in.</p><script nonce="${nonce}">
  const origin = ${literal(origin)};
  const result = ${literal(message)};
  if (window.opener) {
    const onMessage = (event) => {
      if (event.origin !== origin || event.source !== window.opener || event.data !== "authorizing:github") return;
      window.removeEventListener("message", onMessage);
      window.opener.postMessage(result, origin);
    };
    window.addEventListener("message", onMessage);
    window.opener.postMessage("authorizing:github", origin);
  }
  </script></html>`,
    {
      headers: {
        ...baseHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Set-Cookie": cookie("", 0),
        "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      },
    }
  );
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== "GET") return text("Method not allowed", 405);
    if (!["/auth", "/callback"].includes(url.pathname)) return text("Not found", 404);
    if (!env.CLIENT_ID || !env.CLIENT_SECRET || !env.SITE_ORIGIN || !env.REPOSITORY || !env.ALLOWED_LOGIN) {
      return text("Authentication has not been configured.", 503);
    }
    let site;
    try {
      site = new URL(env.SITE_ORIGIN);
      if (site.origin !== env.SITE_ORIGIN || site.protocol !== "https:" || !/^[\w.-]+\/[\w.-]+$/.test(env.REPOSITORY)) throw new Error();
    } catch {
      return text("Invalid server configuration.", 503);
    }
    const callback = url.origin + "/callback";
    try {
      if (url.pathname === "/auth") {
        if (url.searchParams.get("provider") !== "github" || url.searchParams.get("site_id") !== site.hostname) {
          return text("This sign-in endpoint belongs to " + site.hostname + ".", 403);
        }
        const state = random(),
          verifier = random();
        const target = new URL("https://github.com/login/oauth/authorize");
        target.search = new URLSearchParams({
          client_id: env.CLIENT_ID,
          redirect_uri: callback,
          scope: "public_repo",
          state,
          code_challenge: await digest(verifier),
          code_challenge_method: "S256",
          allow_signup: "false",
        });
        const session = await pack({ state, verifier, exp: Date.now() + 600000 }, env.CLIENT_SECRET);
        return new Response(null, { status: 302, headers: { ...baseHeaders, Location: target.href, "Set-Cookie": cookie(session) } });
      }
      const raw = (request.headers.get("Cookie") || "")
        .split(/;\s*/)
        .find((item) => item.startsWith(COOKIE + "="))
        ?.slice(COOKIE.length + 1);
      const session = raw && (await unpack(raw, env.CLIENT_SECRET));
      if (!session || session.state !== url.searchParams.get("state"))
        return text("Sign-in expired or could not be verified. Close this window and try again.", 403, true);
      if (url.searchParams.has("error")) return finish(site.origin, { message: "GitHub sign-in was cancelled. Please try again." }, false);
      const code = url.searchParams.get("code");
      if (!code) return text("Missing authorization code.", 400, true);
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.CLIENT_ID,
          client_secret: env.CLIENT_SECRET,
          code,
          redirect_uri: callback,
          code_verifier: session.verifier,
        }),
      });
      const token = await response.json();
      if (!response.ok || !token.access_token) return finish(site.origin, { message: "GitHub could not complete sign-in. Please try again." }, false);
      const headers = { Authorization: "Bearer " + token.access_token, Accept: "application/vnd.github+json", "User-Agent": "nahyun-cms-auth" };
      const [identityResponse, repositoryResponse] = await Promise.all([
        fetch("https://api.github.com/user", { headers }),
        fetch("https://api.github.com/repos/" + env.REPOSITORY, { headers }),
      ]);
      if (!identityResponse.ok || !repositoryResponse.ok) return finish(site.origin, { message: "Unable to verify editing permissions." }, false);
      const identity = await identityResponse.json(),
        repository = await repositoryResponse.json();
      if (identity.login?.toLowerCase() !== env.ALLOWED_LOGIN.toLowerCase() || !repository.permissions?.push) {
        return finish(site.origin, { message: "This GitHub account does not have permission to edit this website." }, false);
      }
      return finish(site.origin, { token: token.access_token, provider: "github" }, true);
    } catch {
      return text("Sign-in is temporarily unavailable. Close this window and try again.", 502, true);
    }
  },
};
