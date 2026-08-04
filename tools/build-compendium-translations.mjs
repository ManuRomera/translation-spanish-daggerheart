#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_DIR = path.join(ROOT, "tools", ".source-compendiums");
const REFERENCE_DIR = path.resolve(ROOT, "..", "fvtt-daggerheart-es", "compendium");
const REFERENCE_SOURCE_DIR = process.env.DAGGERHEART_REFERENCE_SOURCE
  ?? "/tmp/daggerheart-system-2.5.4/src/packs";
const CACHE_FILE = path.join(ROOT, "tools", ".compendium-translation-cache.json");
const QUEUE_FILE = path.join(ROOT, "tools", ".compendium-translation-queue.json");
const OVERRIDES_FILE = path.join(ROOT, "tools", "compendium-overrides.json");
const OUTPUT_DIR = path.join(ROOT, "compendium");

const PACK_LABELS = {
  classes: "Clases", subclasses: "Subclases", domains: "Dominios", ancestries: "Linajes",
  communities: "Comunidades", weapons: "Armas", armors: "Armaduras", consumables: "Consumibles",
  loot: "Botín", adversaries: "Adversarios", environments: "Entornos", journals: "Diarios",
  rolltables: "Tablas aleatorias", beastforms: "Formas bestiales",
};

const DIRECT_VISIBLE_KEYS = new Set([
  "name", "description", "motivesAndTactics", "examples", "impulses",
  "backgroundQuestions", "connections", "content",
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function getAt(object, dottedPath) {
  return dottedPath.split(".").reduce((value, key) => value?.[key], object);
}

function setAt(object, keys, value) {
  let cursor = object;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const nextKey = keys[index + 1];
    if (cursor[key] == null) cursor[key] = /^\d+$/.test(nextKey) ? [] : {};
    cursor = cursor[key];
  }
  cursor[keys.at(-1)] = value;
}

function cleanReferenceHtml(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/<</g, "<")
    .replace(/(?:<br\s*\/?>(?:\s|&nbsp;)*){2}<p([^>]*)>/gi, "</p><p$1>")
    .replace(/<p><\/p>\s*$/g, "")
    .replace(/<\/p><\/p>/g, "</p>")
    .replace(/<p>\s*<p/g, "<p")
    .replace(/<\/p>\s*<\/p>/g, "</p>");
}

function protectedReferenceTokens(value) {
  if (typeof value !== "string") return [];
  return value.match(/@[A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]+\])?(?:\{[^}]*\})?|Compendium\.daggerheart\.[A-Za-z0-9_.]+|\[\[[^\]]+\]\]|\b\d*d\d+s?(?:\s*[+\-*/]\s*(?:\d+|@[A-Za-z0-9_.]+))*\b|\b\d+(?:[.,]\d+)?\b/gi) ?? [];
}

function referenceTextIsCompatible(currentEnglish, referenceEnglish, translated) {
  return currentEnglish === referenceEnglish
    && JSON.stringify(protectedReferenceTokens(currentEnglish)) === JSON.stringify(protectedReferenceTokens(translated));
}

function loadReferences() {
  const translations = new Map();
  const folders = new Map();
  const english = new Map();
  if (fs.existsSync(REFERENCE_SOURCE_DIR)) {
    for (const pack of fs.readdirSync(REFERENCE_SOURCE_DIR)) {
      const packDir = path.join(REFERENCE_SOURCE_DIR, pack);
      if (!fs.statSync(packDir).isDirectory()) continue;
      const index = new Map();
      for (const file of fs.readdirSync(packDir).filter((name) => name.endsWith(".json") && !name.startsWith("folders_"))) {
        const document = readJson(path.join(packDir, file));
        if (document._id) index.set(document._id, document);
        if (document.name) index.set(document.name, document);
      }
      english.set(pack, index);
    }
  }
  if (!fs.existsSync(REFERENCE_DIR)) return {translations, folders, english};

  for (const file of fs.readdirSync(REFERENCE_DIR).filter((name) => /^daggerheart\..+\.json$/.test(name))) {
    const pack = file.replace(/^daggerheart\./, "").replace(/\.json$/, "");
    if (pack === "_packs-folders") continue;
    const data = readJson(path.join(REFERENCE_DIR, file));
    const packMap = new Map();
    for (const [sourceKey, entry] of Object.entries(data.entries ?? {})) {
      const patch = {};
      for (const [field, translated] of Object.entries(entry)) {
        let destination;
        if (field === "name") destination = ["name"];
        else if (data.mapping?.[field] && typeof data.mapping[field] === "string") destination = data.mapping[field].split(".");
        else if (field === "description") destination = ["system", "description"];
        else continue;
        setAt(patch, destination, cleanReferenceHtml(translated));
      }
      packMap.set(sourceKey, patch);
    }
    translations.set(pack, packMap);
    folders.set(pack, new Map(Object.entries(data.folders ?? {})));
  }
  return {translations, folders, english};
}

function isVisibleString(value, keys) {
  if (typeof value !== "string" || !/[A-Za-z]/.test(value) || value.trim().length < 2) return false;
  const key = keys.at(-1);
  const parent = keys.at(-2);
  if (DIRECT_VISIBLE_KEYS.has(key)) return true;
  if (key === "value" && ["weaponFeatures", "armorFeatures"].some((part) => keys.includes(part))) return true;
  if (key === "text" && keys.includes("results")) return true;
  return false;
}

function collectVisibleStrings(value, keys = [], output = []) {
  if (isVisibleString(value, keys)) output.push({keys, source: value});
  else if (Array.isArray(value)) value.forEach((child, index) => collectVisibleStrings(child, [...keys, String(index)], output));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) collectVisibleStrings(child, [...keys, key], output);
  }
  return output;
}

function mergePatch(target, patch) {
  if (Array.isArray(patch)) return patch.map((value) => structuredClone(value));
  if (!patch || typeof patch !== "object") return patch;
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object" || Array.isArray(target[key])) target[key] = {};
      mergePatch(target[key], value);
    } else target[key] = structuredClone(value);
  }
  return target;
}

function deriveReferenceMemory(sourceDoc, referencePatch, memory) {
  for (const {keys, source} of collectVisibleStrings(referencePatch)) {
    const original = getAt(sourceDoc, keys.join("."));
    if (typeof original === "string" && original !== source) memory.set(original, source);
  }
}

function getReferencePatch(pack, document, references) {
  const candidates = references.translations.get(pack);
  if (!candidates) return {};
  const candidate = structuredClone(candidates.get(document.name) ?? candidates.get(document._id) ?? {});
  const referenceDocument = references.english.get(pack)?.get(document.name)
    ?? references.english.get(pack)?.get(document._id);
  const compatible = {};
  if (candidate.name && candidate.name !== document.name) compatible.name = candidate.name;
  if (!referenceDocument) return compatible;
  for (const {keys, source: translated} of collectVisibleStrings(candidate)) {
    if (keys.length === 1 && keys[0] === "name") continue;
    const currentEnglish = getAt(document, keys.join("."));
    const referenceEnglish = getAt(referenceDocument, keys.join("."));
    if (typeof currentEnglish === "string" && referenceTextIsCompatible(currentEnglish, referenceEnglish, translated)) {
      setAt(compatible, keys, translated);
    }
  }
  return compatible;
}

function makeEntry(document, referencePatch, cache, queue, stats) {
  const entry = {_id: document._id};
  mergePatch(entry, referencePatch);

  for (const {keys, source} of collectVisibleStrings(document)) {
    if (keys[0] === "_stats") continue;
    const existing = getAt(entry, keys.join("."));
    if (typeof existing === "string" && existing !== source) {
      stats.reference += source.length;
      continue;
    }
    const translated = cache[source];
    if (typeof translated === "string" && translated.trim()) {
      setAt(entry, keys, translated);
      stats.cache += source.length;
    } else {
      queue.set(source, {source, contexts: []});
      stats.pending += source.length;
    }
  }
  addEmbeddedIds(document, entry);
  return entry;
}

function addEmbeddedIds(source, patch) {
  for (const field of ["effects", "items", "pages", "results"]) {
    if (!Array.isArray(patch?.[field]) || !Array.isArray(source?.[field])) continue;
    patch[field].forEach((child, index) => {
      if (!child || typeof child !== "object") return;
      const sourceChild = source[field][index];
      if (sourceChild?._id) child._id = sourceChild._id;
      addEmbeddedIds(sourceChild, child);
    });
  }
}

function main() {
  const command = process.argv[2] ?? "prepare";
  if (!["prepare", "build"].includes(command)) {
    console.error("Uso: node tools/build-compendium-translations.mjs [prepare|build]");
    process.exit(1);
  }

  const references = loadReferences();
  const cache = fs.existsSync(CACHE_FILE) ? readJson(CACHE_FILE) : {};
  const overrides = fs.existsSync(OVERRIDES_FILE) ? readJson(OVERRIDES_FILE) : {};
  // Una cadena idéntica a la inglesa no cuenta como traducción. Algunas fuentes
  // antiguas usaban el original como marcador y ocultaban omisiones reales.
  for (const [source, translated] of Object.entries(cache)) {
    if (translated === source && !(source in overrides)) delete cache[source];
  }
  Object.assign(cache, overrides);
  const memory = new Map(Object.entries(cache));
  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".source.json")).sort();

  // Crea memoria reutilizable a partir de cada traducción humana que coincide con el sistema actual.
  for (const file of sourceFiles) {
    const source = readJson(path.join(SOURCE_DIR, file));
    const pack = source.collection.split(".").at(-1);
    for (const document of source.documents) deriveReferenceMemory(document, getReferencePatch(pack, document, references), memory);
  }
  for (const [source, translated] of memory) if (source !== translated) cache[source] = translated;

  const queue = new Map();
  const outputs = [];
  const stats = {reference: 0, cache: 0, pending: 0, documents: 0, folders: 0};
  for (const file of sourceFiles) {
    const source = readJson(path.join(SOURCE_DIR, file));
    const pack = source.collection.split(".").at(-1);
    const entries = {};
    for (const document of source.documents) {
      const entry = makeEntry(document, getReferencePatch(pack, document, references), cache, queue, stats);
      entries[document._id] = entry;
      stats.documents += 1;
      for (const pending of queue.values()) {
        if (pending.contexts.length < 3 && collectVisibleStrings(document).some(({source: text}) => text === pending.source)) {
          pending.contexts.push(`${pack}: ${document.name}`);
        }
      }
    }

    const folderTranslations = references.folders.get(pack) ?? new Map();
    const folders = {};
    for (const folder of source.folders) {
      const translated = folderTranslations.get(folder.name) ?? cache[folder.name];
      if (translated && (translated !== folder.name || folder.name in overrides)) folders[folder.name] = translated;
      else queue.set(folder.name, {source: folder.name, contexts: [`${pack}: carpeta`]});
      stats.folders += 1;
    }

    const nameCounts = new Map(source.documents.map((document) => [
      document.name,
      source.documents.filter((candidate) => candidate.name === document.name).length,
    ]));
    const entriesWithNameAliases = {...entries};
    for (const document of source.documents) {
      if (nameCounts.get(document.name) === 1) entriesWithNameAliases[document.name] = entries[document._id];
    }

    outputs.push({
      file: `daggerheart.${pack}.json`,
      data: {
        label: PACK_LABELS[pack] ?? source.label,
        folders,
        mapping: {
          systemPatch: {path: "system", converter: "daggerheartOverlay"},
          prototypeTokenPatch: {path: "prototypeToken", converter: "daggerheartOverlay"},
          flagsPatch: {path: "flags", converter: "daggerheartOverlay"},
          effects: {path: "effects", converter: "daggerheartEmbedded"},
          items: {path: "items", converter: "daggerheartEmbedded"},
          pages: {path: "pages", converter: "daggerheartEmbedded"},
          results: {path: "results", converter: "daggerheartEmbedded"},
        },
        entries: Object.fromEntries(Object.entries(entriesWithNameAliases).map(([id, entry]) => [id, {
          _id: entry._id,
          name: entry.name,
          systemPatch: entry.system,
          prototypeTokenPatch: entry.prototypeToken,
          flagsPatch: entry.flags,
          effects: entry.effects,
          items: entry.items,
          pages: entry.pages,
          results: entry.results,
        }]).map(([id, entry]) => [id, Object.fromEntries(Object.entries(entry).filter(([, value]) => value !== undefined))])),
      },
    });
  }

  const pending = [...queue.values()].filter(({source}) => !cache[source] || (cache[source] === source && !(source in overrides))).sort((a, b) => b.source.length - a.source.length);
  writeJson(CACHE_FILE, cache);
  writeJson(QUEUE_FILE, pending);

  if (command === "build") {
    if (pending.length) {
      console.error(`Faltan ${pending.length} cadenas por traducir (${pending.reduce((sum, item) => sum + item.source.length, 0)} caracteres).`);
      process.exit(2);
    }
    fs.mkdirSync(OUTPUT_DIR, {recursive: true});
    for (const output of outputs) writeJson(path.join(OUTPUT_DIR, output.file), output.data);
  }

  console.log(JSON.stringify({...stats, uniquePending: pending.length, pendingCharacters: pending.reduce((sum, item) => sum + item.source.length, 0), cachedStrings: Object.keys(cache).length}, null, 2));
}

main();
