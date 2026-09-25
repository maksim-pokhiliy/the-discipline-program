#!/usr/bin/env node
import { createVerify } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const CAPTURES = join(HERE, "captures");
const BASE = process.env.MONOBANK_API_URL ?? "https://api.monobank.ua";
const ENV_FILE = join(REPO, "apps", "platform", ".env.local");

const USAGE = `mono-spike <command> [--key value] [--flag]

  details                                   merchant identity behind the token (test mode shows a test merchant)
  pubkey                                    webhook signing key; also written to captures/pubkey.pem
  invoice:create  --amount 100 [--webhook URL] [--redirect URL] [--save-card] [--wallet ID] [--reference REF] [--validity SEC]
  invoice:status  --id INVOICE
  invoice:cancel  --id INVOICE              refund / cancel a paid invoice
  invoice:remove  --id INVOICE              invalidate an unpaid link
  wallet:list     --wallet ID
  wallet:pay      --token CARDTOKEN --amount 100 [--kind merchant|client] [--webhook URL] [--redirect URL]
  wallet:delete   --token CARDTOKEN
  subscription:create   --amount 100 --interval 4w [--redirect URL] [--webhook URL] [--validity SEC] [--json '{...}']
  subscription:status   --id SUB
  subscription:payments --id SUB
  subscription:list     [--wallet ID]
  subscription:edit     --id SUB [--action cancel] [--refund 100]
  subscription:remove   --id SUB
  raw             --method GET|POST|DELETE --path /api/merchant/... [--json '{...}']
  webhook:listen  [--port 3999]             receive webhooks, verify x-sign against the pubkey, capture each hit
  verify          --file captures/<hit>.json  re-verify a captured webhook

Token: MONOBANK_MERCHANT_TOKEN from the environment, else from apps/platform/.env.local. Never printed.
Every request/response pair is written to initiatives/storefront-billing/spike/captures/ (gitignored).`;

const parseArgs = (argv) => {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
};

const loadToken = () => {
  if (!process.env.MONOBANK_MERCHANT_TOKEN) {
    try {
      process.loadEnvFile(ENV_FILE);
    } catch {
      /* the env var may come from the shell instead */
    }
  }
  const token = process.env.MONOBANK_MERCHANT_TOKEN;
  if (!token) {
    throw new Error(`MONOBANK_MERCHANT_TOKEN is not set; put it in ${ENV_FILE}`);
  }
  return token;
};

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

const capture = (name, data) => {
  mkdirSync(CAPTURES, { recursive: true });
  const file = join(CAPTURES, `${stamp()}-${name}.json`);
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
};

const call = async (method, path, body, query) => {
  const url = new URL(path, BASE);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const headers = { "X-Token": loadToken() };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  const record = {
    at: new Date().toISOString(),
    request: { method, url: url.toString(), body: body ?? null },
    response: { status: res.status, headers: Object.fromEntries(res.headers), body: parsed },
  };
  const name = `${method.toLowerCase()}-${url.pathname.replace(/^\/api\/merchant\//, "").replace(/\//g, "-")}`;
  const file = capture(name, record);
  console.log(`${method} ${url.pathname}${url.search} -> ${res.status}`);
  console.log(JSON.stringify(parsed, null, 2));
  console.log(`captured ${file}`);
  return parsed;
};

const amountOf = (args) => {
  const amount = Number(args.amount ?? 100);
  if (!Number.isInteger(amount) || amount < 0) throw new Error("--amount must be a non-negative integer in minor units (kopiykas)");
  return amount;
};

const basket = (amount, reference) => ({
  reference,
  destination: "Storefront billing spike",
  comment: "the-discipline-program storefront-billing 0.2",
  basketOrder: [{ name: "Training plan access (spike)", qty: 1, sum: amount, total: amount, unit: "шт.", code: "spike-plan" }],
});

const pemFromKey = (key) => {
  const decoded = Buffer.from(key, "base64").toString("utf8");
  return decoded.includes("-----BEGIN") ? decoded : `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----\n`;
};

const fetchPem = async () => {
  const res = await call("GET", "/api/merchant/pubkey");
  if (!res || typeof res.key !== "string") throw new Error("pubkey response has no `key`");
  const pem = pemFromKey(res.key);
  mkdirSync(CAPTURES, { recursive: true });
  writeFileSync(join(CAPTURES, "pubkey.pem"), pem);
  return pem;
};

const verifySignature = (pem, rawBody, xSign) => {
  if (!xSign) return { verified: false, reason: "no x-sign header" };
  try {
    const verifier = createVerify("SHA256");
    verifier.update(rawBody);
    return { verified: verifier.verify(pem, Buffer.from(xSign, "base64")) };
  } catch (error) {
    return { verified: false, reason: error instanceof Error ? error.message : String(error) };
  }
};

const listen = async (args) => {
  const port = Number(args.port ?? 3999);
  const pem = await fetchPem();
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");
      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        parsed = rawBody;
      }
      const xSign = req.headers["x-sign"];
      const check = verifySignature(pem, rawBody, typeof xSign === "string" ? xSign : undefined);
      const record = { at: new Date().toISOString(), method: req.method, url: req.url, headers: req.headers, rawBody, body: parsed, ...check };
      const file = capture("webhook", record);
      console.log(`${record.at} ${req.method} ${req.url} x-sign ${check.verified ? "VERIFIED" : `NOT verified (${check.reason ?? "bad signature"})`}`);
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`captured ${file}`);
      res.statusCode = 200;
      res.end("ok");
    });
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`webhook receiver on http://127.0.0.1:${port} — point the tunnel here; Ctrl-C to stop`);
  });
};

const verifyFile = (args) => {
  if (!args.file) throw new Error("--file is required");
  const record = JSON.parse(readFileSync(args.file, "utf8"));
  const pem = readFileSync(join(CAPTURES, "pubkey.pem"), "utf8");
  const xSign = record.headers?.["x-sign"];
  console.log(JSON.stringify(verifySignature(pem, record.rawBody, xSign), null, 2));
};

const commands = {
  details: () => call("GET", "/api/merchant/details"),
  pubkey: () => fetchPem(),
  "invoice:create": (args) => {
    const amount = amountOf(args);
    const reference = args.reference ?? `spike-${Date.now()}`;
    const body = {
      amount,
      ccy: 980,
      merchantPaymInfo: basket(amount, reference),
      redirectUrl: args.redirect,
      webHookUrl: args.webhook,
      validity: args.validity ? Number(args.validity) : undefined,
      paymentType: "debit",
      saveCardData: args["save-card"] ? { saveCard: true, walletId: args.wallet ?? `spike-wallet-${Date.now()}` } : undefined,
    };
    return call("POST", "/api/merchant/invoice/create", body);
  },
  "invoice:status": (args) => call("GET", "/api/merchant/invoice/status", undefined, { invoiceId: args.id }),
  "invoice:cancel": (args) => call("POST", "/api/merchant/invoice/cancel", { invoiceId: args.id }),
  "invoice:remove": (args) => call("POST", "/api/merchant/invoice/remove", { invoiceId: args.id }),
  "wallet:list": (args) => call("GET", "/api/merchant/wallet", undefined, { walletId: args.wallet }),
  "wallet:pay": (args) => {
    const amount = amountOf(args);
    const reference = args.reference ?? `spike-mit-${Date.now()}`;
    return call("POST", "/api/merchant/wallet/payment", {
      cardToken: args.token,
      amount,
      ccy: 980,
      initiationKind: args.kind ?? "merchant",
      redirectUrl: args.redirect,
      webHookUrl: args.webhook,
      merchantPaymInfo: basket(amount, reference),
      paymentType: "debit",
    });
  },
  "wallet:delete": (args) => call("DELETE", "/api/merchant/wallet/card", undefined, { cardToken: args.token }),
  "subscription:create": (args) => {
    const amount = amountOf(args);
    const extra = args.json ? JSON.parse(args.json) : {};
    return call("POST", "/api/merchant/subscription/create", {
      amount,
      ccy: 980,
      interval: args.interval ?? "4w",
      validity: args.validity ? Number(args.validity) : undefined,
      redirectUrl: args.redirect,
      webHookUrls: args.webhook ? { paymentUrl: args.webhook, statusUrl: args.webhook } : undefined,
      ...extra,
    });
  },
  "subscription:status": (args) => call("GET", "/api/merchant/subscription/status", undefined, { subscriptionId: args.id }),
  "subscription:payments": (args) => call("GET", "/api/merchant/subscription/payments", undefined, { subscriptionId: args.id }),
  "subscription:list": (args) => call("GET", "/api/merchant/subscription/list", undefined, { walletId: args.wallet }),
  "subscription:edit": (args) => call("POST", "/api/merchant/subscription/edit", { subscriptionId: args.id, action: args.action ?? "cancel", refundAmount: args.refund ? Number(args.refund) : undefined }),
  "subscription:remove": (args) => call("POST", "/api/merchant/subscription/remove", { subscriptionId: args.id }),
  raw: (args) => call((args.method ?? "GET").toUpperCase(), args.path, args.json ? JSON.parse(args.json) : undefined),
  "webhook:listen": listen,
  verify: verifyFile,
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const run = commands[command];
  if (!run) {
    console.log(USAGE);
    process.exitCode = command ? 1 : 0;
    return;
  }
  await run(args);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
