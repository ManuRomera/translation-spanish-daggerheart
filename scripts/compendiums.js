/** Traducción segura de compendios y contenido ya importado en los mundos. */

const MODULE_ID = "translation-spanish-daggerheart";
const TRANSLATION_VERSION = "0.3.0";
const ITEM_PACKS = [
    "classes", "subclasses", "domains", "ancestries", "communities", "weapons", "armors",
    "consumables", "loot", "beastforms"
];
const ACTOR_PACKS = ["adversaries", "environments"];
const translating = new Set();

function deepOverlay(original, translated) {
    if (translated === undefined || translated === null) return foundry.utils.deepClone(original);
    if (Array.isArray(original) && Array.isArray(translated)) {
        const output = foundry.utils.deepClone(original);
        translated.forEach((patch, index) => {
            if (patch == null) return;
            const targetIndex = patch?._id
                ? output.findIndex(candidate => candidate?._id === patch._id)
                : index;
            if (targetIndex >= 0) output[targetIndex] = deepOverlay(output[targetIndex], patch);
        });
        return output;
    }
    if (original && translated && typeof original === "object" && typeof translated === "object") {
        const output = foundry.utils.deepClone(original);
        for (const [key, value] of Object.entries(translated)) output[key] = deepOverlay(original[key], value);
        return output;
    }
    return foundry.utils.deepClone(translated);
}

Hooks.once("babele.init", babele => {
    babele.registerConverters({
        daggerheartOverlay: (original, translated) => deepOverlay(original, translated ?? {}),
        daggerheartEmbedded: (original, translated) => deepOverlay(original, translated ?? [])
    });
    babele.register({module: MODULE_ID, lang: "es", dir: "compendium"});
});

Hooks.once("init", () => {
    game.settings.register(MODULE_ID, "translatedContentVersion", {
        scope: "world",
        config: false,
        type: String,
        default: ""
    });
});

function spanishDaggerheart() {
    return game.system?.id === "daggerheart" && game.i18n?.lang === "es";
}

function sourceUuid(document) {
    return document?._stats?.compendiumSource ?? document?.flags?.core?.sourceId ?? null;
}

function sourcePack(uuid) {
    const match = String(uuid ?? "").match(/^Compendium\.daggerheart\.([^.]+)\./);
    return match?.[1] ?? null;
}

function babelePatch(collection, data) {
    const translatedPack = game.babele?.packs?.get(collection);
    if (!translatedPack?.hasTranslation(data)) return null;
    return game.babele.translate(collection, data, true);
}

async function updateEffects(document, translatedEffects) {
    if (!Array.isArray(translatedEffects) || !document?.effects?.size) return;
    const updates = translatedEffects
        .filter(effect => effect?._id && document.effects.has(effect._id))
        .map(effect => ({_id: effect._id, name: effect.name, description: effect.description}))
        .map(update => Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)));
    if (updates.length) await document.updateEmbeddedDocuments("ActiveEffect", updates);
}

async function applyItemPatch(item, patch) {
    if (!patch || translating.has(item.uuid)) return false;
    translating.add(item.uuid);
    try {
        const update = {};
        if (patch.name && patch.name !== item.name) update.name = patch.name;
        if (patch.system) update.system = patch.system;
        if (Object.keys(update).length) await item.update(update);
        await updateEffects(item, patch.effects);
        return Object.keys(update).length > 0 || Boolean(patch.effects?.length);
    } finally {
        translating.delete(item.uuid);
    }
}

async function translateOwnedItem(item) {
    if (!spanishDaggerheart() || !item?.parent || item.parent.documentName !== "Actor") return false;
    const data = item.toObject();
    const linkedPack = sourcePack(sourceUuid(item));
    const candidates = linkedPack && ITEM_PACKS.includes(linkedPack)
        ? [linkedPack]
        : ITEM_PACKS;
    for (const pack of candidates) {
        const patch = babelePatch(`daggerheart.${pack}`, data);
        if (patch) return applyItemPatch(item, patch);
    }
    return false;
}

async function translateActorFromCompendium(actor) {
    const pack = sourcePack(sourceUuid(actor));
    if (!ACTOR_PACKS.includes(pack)) return false;
    const patch = babelePatch(`daggerheart.${pack}`, actor.toObject());
    if (!patch) return false;

    const actorUpdate = {};
    if (patch.system) actorUpdate.system = patch.system;
    // El nombre de un actor puede haber sido personalizado por el DJ. Babele ya
    // lo traduce al importarlo; la migración solo actualiza el contenido interno.
    if (Object.keys(actorUpdate).length) await actor.update(actorUpdate);
    for (const translatedItem of patch.items ?? []) {
        const item = actor.items.get(translatedItem?._id);
        if (item) await applyItemPatch(item, translatedItem);
    }
    await updateEffects(actor, patch.effects);
    return true;
}

async function translateActor(actor) {
    await translateActorFromCompendium(actor);
    for (const item of actor.items) await translateOwnedItem(item);
}

async function translateWorldActors({notify = false} = {}) {
    if (!game.user?.isGM || !spanishDaggerheart()) return;
    let translated = 0;
    for (const actor of game.actors) {
        await translateActor(actor);
        translated += 1;
    }
    await game.settings.set(MODULE_ID, "translatedContentVersion", TRANSLATION_VERSION);
    if (notify) ui.notifications.info(`Traducción española aplicada a ${translated} actores del mundo.`);
    console.info(`[${MODULE_ID}] Contenido de ${translated} actores revisado y traducido.`);
}

Hooks.once("babele.ready", async () => {
    if (!spanishDaggerheart() || !game.user?.isGM) return;
    game.modules.get(MODULE_ID).api = {translateActor, translateWorldActors};
    const activeGM = game.users?.activeGM;
    if (activeGM && activeGM.id !== game.user.id) return;
    if (game.settings.get(MODULE_ID, "translatedContentVersion") !== TRANSLATION_VERSION) {
        await translateWorldActors({notify: true});
    }
});

Hooks.on("createItem", item => {
    if (!spanishDaggerheart() || !game.user?.isGM || translating.has(item.uuid)) return;
    window.setTimeout(() => translateOwnedItem(item).catch(error => {
        console.error(`[${MODULE_ID}] No se pudo traducir el objeto recién creado.`, error);
    }), 50);
});
