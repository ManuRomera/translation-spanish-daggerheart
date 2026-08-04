import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || true];
}));

if (!args.source || !args.translation || !args.output) {
    console.error("Usage: node tools/sync-localization.mjs --source=en.json --translation=es.json --output=es.json [--previous-source=en-old.json] [--translate]");
    process.exit(1);
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const source = readJson(args.source);
const current = readJson(args.translation);
const previousSource = args["previous-source"] ? readJson(args["previous-source"]) : null;
const cachePath = path.resolve("tools/.translation-cache-v2.json");
const cache = fs.existsSync(cachePath) ? readJson(cachePath) : {};

function flatten(value, prefix = "", output = new Map()) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, output);
    } else output.set(prefix, value);
    return output;
}

function setPath(root, dottedPath, value) {
    const parts = dottedPath.split(".");
    let cursor = root;
    for (const part of parts.slice(0, -1)) cursor = cursor[part] ??= {};
    cursor[parts.at(-1)] = value;
}

function translationMemory(sourceTree, translatedTree) {
    const sourceFlat = flatten(sourceTree);
    const translatedFlat = flatten(translatedTree);
    const memory = new Map();
    for (const [key, english] of sourceFlat) {
        if (typeof english !== "string" || !translatedFlat.has(key)) continue;
        const spanish = translatedFlat.get(key);
        if (typeof spanish === "string" && spanish !== english) memory.set(english, spanish);
    }
    return memory;
}

const sourceFlat = flatten(source);
const currentFlat = flatten(current);
const memory = previousSource ? translationMemory(previousSource, current) : new Map();
const output = {};
const pending = [];

for (const [key, english] of sourceFlat) {
    const currentValue = currentFlat.get(key);
    const shouldTranslateIdentical = Boolean(args["translate-identical"])
        && typeof english === "string"
        && english.trim()
        && currentValue === english;
    if (currentFlat.has(key) && typeof currentValue === typeof english && !shouldTranslateIdentical) {
        setPath(output, key, currentValue);
    } else if (typeof english === "string" && memory.has(english)) {
        setPath(output, key, memory.get(english));
    } else if (typeof english === "string" && cache[english] && cache[english] !== english) {
        setPath(output, key, cache[english]);
    } else {
        setPath(output, key, english);
        if (typeof english === "string" && english.trim()) pending.push([key, english]);
    }
}

function protect(text) {
    const values = [];
    const protectedText = text.replace(/\{[^{}]+\}|<[^>]+>|@[A-Za-z]+\[[^\]]+\](?:\{[^}]+\})?|\b\d+d\d+(?:[+-]\d+)?\b/g, (match) => {
        const token = `ZXQ${values.length}QXZ`;
        values.push(match);
        return token;
    });
    return { protectedText, values };
}

function restore(text, values) {
    return values.reduce((result, value, index) => result.replaceAll(`ZXQ${index}QXZ`, value), text);
}

function applyGlossary(text) {
    return text
        .replaceAll("Puntos de Vida", "Puntos de golpe")
        .replaceAll("Puntos de vida", "Puntos de golpe")
        .replaceAll("puntos de vida", "puntos de golpe")
        .replaceAll("Dados de Esperanza", "Dado de Esperanza")
        .replaceAll("Dados de Miedo", "Dado de Miedo")
        .replaceAll("Forma de Bestia", "Forma animal")
        .replaceAll("forma de bestia", "forma animal")
        .replaceAll("Ranura de Armadura", "ranura de armadura")
        .replaceAll("Tirada de Reacción", "tirada de reacción");
}

async function translate(text) {
    const { protectedText, values } = protect(text);
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.search = new URLSearchParams({ client: "gtx", sl: "en", tl: "es", dt: "t", q: protectedText });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
    const data = await response.json();
    const translated = data[0].map((part) => part[0]).join("");
    return applyGlossary(restore(translated, values));
}

if (args.translate) {
    let completed = 0;
    for (const [key, english] of pending) {
        const spanish = await translate(english);
        setPath(output, key, spanish);
        cache[english] = spanish;
        completed += 1;
        if (completed % 25 === 0) {
            fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
            console.log(`Translated ${completed}/${pending.length}`);
        }
    }
    fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
}

fs.writeFileSync(args.output, `${JSON.stringify(output, null, 4)}\n`);
console.log(JSON.stringify({ source: sourceFlat.size, reusedByPath: [...sourceFlat].filter(([key]) => currentFlat.has(key)).length, reusedByText: [...sourceFlat].filter(([key, value]) => !currentFlat.has(key) && memory.has(value)).length, pending: args.translate ? 0 : pending.length }, null, 2));
