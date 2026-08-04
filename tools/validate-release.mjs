#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const expectedPacks = [
  "adversaries", "ancestries", "armors", "beastforms", "classes", "communities",
  "consumables", "domains", "environments", "journals", "loot", "rolltables",
  "subclasses", "weapons",
];
const failures = [];
let documents = 0;
let folders = 0;
const documentIds = new Set();

const manifest = JSON.parse(fs.readFileSync(path.join(root, "module.json"), "utf8"));
if (manifest.version !== "0.3.0") failures.push("La versión del manifiesto no es 0.3.0.");
if (manifest.compatibility?.maximum !== "13") failures.push("Foundry máximo debe ser 13.");
const system = manifest.relationships?.systems?.find(({id}) => id === "daggerheart");
if (system?.compatibility?.minimum !== "1.9.14" || system?.compatibility?.maximum !== "1.9.14") {
  failures.push("La compatibilidad del sistema debe estar fijada en 1.9.14.");
}
if (!manifest.relationships?.requires?.some(({id}) => id === "babele")) failures.push("Falta la dependencia Babele.");

for (const pack of expectedPacks) {
  const file = path.join(root, "compendium", `daggerheart.${pack}.json`);
  if (!fs.existsSync(file)) {
    failures.push(`Falta el compendio ${pack}.`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data.label || !data.mapping || !data.entries) failures.push(`${pack}: estructura Babele incompleta.`);
  folders += Object.keys(data.folders ?? {}).length;
  for (const [key, entry] of Object.entries(data.entries ?? {})) {
    if (entry?._id) documentIds.add(`${pack}.${entry._id}`);
    if (key !== entry?._id) continue; // Las demás claves son alias de nombre para migraciones.
    const text = JSON.stringify(entry);
    if (/ZZZDHKEEP|__DH_KEEP_/.test(text)) failures.push(`${pack}/${key}: marcador temporal sin restaurar.`);
    for (const match of text.matchAll(/@UUID\[[^\]]+\]\{/g)) {
      const tail = text.slice(match.index + match[0].length);
      if (!tail.includes("}")) failures.push(`${pack}/${key}: enlace UUID sin cerrar.`);
    }
  }
}

documents = documentIds.size;
if (documents !== 976) failures.push(`Se esperaban 976 documentos y hay ${documents}.`);
// Babele traduce por nombre; las 201 carpetas de origen usan 73 nombres únicos.
if (folders !== 73) failures.push(`Se esperaban 73 nombres de carpeta y hay ${folders}.`);

console.log(`Validación publicable: ${expectedPacks.length} compendios, ${documents} documentos, ${folders} nombres de carpeta.`);
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exit(1);
}
console.log("Resultado: correcto.");
