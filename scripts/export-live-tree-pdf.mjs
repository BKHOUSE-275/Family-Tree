import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "exports");
await mkdir(outDir, { recursive: true });

const pdfPath = path.join(outDir, "Felix-and-Adaline-Mitchell-family-tree.pdf");
const previewPath = path.join(outDir, "tree-preview.png");

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--hide-scrollbars"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1400, deviceScaleFactor: 2 });
  await page.goto("http://localhost:3000/", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForSelector("#family-tree img", { timeout: 20000 });
  await page.waitForFunction(() => {
    const img = document.querySelector("#family-tree img");
    return img && img.complete && img.naturalWidth > 0;
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.getElementById("family-tree")?.scrollIntoView({ block: "start" });
  });
  await new Promise((resolve) => setTimeout(resolve, 800));

  const tree = await page.$("#family-tree");
  if (!tree) throw new Error("Could not find #family-tree");
  await tree.screenshot({ path: previewPath, type: "png" });

  await page.evaluate(() => {
    const treeEl = document.getElementById("family-tree");
    if (!treeEl) return;
    document.body.replaceChildren(treeEl);
    document.documentElement.style.background = "#f7e0c4";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.background = "#f7e0c4";
    document.body.style.overflow = "hidden";
  });

  await page.pdf({
    path: pdfPath,
    printBackground: true,
    landscape: true,
    width: "18in",
    height: "12in",
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: false,
  });

  console.log(`Wrote ${pdfPath}`);
  console.log(`Preview ${previewPath}`);
} finally {
  await browser.close();
}
