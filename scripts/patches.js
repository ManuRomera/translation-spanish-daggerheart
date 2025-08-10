/**
 * Translation Spanish Daggerheart – patches.js (clean rebuild)
 */
Hooks.once("ready", async () => {
  try {
    if (game.system?.id !== "daggerheart") return;
  } catch (e) { return; }

  // Load en.override.json (optional) to provide EN keys the system might expect
  try {
    const url = "modules/translation-spanish-daggerheart/lang/en.override.json";
    const resp = await fetch(url);
    if (resp.ok) {
      const enOverride = await resp.json();
      if (foundry?.utils?.mergeObject) {
        foundry.utils.mergeObject(game.i18n.translations, enOverride, { inplace: true, insertKeys: true, overwrite: false });
      } else {
        Object.assign(game.i18n.translations, enOverride);
      }
    }
  } catch (e) { console.warn("%c[Translation ES Daggerheart]%c en.override.json not loaded", "color:#6cf", ""); }

  // Dictionary for hardcoded strings
  const dict = new Map([
    ["Compendium Browser", game.i18n.localize("DAGGERHEART.UI.CompendiumBrowser.title") || "Navegador de Compendios"],
    ["Daggerheart Compendium Browser", game.i18n.localize("DAGGERHEART.UI.CompendiumBrowser.title") || "Navegador de Compendios"],
    ["Select a Folder in sidebar to start browsing trought the compendium", game.i18n.localize("DAGGERHEART.UI.CompendiumBrowser.emptyPrompt") || "Selecciona una carpeta en la barra lateral para empezar"],
    ["Select a Folder in sidebar to start browsing through the compendium", game.i18n.localize("DAGGERHEART.UI.CompendiumBrowser.emptyPrompt") || "Selecciona una carpeta en la barra lateral para empezar"],
    ["Name", game.i18n.localize("DAGGERHEART.GENERAL.name") || "Nombre"],
    ["Target", game.i18n.localize("DAGGERHEART.GENERAL.target") || "Objetivo"],
    ["Fear", game.i18n.localize("DAGGERHEART.GENERAL.fear") || "Miedo"],
    ["Reaction Roll All Targets", game.i18n.localize("DAGGERHEART.UI.Chat.reactionAllTargets") || "Tirada de reacción a todos los objetivos"],
    ["Damage Reduction", "Reducción de daño"],
    ["Death Move", "Movimiento de Muerte"],
    ["Select Move", "Seleccionar movimiento"],
    ["Long Rest", "Descanso largo"],
    ["Short Rest", "Descanso corto"],
    ["Countdown", "Cuenta atrás"],
    ["Encounter", "Encuentro"],
    ["Narrative", "Narrativa"],
    ["Enable Effect", "Activar Efecto"],
    ["Disable Effect", "Desactivar Efecto"],
    ["Send to Chat", "Enviar al chat"],
    ["To Loadout", "Enviar al equipamiento"],
    ["To Vault", "Enviar al alijo"],
    ["Unequip", "Desequipar"],
    ["Use Item", "Usar objeto"],
    ["Sprint", "Correr"],
    ["Leap", "Saltar"],
    ["Maneuver", "Maniobrar"],
    ["Lift", "Levantar"],
    ["Smash", "Destrozar"],
    ["Grapple", "Agarrar"],
    ["Control", "Controlar"],
    ["Hide", "Ocultarse"],
    ["Tinker", "Manipular"],
    ["Perceive", "Percibir"],
    ["Sense", "Detectar"],
    ["Navigate", "Orientarse"],
    ["Charm", "Encandilar"],
    ["Perform", "Actuar"],
    ["Deceive", "Engañar"],
    ["Recall", "Recordar"],
    ["Analyze", "Analizar"],
    ["Comprehend", "Comprender"],
    ["Vault", "Alijo"],
    ["Coins", "Monedas"],
    ["Handfuls", "Puñados"],
    ["Bags", "Bolsas"],
    ["Chests", "Cofres"],
    ["Deal Damage", "Infligir Daño"],
    ["Apply Healing", "Aplicar Curación"],
    ["Formula", "Fórmula"],
    ["Impulses:", "Impulsos:"]
  ]);

  // Placeholder translations
  const placeholderDict = new Map([
    ["Search...", "Buscar..."]
  ]);

  function translatePlaceholders(root=document) {
    try {
      const nodes = root.querySelectorAll("[placeholder]");
      nodes.forEach(el => {
        const ph = el.getAttribute("placeholder");
        if (!ph) return;
        if (placeholderDict.has(ph)) el.setAttribute("placeholder", placeholderDict.get(ph));
      });
    } catch(e) { /* noop */ }
  }

  // Fix mixed language "With Esperanza/Miedo" in chat
  function fixWithHopeFear(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const t of nodes) {
      if (!t.nodeValue) continue;
      t.nodeValue = t.nodeValue.replace(/\bWith\s+Esperanza\b/g, "Con Esperanza")
                               .replace(/\bWith\s+Miedo\b/g, "Con Miedo")
                               .replace(/\bWITH\s+ESPERANZA\b/g, "CON ESPERANZA")
                               .replace(/\bWITH\s+MIEDO\b/g, "CON MIEDO");
    }
  }

  
  // Replace ability abbreviations inside Actor Sheets (matches inside tokens like "AGIO" or "AGI○")
  function replaceAbilityAbbr(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const map = new Map([
      ["AGI", "AGI"],  // Agilidad
      ["STR", "FUE"],  // Fuerza
      ["FIN", "SUT"],  // Sutileza
      ["INS", "INS"],  // Instinto
      ["PRE", "PRE"],  // Presencia
      ["KNO", "CON"]   // Conocimiento
    ]);
    for (const n of nodes) {
      let t = n.nodeValue;
      if (!t) continue;
      // Only act on short uppercase clusters to reduce false positives
      if (!/[A-Z]{3}/.test(t)) continue;
      for (const [en, es] of map) {
        // Replace anywhere in the text node
        t = t.replace(new RegExp(en, "g"), es);
      }
      n.nodeValue = t;
    }
  }

  
  // Reorder "<Atributo> Prueba" -> "Prueba de <Atributo>" in Spanish chat cards
  function reorderStatTestLabels(root) {
    if (!root) return;
    const abilities = ["Agilidad","Sutileza","Instinto","Presencia","Conocimiento","Fuerza"];
    const re = new RegExp(`\\b(${abilities.join("|")})\\s+Prueba\\b`, "g");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue;
      if (!t) continue;
      t = t.replace(re, (m, stat) => `Prueba de ${stat}`);
      n.nodeValue = t;
    }
  }

  function replaceTextNodes(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const pending = [];
    while (walker.nextNode()) pending.push(walker.currentNode);
    for (const node of pending) {
      const text = node.nodeValue;
      if (!text || !text.trim()) continue;
      const trimmed = text.trim();
      if (dict.has(trimmed)) {
        node.nodeValue = text.replace(trimmed, dict.get(trimmed));
      } else {
        if (game.i18n.lang === "es" && /^[\x20-\x7E]+$/.test(trimmed) && /[A-Za-z]/.test(trimmed)) {
          console.debug("%c[ES-Daggerheart] Texto potencial sin traducir:", "color:#6cf", trimmed);
        }
      }
    }
  }

  Hooks.on("renderChatMessage", (_msg, html) => { replaceTextNodes(html[0]); translatePlaceholders(html[0]); fixWithHopeFear(html[0]); reorderStatTestLabels(html[0]); });
  Hooks.on("renderApplicationV2", (_app, html) => { replaceTextNodes(html[0]); translatePlaceholders(html[0]); fixWithHopeFear(html[0]); reorderStatTestLabels(html[0]); });
  Hooks.on("renderActorSheet", (_app, html) => { replaceTextNodes(html[0]); translatePlaceholders(html[0]); fixWithHopeFear(html[0]); replaceAbilityAbbr(html[0]); });
  Hooks.on("renderItemSheet", (_app, html) => { replaceTextNodes(html[0]); translatePlaceholders(html[0]); fixWithHopeFear(html[0]); reorderStatTestLabels(html[0]); });

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.ELEMENT_NODE) { replaceTextNodes(n); translatePlaceholders(n); fixWithHopeFear(n); replaceAbilityAbbr(n); reorderStatTestLabels(n); }
        else if (n.nodeType === Node.TEXT_NODE) replaceTextNodes(n.parentElement);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  console.log("%cTranslation Spanish Daggerheart%c activo — idioma:", "color:#6cf", "", game.i18n.lang);
});
