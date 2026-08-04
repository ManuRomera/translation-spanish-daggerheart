/**
 * Pequeños ajustes para cadenas incrustadas en Daggerheart 1.9.14.
 *
 * El sistema localiza el resto de la interfaz mediante DAGGERHEART.*. Evitamos
 * observar todo el DOM para no interferir con editores, diarios ni otros módulos.
 */

const MODULE_ID = "translation-spanish-daggerheart";

function isSpanishDaggerheart() {
    return game.system?.id === "daggerheart" && game.i18n?.lang === "es";
}

function rootElement(html) {
    if (html instanceof HTMLElement) return html;
    if (html?.[0] instanceof HTMLElement) return html[0];
    return null;
}

function replaceExactText(root, source, translation) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue?.trim() !== source) continue;
        node.nodeValue = node.nodeValue.replace(source, translation);
    }
}

function applyCompatibilityPatches(html) {
    if (!isSpanishDaggerheart()) return;
    const root = rootElement(html);
    if (!root) return;

    // Textos incrustados detectados en las plantillas de Daggerheart 1.9.14.
    replaceExactText(root, "Party", "Grupo");
    replaceExactText(root, "Soon tm", "Próximamente");

    // Límites inferior y superior de resultados de tablas.
    for (const input of root.querySelectorAll('input[type="number"][placeholder="L"]')) input.placeholder = "Mín.";
    for (const input of root.querySelectorAll('input[type="number"][placeholder="H"]')) input.placeholder = "Máx.";
}

Hooks.on("renderActorSheet", (_application, html) => applyCompatibilityPatches(html));
Hooks.on("renderApplicationV2", (_application, html) => applyCompatibilityPatches(html));

Hooks.once("ready", () => {
    if (isSpanishDaggerheart()) console.info(`[${MODULE_ID}] Traducción española activa para Daggerheart ${game.system.version}.`);
});
