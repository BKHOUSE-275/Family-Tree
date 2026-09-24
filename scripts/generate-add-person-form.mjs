/**
 * Prints scripts/add-person-form.html to forms/add-a-person.pdf.
 *
 * Uses the same Chrome/Edge DevTools print path as print-family-tree.mjs
 * so parchment backgrounds and webfonts survive in the PDF.
 *
 *   node scripts/generate-add-person-form.mjs
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(here, "add-person-form.html");
const OUT = resolve(here, "..", "forms", "add-a-person.pdf");
const PORT = 9334;

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

const browser = CANDIDATES.find(existsSync);
if (!browser) throw new Error("No Chrome/Edge binary found");
if (!existsSync(HTML)) throw new Error(`Missing form source: ${HTML}`);

mkdirSync(dirname(OUT), { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "ft-form-pdf-"));
const child = spawn(
  browser,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--force-device-scale-factor=1",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function debuggerUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const json = await res.json();
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {
      /* browser still starting */
    }
    await sleep(250);
  }
  throw new Error("Chrome did not expose a DevTools endpoint");
}

function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let id = 0;
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: ok, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : ok(msg.result);
    }
  });
  const ready = new Promise((ok, bad) => {
    ws.addEventListener("open", ok, { once: true });
    ws.addEventListener("error", bad, { once: true });
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((ok, bad) => {
      const msg = { id: ++id, method, params };
      if (sessionId) msg.sessionId = sessionId;
      pending.set(msg.id, { resolve: ok, reject: bad });
      ws.send(JSON.stringify(msg));
    });
  return { ws, send, ready };
}

try {
  const { ws, send, ready } = connect(await debuggerUrl());
  await ready;

  const { targetId } = await send("Target.createTarget", {
    url: pathToFileURL(HTML).href,
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });

  await send("Page.enable", {}, sessionId);
  await send("Runtime.enable", {}, sessionId);

  for (let i = 0; i < 80; i++) {
    const { result } = await send(
      "Runtime.evaluate",
      {
        expression:
          "document.fonts.ready.then(() => document.readyState === 'complete' && document.fonts.status === 'loaded')",
        awaitPromise: true,
      },
      sessionId,
    );
    if (result.value === true) break;
    await sleep(250);
  }
  await sleep(800);

  const { data } = await send(
    "Page.printToPDF",
    {
      landscape: false,
      printBackground: true,
      preferCSSPageSize: true,
      paperWidth: 8.5,
      paperHeight: 11,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      scale: 1,
      transferMode: "ReturnAsBase64",
    },
    sessionId,
  );

  writeFileSync(OUT, Buffer.from(data, "base64"));
  console.log(`wrote ${OUT}`);
  ws.close();
} finally {
  child.kill();
  await sleep(400);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* windows may still hold the profile lock */
  }
}
