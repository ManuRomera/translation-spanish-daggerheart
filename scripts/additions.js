/**
 * Translation Spanish Daggerheart – additions.js
 * Archivo ADITIVO que no toca tu patches.js. Se carga DESPUÉS.
 * Cubre textos duros detectados en las capturas y arregla algunos híbridos.
 */
Hooks.once("ready", () => {
  try {
    if (game.system?.id !== "daggerheart" || game.i18n.lang !== "es") return;
  } catch (e) { return; }

  // 1) Diccionario de frases sueltas (exact match)
  const dict = new Map([
    // Menús de atributos
    ["Sprint", "Correr"], ["Leap", "Saltar"], ["Maneuver", "Maniobrar"],
    ["Lift", "Levantar"], ["Smash", "Destrozar"], ["Grapple", "Agarrar"],
    ["Control", "Controlar"], ["Hide", "Ocultarse"], ["Tinker", "Manipular"],
    ["Perceive", "Percibir"], ["Sense", "Detectar"], ["Navigate", "Orientarse"],
    ["Charm", "Encandilar"], ["Perform", "Actuar"], ["Deceive", "Engañar"],
    ["Recall", "Recordar"], ["Analyze", "Analizar"], ["Comprehend", "Comprender"],

    // Inventario / Tipos de objeto
    ["Consumable", "Consumible"], ["Loot", "Botín"],

    // Botones y labels
    ["Modifiers", "Modificadores"],
    ["Formula", "Fórmula"],
    ["Deal Damage", "Infligir Daño"],
    ["Apply Healing", "Aplicar Curación"],
    ["ATTACK", "ATAQUE"],
    ["Attack", "Ataque"],
    ["HP", "PG"]
  ]);

  // 2) Placeholders que hemos visto
  const placeholderDict = new Map([
    ["Search...", "Buscar..."],
    ["Situational Bonus", "Bonus Situacional"]
  ]);

  function translatePlaceholders(root=document) {
    try {
      const nodes = root.querySelectorAll("[placeholder]");
      nodes.forEach(el => {
        const ph = el.getAttribute("placeholder");
        if (placeholderDict.has(ph)) el.setAttribute("placeholder", placeholderDict.get(ph));
      });
    } catch(e) {}
  }

  // 3) Reordenar "<Atributo> Prueba" -> "Prueba de <Atributo>"
  function reorderStatTestLabels(root) {
    const abilities = ["Agilidad","Sutileza","Instinto","Presencia","Conocimiento","Fuerza"];
    const re = new RegExp(`\\b(${abilities.join("|")})\\s+Prueba\\b`, "g");
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue || "";
      t = t.replace(re, (_m, stat) => `Prueba de ${stat}`);
      n.nodeValue = t;
    }
  }

  // 4) Arreglos de híbridos y tokens frecuentes
  function tokenFixesEverywhere(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue;
      if (!t || !/[A-Za-z]/.test(t)) continue;
      t = t
        .replace(/\bSituational\s+Bonificador\b/g, "Bonificador situacional")
        .replace(/\bBardic\s+Rally\s+(?:Dice|Dices|Dados)\b/g, "Arengar del Bardo")
        // HP -> PG (incluye casos compuestos)
        .replace(/\b(Max(?:imum)?\s*)HP(\s*Increase)\b/gi, "Aumento de PG máximo")
        .replace(/\b(Max(?:imum)?\s*)HP\b/gi, "PG máx.")
        .replace(/\bHP\b/g, "PG");
      n.nodeValue = t;
    }
  }

  // 5) Abreviaturas en cabeceras (AGI→AGI, STR→FUE, etc.)
  function replaceAbilityAbbr(root) {
    const map = new Map([["AGI","AGI"],["STR","FUE"],["FIN","SUT"],["INS","INS"],["PRE","PRE"],["KNO","CON"]]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue || "";
      if (!/[A-Z]{3}/.test(t)) continue;
      for (const [en, es] of map) t = t.replace(new RegExp(en, "g"), es);
      n.nodeValue = t;
    }
  }

  // 6) Reemplazo exacto por diccionario
  function replaceByDict(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      const text = n.nodeValue;
      if (!text || !text.trim()) continue;
      const trimmed = text.trim();
      if (dict.has(trimmed)) n.nodeValue = text.replace(trimmed, dict.get(trimmed));
    }
  }

  // 7) Hooks y Observer (solo añadimos, no tocamos lo que ya tengas)
  Hooks.on("renderApplicationV2", (_a, html) => { replaceByDict(html[0]); translatePlaceholders(html[0]); tokenFixesEverywhere(html[0]); reorderStatTestLabels(html[0]); replaceAbilityAbbr(html[0]); });
  Hooks.on("renderActorSheet", (_a, html) => { replaceByDict(html[0]); translatePlaceholders(html[0]); tokenFixesEverywhere(html[0]); reorderStatTestLabels(html[0]); replaceAbilityAbbr(html[0]); });
  Hooks.on("renderItemSheet", (_a, html) => { replaceByDict(html[0]); translatePlaceholders(html[0]); tokenFixesEverywhere(html[0]); reorderStatTestLabels(html[0]); });
  Hooks.on("renderChatMessage", (_m, html) => { replaceByDict(html[0]); translatePlaceholders(html[0]); tokenFixesEverywhere(html[0]); reorderStatTestLabels(html[0]); });

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === Node.ELEMENT_NODE) { replaceByDict(n); translatePlaceholders(n); tokenFixesEverywhere(n); reorderStatTestLabels(n); replaceAbilityAbbr(n); }
        else if (n.nodeType === Node.TEXT_NODE) replaceByDict(n.parentElement);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  console.log("%cTranslation Spanish Daggerheart%c additions.js cargado (modo aditivo).", "color:#6cf", "");
});
