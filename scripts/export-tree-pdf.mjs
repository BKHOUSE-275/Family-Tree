import { execFile } from "node:child_process";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artFile = "7a5e7b3d-93e5-43e1-8753-f2b8650c752e.png";
const chrome =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const CANOPY_EVEN = [
  { cx: 40.9, cy: 20.9, size: 8.6 },
  { cx: 60.6, cy: 21.0, size: 8.6 },
  { cx: 29.0, cy: 37.9, size: 8.6 },
  { cx: 69.6, cy: 38.6, size: 8.6 },
  { cx: 23.7, cy: 61.3, size: 8.6 },
  { cx: 38.8, cy: 64.6, size: 8.6 },
  { cx: 62.0, cy: 64.9, size: 8.6 },
  { cx: 77.7, cy: 60.2, size: 8.6 },
];

const ROOT_FATHER_ID = "felix-mitchell";
const ROOT_MOTHER_ID = "adaline-kiah";

function sortByBirth(people) {
  return [...people].sort((a, b) => {
    const rankA = birthRank(a);
    const rankB = birthRank(b);
    if (!rankA && !rankB) return 0;
    if (!rankA) return 1;
    if (!rankB) return -1;
    if (rankA.year !== rankB.year) return rankA.year - rankB.year;
    if (rankA.month !== rankB.month) return rankA.month - rankB.month;
    if (rankA.day !== rankB.day) return rankA.day - rankB.day;
    return `${a.givenName} ${a.surname}`.localeCompare(`${b.givenName} ${b.surname}`);
  });
}

function birthRank(person) {
  const raw = person.birthDate?.trim();
  if (!raw) return null;
  const year = raw.match(/\d{4}/);
  if (!year) return null;
  const monthNames = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, september: 9, oct: 10, october: 10,
    nov: 11, november: 11, dec: 12, december: 12,
  };
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  const monthDay = raw.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDay && monthNames[monthDay[1].toLowerCase()] != null) {
    return {
      year: Number(monthDay[3]),
      month: monthNames[monthDay[1].toLowerCase()],
      day: Number(monthDay[2]),
    };
  }
  const monthYear = raw.match(/^([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (monthYear && monthNames[monthYear[1].toLowerCase()] != null) {
    return {
      year: Number(monthYear[2]),
      month: monthNames[monthYear[1].toLowerCase()],
      day: 0,
    };
  }
  return { year: Number(year[0]), month: 0, day: 0 };
}

function sortSlotsForBirth(slots) {
  const rows = [];
  const sorted = [...slots].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  for (const slot of sorted) {
    const row = rows.find((group) => {
      const mean = group.reduce((sum, item) => sum + item.cy, 0) / group.length;
      return Math.abs(mean - slot.cy) <= 5;
    });
    if (row) row.push(slot);
    else rows.push([slot]);
  }
  return rows.flatMap((row) => [...row].sort((a, b) => a.cx - b.cx));
}

function uniquePeople(people) {
  const seen = new Set();
  return people.filter((person) => {
    if (seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  });
}

function childrenOf(snapshot, parentId) {
  const ids = snapshot.parentChildren
    .filter((link) => link.parentId === parentId)
    .map((link) => link.childId);
  return sortByBirth(
    uniquePeople(snapshot.people.filter((person) => ids.includes(person.id))),
  );
}

function initials(person) {
  const given = person.givenName.trim().charAt(0);
  const surname = person.surname?.trim().charAt(0) ?? "";
  return `${given}${surname}`.toUpperCase();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const snapshot = JSON.parse(
  await readFile(path.join(root, ".data", "family.json"), "utf8"),
);

const canopyPeople = sortByBirth(
  uniquePeople([
    ...childrenOf(snapshot, ROOT_FATHER_ID),
    ...childrenOf(snapshot, ROOT_MOTHER_ID),
  ]),
).slice(0, CANOPY_EVEN.length);

const canopySlots = sortSlotsForBirth(CANOPY_EVEN);
const nodes = canopyPeople
  .map((person, index) => {
    const slot = canopySlots[index];
    const surname = [person.surname, person.suffix].filter(Boolean).join(" ");
    const photo = person.photoUrl
      ? `<img src="${escapeHtml(person.photoUrl)}" alt="">`
      : escapeHtml(initials(person));
    return `
      <div class="node" style="left:${slot.cx}%;top:${slot.cy}%;width:${slot.size}%">
        <div class="portrait">
          <span class="initials">${photo}</span>
          <span class="name">
            <span>${escapeHtml(person.givenName)}</span>
            ${surname ? `<span>${escapeHtml(surname)}</span>` : ""}
          </span>
        </div>
      </div>`;
  })
  .join("");

const artUrl = pathToFileURL(path.join(root, "public", artFile)).href;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>The Story of Felix and Adaline Mitchell</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@700&display=swap" rel="stylesheet">
  <style>
    @page { size: 18in 12in; margin: 0; }
    html, body {
      margin: 0;
      width: 18in;
      height: 12in;
      background: #f4dfbd;
    }
    .tree {
      position: relative;
      width: 18in;
      height: 12in;
      overflow: hidden;
    }
    .tree > img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .node {
      position: absolute;
      transform: translate(-50%, -50%);
    }
    .portrait {
      position: relative;
      aspect-ratio: 1;
      width: 100%;
      overflow: hidden;
      border-radius: 50%;
      border: 5px solid #d95b16;
      background: #1a3d29;
      color: #fff8e7;
      box-shadow: 0 10px 22px rgba(68, 32, 13, 0.32);
    }
    .initials {
      position: absolute;
      left: 50%;
      top: 3%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      width: 52%;
      height: 52%;
      transform: translateX(-50%);
      border-radius: 50%;
      border: 1.5px solid #efa31a;
      background: #f4dfbd;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-weight: 700;
      font-size: 28px;
      color: #1a3d29;
    }
    .initials img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: grayscale(1);
    }
    .name {
      position: absolute;
      inset: 58% 2% 4%;
      font-family: "Cormorant Garamond", Georgia, serif;
      font-weight: 700;
      font-size: 15px;
      line-height: 1.1;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      text-align: center;
    }
    .name span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="tree">
    <img src="${artUrl}" alt="Felix and Adaline Mitchell family tree">
    ${nodes}
  </div>
</body>
</html>
`;

const outDir = path.join(root, "exports");
await mkdir(outDir, { recursive: true });
const htmlPath = path.join(outDir, "tree-print.html");
const pdfPath = path.join(outDir, "Felix-and-Adaline-Mitchell-family-tree.pdf");
await writeFile(htmlPath, html, "utf8");

const userDataDir = path.join(outDir, ".chrome-print-profile");
await mkdir(userDataDir, { recursive: true });

await execFileAsync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--disable-extensions",
    `--user-data-dir=${userDataDir}`,
    "--virtual-time-budget=8000",
    `--print-to-pdf=${pdfPath}`,
    pathToFileURL(htmlPath).href,
  ],
  { windowsHide: true },
);

await unlink(htmlPath).catch(() => {});

console.log(`Wrote ${pdfPath}`);
console.log(
  `People on the tree: ${canopyPeople.map((p) => `${p.givenName} ${[p.surname, p.suffix].filter(Boolean).join(" ")}`.trim()).join(", ")}`,
);
