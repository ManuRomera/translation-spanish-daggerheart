import fs from "node:fs";

const [sourcePath, translationPath] = process.argv.slice(2);
if (!sourcePath || !translationPath) {
    console.error("Usage: node tools/analyze-localization.mjs <source.json> <translation.json>");
    process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const translation = JSON.parse(fs.readFileSync(translationPath, "utf8"));

function flatten(value, prefix = "", output = new Map()) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) {
            flatten(child, prefix ? `${prefix}.${key}` : key, output);
        }
    } else {
        output.set(prefix, value);
    }
    return output;
}

const sourceFlat = flatten(source);
const translationFlat = flatten(translation);
const missing = [...sourceFlat].filter(([key]) => !translationFlat.has(key));
const obsolete = [...translationFlat].filter(([key]) => !sourceFlat.has(key));
const typeChanges = [...sourceFlat].filter(([key, value]) => {
    if (!translationFlat.has(key)) return false;
    return typeof value !== typeof translationFlat.get(key);
});

function protectedTokens(value) {
    if (typeof value !== "string") return [];
    return [...value.matchAll(/\{[^{}]+\}|@[A-Za-z]+\[[^\]]+\](?:\{[^}]+\})?|\b\d+d\d+(?:[+-]\d+)?\b/g)]
        .map((match) => match[0])
        .sort();
}

const tokenMismatches = [...sourceFlat].filter(([key, value]) => {
    if (!translationFlat.has(key)) return false;
    return JSON.stringify(protectedTokens(value)) !== JSON.stringify(protectedTokens(translationFlat.get(key)));
});

console.log(JSON.stringify({
    source: sourceFlat.size,
    translation: translationFlat.size,
    missing: missing.length,
    obsolete: obsolete.length,
    typeChanges: typeChanges.length,
    tokenMismatches: tokenMismatches.length
}, null, 2));

if (process.env.SHOW_MISSING === "1") {
    for (const [key, value] of missing) console.log(`${key}\t${String(value).replaceAll("\n", "\\n")}`);
}
if (process.env.SHOW_OBSOLETE === "1") {
    for (const [key, value] of obsolete) console.log(`${key}\t${String(value).replaceAll("\n", "\\n")}`);
}
if (process.env.SHOW_TYPE_CHANGES === "1") {
    for (const [key, value] of typeChanges) {
        console.log(`${key}\t${typeof value}\t${typeof translationFlat.get(key)}`);
    }
}

if (tokenMismatches.length) {
    for (const [key, value] of tokenMismatches) {
        console.log(`TOKEN_MISMATCH\t${key}\t${JSON.stringify(protectedTokens(value))}\t${JSON.stringify(protectedTokens(translationFlat.get(key)))}`);
    }
}

if (process.env.STRICT === "1" && (missing.length || obsolete.length || typeChanges.length || tokenMismatches.length)) {
    process.exitCode = 1;
}
