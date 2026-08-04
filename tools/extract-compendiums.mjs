import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [systemPath, outputPath = "tools/.source-compendiums"] = process.argv.slice(2);
if (!systemPath) {
    console.error("Usage: node tools/extract-compendiums.mjs <daggerheart-system-path> [output-path]");
    process.exit(1);
}

const classicLevelPath = process.env.CLASSIC_LEVEL_PATH
    ?? "/Applications/Foundry Virtual Tabletop.app/Contents/Resources/app/node_modules/classic-level/index.js";
const { ClassicLevel } = await import(pathToFileURL(classicLevelPath));
const manifest = JSON.parse(fs.readFileSync(path.join(systemPath, "system.json"), "utf8"));

function attachEmbedded(parent, field, embeddedDocument) {
    if (!parent) return;
    if (!Array.isArray(parent[field])) parent[field] = [];
    const index = parent[field].findIndex(candidate =>
        candidate === embeddedDocument._id || candidate?._id === embeddedDocument._id
    );
    if (index >= 0) parent[field][index] = embeddedDocument;
    else parent[field].push(embeddedDocument);
}

fs.mkdirSync(outputPath, { recursive: true });

for (const pack of manifest.packs) {
    const source = path.join(systemPath, pack.path.replace(/\.db$/, ""));
    const database = new ClassicLevel(source, { keyEncoding: "utf8", valueEncoding: "utf8" });
    const documents = new Map();
    const folders = [];
    const embedded = [];
    const rootCollections = {
        Item: "items",
        Actor: "actors",
        JournalEntry: "journal",
        RollTable: "tables"
    };
    const rootCollection = rootCollections[pack.type];

    await database.open();
    for await (const [key, value] of database.iterator()) {
        const parsed = JSON.parse(value);
        if (key.startsWith("!folders!")) folders.push(parsed);
        else if (key.startsWith(`!${rootCollection}!`)) documents.set(parsed._id, parsed);
        else embedded.push({ key, value: parsed });
    }
    await database.close();

    for (const entry of embedded) {
        const [, collection, ids] = entry.key.split("!");
        const parts = ids.split(".");
        if (collection === "items.effects") attachEmbedded(documents.get(parts[0]), "effects", entry.value);
        else if (collection === "actors.items") attachEmbedded(documents.get(parts[0]), "items", entry.value);
        else if (collection === "actors.items.effects") {
            const item = documents.get(parts[0])?.items?.find(candidate => candidate?._id === parts[1]);
            attachEmbedded(item, "effects", entry.value);
        } else if (collection === "journal.pages") attachEmbedded(documents.get(parts[0]), "pages", entry.value);
        else if (collection === "tables.results") attachEmbedded(documents.get(parts[0]), "results", entry.value);
    }

    const sortedDocuments = [...documents.values()].sort((left, right) => left.name.localeCompare(right.name, "en"));
    folders.sort((left, right) => left.name.localeCompare(right.name, "en"));

    const exported = {
        collection: `${manifest.id}.${pack.name}`,
        label: pack.label,
        type: pack.type,
        systemVersion: manifest.version,
        folders,
        documents: sortedDocuments
    };
    fs.writeFileSync(
        path.join(outputPath, `${manifest.id}.${pack.name}.source.json`),
        `${JSON.stringify(exported, null, 2)}\n`
    );
    console.log(`${pack.name}: ${sortedDocuments.length} documentos, ${folders.length} carpetas`);
}
