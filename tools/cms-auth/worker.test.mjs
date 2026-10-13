import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const env = {
  CLIENT_ID: "test-client",
  CLIENT_SECRET: "test-only-not-a-real-secret",
  SITE_ORIGIN: "https://nahyunlee.com",
  REPOSITORY: "leadtheworld/leadtheworld.github.io",
  ALLOWED_LOGIN: "leadtheworld",
};
const origin = "https://auth.example.test";
async function begin() {
  const response = await worker.fetch(new Request(origin + "/auth?provider=github&site_id=nahyunlee.com&scope=repo"), env);
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("Location"));
  assert.equal(location.origin, "https://github.com");
  assert.equal(location.searchParams.get("scope"), "public_repo");
  assert.equal(location.searchParams.get("code_challenge_method"), "S256");
  assert.equal(location.searchParams.get("redirect_uri"), origin + "/callback");
  const cookie = response.headers.get("Set-Cookie");
  for (const flag of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]) assert(cookie.includes(flag));
  return { state: location.searchParams.get("state"), challenge: location.searchParams.get("code_challenge"), cookie: cookie.split(";")[0] };
}
const callback = (session, query = "code=fake-code") =>
  new Request(origin + "/callback?state=" + session.state + "&" + query, { headers: { Cookie: session.cookie } });
test("unconfigured server, wrong site, missing and altered state fail closed", async () => {
  assert.equal((await worker.fetch(new Request(origin + "/auth"), {})).status, 503);
  assert.equal((await worker.fetch(new Request(origin + "/auth?provider=github&site_id=evil.test"), env)).status, 403);
  assert.equal((await worker.fetch(new Request(origin + "/callback?code=fake"), env)).status, 403);
  const session = await begin();
  assert.equal((await worker.fetch(callback({ ...session, state: "wrong-state" }), env)).status, 403);
  assert.equal((await worker.fetch(callback({ ...session, cookie: session.cookie + "corrupted" }), env)).status, 403);
  const now = Date.now;
  try {
    Date.now = () => now() + 700000;
    assert.equal((await worker.fetch(callback(session), env)).status, 403);
  } finally {
    Date.now = now;
  }
});
test("OAuth exchange verifies PKCE, account and repository access before returning a token", async () => {
  const original = globalThis.fetch;
  const session = await begin();
  let login = "leadtheworld",
    canPush = true,
    tokenCalls = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/access_token")) {
      tokenCalls++;
      const body = options.body;
      assert.equal(body.get("code"), "fake-code");
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body.get("code_verifier")));
      assert.equal(Buffer.from(hash).toString("base64url"), session.challenge);
      return Response.json({ access_token: "test-token" });
    }
    assert.equal(options.headers.Authorization, "Bearer test-token");
    return Response.json(url.endsWith("/user") ? { login } : { permissions: { push: canPush } });
  };
  try {
    const response = await worker.fetch(callback(session), env);
    const html = await response.text();
    assert(html.includes("authorization:github:success:"));
    assert(html.includes("test-token"));
    assert(html.includes("event.source !== window.opener"));
    assert(html.includes("event.origin !== origin"));
    assert(!html.includes('postMessage(result, "*")'));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert(response.headers.get("Content-Security-Policy").includes("frame-ancestors 'none'"));
    assert(response.headers.get("Set-Cookie").includes("Max-Age=0"));
    login = "other-user";
    let denied = await (await worker.fetch(callback(session), env)).text();
    assert(denied.includes("authorization:github:error:"));
    assert(!denied.includes("test-token"));
    login = "leadtheworld";
    canPush = false;
    denied = await (await worker.fetch(callback(session), env)).text();
    assert(denied.includes("authorization:github:error:"));
    assert(!denied.includes("test-token"));
    assert.equal(tokenCalls, 3);
  } finally {
    globalThis.fetch = original;
  }
});
test("cancellation and network failures do not disclose credentials", async () => {
  const session = await begin();
  const cancelled = await (await worker.fetch(callback(session, "error=access_denied"), env)).text();
  assert(cancelled.includes("authorization:github:error:"));
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error(env.CLIENT_SECRET);
  };
  try {
    const response = await worker.fetch(callback(session), env);
    assert.equal(response.status, 502);
    assert(!(await response.text()).includes(env.CLIENT_SECRET));
  } finally {
    globalThis.fetch = original;
  }
});
