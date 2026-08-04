#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const sourceFile = path.resolve(import.meta.dirname, ".source-compendiums", "daggerheart.journals.source.json");
const queueFile = process.argv[2] ?? "/tmp/daggerheart-journal-headings-queue.json";
const cacheFile = process.argv[3] ?? "/tmp/daggerheart-journal-headings-es.json";
const source = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
const headings = new Set();

for (const document of source.documents) {
  for (const page of document.pages ?? []) {
    for (const match of String(page.text?.content ?? "").matchAll(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi)) {
      const heading = match[1].replace(/<[^>]+>/g, "").replace(/&amp;/gi, "&").trim();
      if (heading && /[A-Za-z]/.test(heading)) headings.add(heading);
    }
  }
}

fs.writeFileSync(queueFile, `${JSON.stringify([...headings].map((source) => ({source, contexts: ["Encabezado del SRD"]})), null, 2)}\n`);
fs.writeFileSync(cacheFile, "{}\n");
console.log(`Preparados ${headings.size} encabezados.`);
