/**
 * Prints scripts/family-tree-chart.html to family-tree.pdf.
 *
 * Standalone utility: not wired into the Next.js app and free of npm
 * dependencies. It drives an installed Chrome/Edge over the DevTools protocol
 * so that `printBackground` can be forced on, which `chrome --print-to-pdf`
 * does not allow.
 *
 *   node scripts/print-family-tree.mjs
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(here, process.argv[2] ?? "family-tree-chart.html");
const OUT = process.argv[3]
  ? resolve(here, process.argv[3])
  : resolve(here, "..", "family-tree.pdf");
const PORT = 9333;

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
if (!existsSync(HTML)) throw new Error(`Missing chart source: ${HTML}`);

const profile = mkdtempSync(join(tmpdir(), "ft-pdf-"));
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
  const events = [];
  let id = 0;
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve: ok, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : ok(msg.result);
    } else if (msg.method) {
      events.push(msg);
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
  return { ws, send, ready, events };
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

  // Wait for layout, webfonts and the rasterised parchment texture.
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
  await sleep(1200);

  const { data } = await send(
    "Page.printToPDF",
    {
      landscape: false, // page size already declares A2 landscape
      printBackground: true,
      preferCSSPageSize: true,
      paperWidth: 594 / 25.4, // A2 landscape fallback: 23.386in
      paperHeight: 420 / 25.4, // 16.535in
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
