#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "tools", ".source-compendiums");
const TRANSLATION_DIR = path.join(ROOT, "compendium");
const STRICT = process.env.STRICT === "1";
const DIRECT_VISIBLE_KEYS = new Set([
  "name", "description", "motivesAndTactics", "examples", "impulses",
  "backgroundQuestions", "connections", "content",
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function visible(value, keys) {
  if (typeof value !== "string" || !/[A-Za-z]/.test(value) || value.trim().length < 2) return false;
  const key = keys.at(-1);
  if (DIRECT_VISIBLE_KEYS.has(key)) return true;
  if (key === "value" && (keys.includes("weaponFeatures") || keys.includes("armorFeatures"))) return true;
  return key === "text" && keys.includes("results");
}

function collect(value, keys = [], output = []) {
  if (visible(value, keys)) output.push({keys, source: value});
  else if (Array.isArray(value)) value.forEach((child, index) => collect(child, [...keys, String(index)], output));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) collect(child, [...keys, key], output);
  }
  return output;
}

function translationPath(keys) {
  if (keys[0] === "system") return ["systemPatch", ...keys.slice(1)];
  if (keys[0] === "prototypeToken") return ["prototypeTokenPatch", ...keys.slice(1)];
  if (keys[0] === "flags") return ["flagsPatch", ...keys.slice(1)];
  return keys;
}

function getAt(object, keys) {
  let value = object;
  for (const key of keys) {
    if (Array.isArray(value) && /^\d+$/.test(key)) value = value[Number(key)];
    else value = value?.[key];
  }
  return value;
}

function protectedTokens(value) {
  if (typeof value !== "string") return [];
  const tokens = value.match(/@[A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]+\])?(?:\{[^}]*\})?|Compendium\.daggerheart\.[A-Za-z0-9_.]+|\[\[[^\]]+\]\]|\b\d*d\d+s?(?:\s*[+\-*/]\s*(?:\d+|@[A-Za-z0-9_.]+))*\b/gi) ?? [];
  return tokens.map((token) => token.startsWith("@") ? token.replace(/\{[^}]*\}$/, "") : token);
}

function plainText(value) {
  return String(value).replace(/<[^>]+>/g, " ").replace(/@[A-Za-z_][^\s<]*/g, " ");
}

const englishPattern = /\b(?:the|your|you|with|when|within|until|after|before|during|choose|make|take|deal|roll|range|damage|attack|hope|fear|stress|clear|gain|mark|spend|action|reaction|rest|ally|allies|enemy|enemies|minion|minions)\b/i;
const failures = [];
const residuals = [];
let documents = 0;
let folders = 0;
let fields = 0;

for (const sourceFile of fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".source.json")).sort()) {
  const source = readJson(path.join(SOURCE_DIR, sourceFile));
  const pack = source.collection.split(".").at(-1);
  const translatedFile = path.join(TRANSLATION_DIR, `daggerheart.${pack}.json`);
  if (!fs.existsSync(translatedFile)) {
    failures.push(`${pack}: falta el archivo de traducción`);
    continue;
  }
  const translated = readJson(translatedFile);
  folders += source.folders.length;
  for (const folder of source.folders) {
    if (!translated.folders?.[folder.name]) failures.push(`${pack}: carpeta sin traducción: ${folder.name}`);
  }
  for (const document of source.documents) {
    documents += 1;
    const entry = translated.entries?.[document._id];
    if (!entry) {
      failures.push(`${pack}/${document._id}: falta la entrada`);
      continue;
    }
    for (const {keys, source: english} of collect(document)) {
      fields += 1;
      const spanish = getAt(entry, translationPath(keys));
      const label = `${pack}/${document.name}/${keys.join(".")}`;
      if (typeof spanish !== "string" || !spanish.trim()) {
        failures.push(`${label}: falta la traducción`);
        continue;
      }
      const originalTokens = protectedTokens(english);
      const translatedTokens = protectedTokens(spanish);
      if (JSON.stringify(originalTokens) !== JSON.stringify(translatedTokens)) {
        failures.push(`${label}: referencias técnicas alteradas\n  EN ${JSON.stringify(originalTokens)}\n  ES ${JSON.stringify(translatedTokens)}`);
      }
      const plain = plainText(spanish);
      const englishMatch = plain.match(englishPattern);
      if (englishMatch) residuals.push(`${label} [${englishMatch[0]}]: ${plain.trim().slice(0, 180)}`);
    }
  }
}

console.log(`Compendios: 14 · documentos: ${documents} · carpetas: ${folders} · campos visibles: ${fields}`);
console.log(`Fallos estructurales/técnicos: ${failures.length}`);
console.log(`  Campos ausentes: ${failures.filter((failure) => failure.includes("falta la traducción")).length}`);
console.log(`  Referencias alteradas: ${failures.filter((failure) => failure.includes("referencias técnicas alteradas")).length}`);
for (const failure of failures.slice(0, 240)) console.log(`ERROR ${failure}`);
console.log(`Posibles restos de inglés: ${residuals.length}`);
for (const residual of residuals.slice(0, 80)) console.log(`REVISAR ${residual}`);
if (STRICT && failures.length) process.exit(1);
