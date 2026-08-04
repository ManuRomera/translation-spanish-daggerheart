#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const cacheFile = path.resolve(import.meta.dirname, ".compendium-translation-cache.json");
const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
const headingFile = path.resolve(import.meta.dirname, "journal-heading-overrides.json");
const headingTranslations = fs.existsSync(headingFile) ? JSON.parse(fs.readFileSync(headingFile, "utf8")) : {};
let changed = 0;
const sourceNamesById = new Map();
const sourceDir = path.resolve(import.meta.dirname, ".source-compendiums");
if (fs.existsSync(sourceDir)) {
  for (const file of fs.readdirSync(sourceDir).filter((name) => name.endsWith(".source.json"))) {
    const pack = JSON.parse(fs.readFileSync(path.join(sourceDir, file), "utf8"));
    for (const document of pack.documents ?? []) sourceNamesById.set(document._id, document.name);
    for (const folder of pack.folders ?? []) sourceNamesById.set(folder._id, folder.name);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function translateUuidLabel(label, target) {
  if (cache[label]) return cache[label];
  const sourceName = sourceNamesById.get(target.split(".").at(-1));
  let translated = label;
  if (sourceName && label.startsWith(sourceName) && cache[sourceName]) {
    translated = cache[sourceName] + label.slice(sourceName.length);
  }
  return translated
    .replace(/\(Exploration\)/gi, "(Exploración)")
    .replace(/\(Event\)/gi, "(Evento)")
    .replace(/\(Social\)/gi, "(Social)")
    .replace(/\bMinor Demons\b/gi, "Demonios menores")
    .replace(/\bFallen Shock Troops\b/gi, "Tropas de choque caídas")
    .replace(/\bTangle Bramble Swarm Horde\b/gi, "Horda de maraña de zarzas")
    .replace(/\bMinor Treants\b/gi, "Ents menores")
    .replace(/\bGiant Eagles\b/gi, "Águilas gigantes")
    .replace(/\bArcher\b/gi, "arquero")
    .replace(/\bEscuadrón arquero\b/gi, "Escuadrón de arqueros")
    .replace(/\bTIER ([1-4]) \(LEVELS? ([^)]+)\)/gi, "GRADO $1 (NIVEL $2)")
    .replace(/\bTable of Random Objectives\b/gi, "Tabla de objetivos aleatorios");
}

function preserveCase(source, replacement) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (/^[A-ZÁÉÍÓÚÑ]/.test(source)) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement;
}

for (const [source, initial] of Object.entries(cache)) {
  let value = initial;
  value = value.replace(/<h([1-6])([^>]*)>(.*?)<\/h\1>/gi, (full, level, attributes, inner) => {
    const sourceHeading = inner.replace(/<[^>]+>/g, "").replace(/&amp;/gi, "&").trim();
    const translatedHeading = headingTranslations[sourceHeading];
    return translatedHeading ? `<h${level}${attributes}>${translatedHeading}</h${level}>` : full;
  });
  const replace = (pattern, replacement) => {
    value = value.replace(pattern, (...args) => typeof replacement === "function"
      ? replacement(...args)
      : preserveCase(args[0], replacement));
  };

  replace(/\brollos\b/gi, "tiradas");
  replace(/\brollo\b/gi, "tirada");
  replace(/\brolls\b/gi, "tiradas");
  replace(/\broll\b/gi, "tirada");
  replace(/\bvolver a rodar\b/gi, "volver a tirar");
  replace(/\brodar\b/gi, "tirar");
  replace(/\bSpellcast\b/gi, "lanzamiento de conjuros");
  replace(/\btirada de conjuro(?:s)?\b/gi, "tirada de lanzamiento de conjuros");
  replace(/\bPCs?\b/g, "PJ");
  replace(/\bHP\b/g, "PG");
  replace(/\bpuntos? de (?:Hit|acceso|impacto)\b/gi, match => match.toLowerCase().startsWith("puntos") ? "Puntos de Golpe" : "Punto de Golpe");
  replace(/\buna Estrés\b/gi, "un Estrés");
  replace(/\bun tirada\b/gi, "una tirada");
  replace(/\bEn nivel ([1-9]\d*)\b/gi, (_match, level) => `En el nivel ${level}`);
  replace(/\bmarcos ([1-9]\d*) Estrés\b/gi, (_match, amount) => `Marca ${amount} de Estrés`);
  replace(/\brango de Cuerpo a cuerpo\b/gi, "alcance Cuerpo a cuerpo");
  replace(/\brango Cuerpo a cuerpo\b/gi, "alcance Cuerpo a cuerpo");
  replace(/\balcance de combate cuerpo a cuerpo\b/gi, "alcance Cuerpo a cuerpo");
  replace(/\bmuy corta distancia\b/gi, "alcance Muy Cerca");
  replace(/\bcorta distancia\b/gi, "alcance Cerca");
  replace(/\brango muy cercano\b/gi, "alcance Muy Cerca");
  replace(/\brango cercano\b/gi, "alcance Cerca");
  replace(/\brango lejano\b/gi, "alcance Lejos");
  replace(/\blargo descanso\b/gi, "descanso prolongado");
  replace(/\bdescanso largo\b/gi, "descanso prolongado");
  replace(/\bmovimiento de inactividad\b/gi, "movimiento de descanso");
  replace(/\bHope Die\b/gi, "Dado de Esperanza");
  replace(/\bFear Die\b/gi, "Dado de Miedo");
  replace(/\bEsperanza (?:Die|Muere)\b/gi, "Dado de Esperanza");
  replace(/\bMiedo (?:Die|Muere)\b/gi, "Dado de Miedo");
  replace(/\bdaños? (?:Die|Muere)\b/gi, "dado de daño");
  replace(/\bSpitter (?:Die|Muere)\b/gi, "Dado de Escupidor");
  replace(/\bClear ([1-9]\d*) Stress\b/gi, (_match, amount) => `Elimina ${amount} de Estrés`);
  replace(/\bClear ([1-9]\d*) Estrés\b/gi, (_match, amount) => `Elimina ${amount} de Estrés`);
  replace(/\bClear Stress\b/gi, "Eliminar Estrés");
  replace(/\bGain ([1-9]\d*) Hope\b/gi, (_match, amount) => `Obtén ${amount} de Esperanza`);
  replace(/\bGain ([1-9]\d*) Esperanza\b/gi, (_match, amount) => `Obtén ${amount} de Esperanza`);
  replace(/\bGain Hope\b/gi, "Obtener Esperanza");
  replace(/\bMark Stress\b/gi, "Marcar Estrés");
  replace(/\bSpend Hope\b/gi, "Gastar Esperanza");
  replace(/\b(Cuerpo a cuerpo|Muy Cerca|Cerca|Lejos|Muy Lejos) Range\b/gi, (_match, range) => `alcance ${range}`);
  replace(/\bMinions?\b/gi, match => match.toLowerCase().endsWith("s") ? "esbirros" : "esbirro");
  replace(/\bReaction (Agility|Strength|Finesse|Instinct|Presence|Knowledge)\b/gi, (_match, trait) => `de reacción de ${{Agility: "Agilidad", Strength: "Fuerza", Finesse: "Sutileza", Instinct: "Instinto", Presence: "Presencia", Knowledge: "Conocimiento"}[trait] ?? trait}`);
  replace(/\bAgility\b/gi, "Agilidad");
  replace(/\bStrength\b/gi, "Fuerza");
  replace(/\bFinesse\b/gi, "Sutileza");
  replace(/\bInstinct\b/gi, "Instinto");
  replace(/\bPresence\b/gi, "Presencia");
  replace(/\bKnowledge\b/gi, "Conocimiento");
  replace(/\bLoop\b/gi, "bucle");
  replace(/\bDemons\b/gi, "demonios");
  replace(/\bRooted\b/gi, "Enraizado");
  replace(/\bRoot the Treant\b/gi, "Enraizar al ent");
  replace(/\bTreant\b/gi, "ent");
  replace(/\bSapling\b/gi, "retoño");
  replace(/\bTend to Wounds\b/gi, "Atender heridas");
  replace(/\bTind to Wounds\b/gi, "Atender heridas");
  replace(/\bAlly\b/gi, "aliado");
  replace(/\bAttack Tirada\b/gi, "tirada de ataque");
  replace(/\b(Sutileza|Agilidad|Fuerza|Instinto|Presencia|Conocimiento) Tirada\b/gi, (_match, trait) => `tirada de ${trait}`);
  replace(/\bmuy estrecho rango\b/gi, "alcance Muy Cerca");
  replace(/\bCall of the Brave\b/gi, "Llamada de los Valientes");
  replace(/\bEnraizado the Ent\b/gi, "Enraizado, el ent");
  replace(/\bReaction Tirada\b/gi, "tirada de reacción");
  replace(/\bMULTI-TARGET ATTACK TIRADAS\b/g, "TIRADAS DE ATAQUE CONTRA VARIOS OBJETIVOS");
  replace(/\bMODIFICADOR ATTACK\b/g, "MODIFICADOR DE ATAQUE");
  replace(/\bGold &gt; Handfuls\b/gi, "Oro &gt; Puñados");
  replace(/\bclara (\d*d\d+)H? Puntos de Golpe\b/gi, (_match, dice) => `elimina ${dice} Puntos de Golpe`);
  replace(/\bclara (\d*d\d+) Estrés\b/gi, (_match, dice) => `elimina ${dice} de Estrés`);

  // Conserva el destino técnico de los enlaces UUID, pero traduce su etiqueta
  // visible y repara llaves que una fuente anterior pudiera haber dejado abiertas.
  for (const match of source.matchAll(/@UUID\[([^\]]+)\]\{([^}]*)\}/g)) {
    const [, target, label] = match;
    const translatedLabel = translateUuidLabel(label, target);
    const malformedOrComplete = new RegExp(`@UUID\\[${escapeRegExp(target)}\\]\\{[^}<]*(?:\\}|(?=<))`, "g");
    value = value.replace(malformedOrComplete, `@UUID[${target}]{${translatedLabel}}`);
  }

  // Ningún pulido de terminología puede cambiar una orden de tirada.
  const sourceRolls = [...source.matchAll(/\[\[[^\]]+\]\]/g)].map((match) => match[0]);
  let rollIndex = 0;
  value = value.replace(/\[\[[^\]]+\]\]/g, () => sourceRolls[rollIndex++] ?? "");

  if (value !== initial) {
    cache[source] = value;
    changed += 1;
  }
}

fs.writeFileSync(cacheFile, `${JSON.stringify(cache, null, 2)}\n`);
console.log(`Pulidas ${changed} traducciones de compendio.`);
