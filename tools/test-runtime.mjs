#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const onceHooks = new Map();
globalThis.Hooks = {
  once: (name, callback) => onceHooks.set(name, callback),
  on: () => {},
};
globalThis.foundry = {utils: {deepClone: structuredClone}};
globalThis.game = {settings: {register: () => {}}};

await import(path.join(root, "scripts", "compendiums.js"));
let converters;
const registrations = [];
onceHooks.get("babele.init")({
  registerConverters: (value) => { converters = value; },
  register: (value) => registrations.push(value),
});

assert.equal(registrations[0]?.module, "translation-spanish-daggerheart");
assert.equal(registrations[0]?.dir, "compendium");
assert.equal(typeof converters?.daggerheartOverlay, "function");
assert.equal(typeof converters?.daggerheartEmbedded, "function");

const original = {
  description: "English",
  formula: "2d6+3",
  actions: [{_id: "action-one", name: "English action", range: "close"}],
};
const overlay = converters.daggerheartOverlay(original, {
  description: "Español",
  actions: [{_id: "action-one", name: "Acción española"}],
});
assert.equal(overlay.description, "Español");
assert.equal(overlay.formula, "2d6+3");
assert.equal(overlay.actions[0].name, "Acción española");
assert.equal(overlay.actions[0].range, "close");
assert.equal(original.description, "English", "La conversión no debe mutar el original.");

const cases = [
  ["classes", "Bard", "Bardo"],
  ["subclasses", "Wordsmith", "Forjapalabras"],
  ["ancestries", "Elf", "Elfo"],
  ["communities", "Loreborne", "Erudita"],
  ["ancestries", "Celestial Trance", "Trance Celestial"],
  ["ancestries", "Quick Reactions", "Reacciones rápidas"],
  ["communities", "Well-Read", "Bien Leído"],
  ["classes", "Make a Scene", "Montar una Escena"],
  ["classes", "Rally", "Inspirar"],
];
for (const [pack, english, spanish] of cases) {
  const data = JSON.parse(fs.readFileSync(path.join(root, "compendium", `daggerheart.${pack}.json`), "utf8"));
  assert.equal(data.entries[english]?.name, spanish, `${pack}: ${english}`);
}

console.log("Prueba de ejecución: conversores seguros y contenido de ficha correctos.");
