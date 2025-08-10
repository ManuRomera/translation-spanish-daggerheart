/* Translation Spanish Daggerheart — additions.js (safe v2) */
Hooks.once('ready', () => {
  if (game?.system?.id !== 'daggerheart' || game.i18n.lang !== 'es') return;
  console.log('%c[Translation ES Daggerheart]%c additions.js safe v2', 'color:#6cf','');

  // Diccionario puntual (no toca compendios de datos, solo UI/DOM)
  const DICT = {
    // Botones/acciones
    "Mark Stress":"Marcar Estrés",
    "Spend Hope":"Gastar Esperanza",
    "Use Sneak Attack":"Usar Ataque Furtivo",

    // Rasgos concretos / características vistas en capturas
    "Shell":"Caparazón","Retract":"Retraerse","Privilege":"Privilegio",
    "Rogue's Dodge":"Esquiva del Pícaro","Cloaked":"Oculto",
    "Sneak Attack":"Ataque Furtivo","Subclass - Nightwalker":"Subclase - Caminante Nocturno",
    "Shadow Stepper":"Paso Sombrío",
    "Increased Fortitude":"Fortaleza aumentada","Scoundrel":"Bribón",
    "Make a Scene":"Montar una escena","Rally":"Arengar",
    "Rally (Level 5)":"Arengar (Nivel 5)","Rally your allies!":"¡Arenga a tus aliados!",
    "Rally your Allies":"Arenga a tus Aliados",
    "Gifted Performer":"Artista talentoso","Relaxing Song":"Canción relajante",
    "Epic Song":"Canción épica","Heartbreaking Song":"Canción desgarradora",

    // Encabezados/columnas
    "Evasion":"Evasión","Hit Points":"Puntos de golpe","Hit Point":"Punto de golpe",
    "Domains":"Dominios","Domain":"Dominio","Type":"Tipo","Level":"Nivel",
    "Class":"Clase","Spellcasting Trait":"Rasgo de conjuración","Dominio Card":"Carta de Dominio",

    // Valores de rasgos
    "Agility":"Agilidad","Finesse":"Sutileza","Strength":"Fuerza",
    "Instinct":"Instinto","Knowledge":"Conocimiento","Presence":"Presencia",

    // Varios solicitados
    "Situational Bonus":"Bonus Situacional",
    "Bardic Rally Dice":"Arengar del Bardo",
    "Bardic Rally Dices":"Arengar del Bardo",
    "Bardic Rally Dados":"Arengar del Bardo",

    // Clases (navegador de compendios)
    "Bard":"Bardo","Druid":"Druida","Guardian":"Guardián","Ranger":"Explorador",
    "Rogue":"Pícaro","Seraph":"Serafín","Sorcerer":"Hechicero","Warrior":"Guerrero","Wizard":"Mago"
  };

  const PLACEHOLDERS = { "Search...":"Buscar..." };

  // Selectores a evitar (para no romper editores ni colgar la UI)
  const SKIP_SELECTOR = [
    "input","textarea","select","script","style","code","pre",
    "[contenteditable='true']", "[contenteditable='']", "[contenteditable]",
    ".tox",".tox-edit-area",".mce-content-body",".ProseMirror",".pm-editor",
    ".editor",".editor-content",".journal-sheet",".journal-entry-page",".journal-page-content",
    ".cm-editor",".monaco-editor"
  ].join(",");

  // Filtro para TreeWalker que salta nodos dentro de zonas a evitar
  function filterTextNode(node) {
    try {
      const pe = node.parentElement;
      if (!pe) return NodeFilter.FILTER_REJECT;
      if (pe.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      // Evitar nodos muy largos (rendimiento)
      if (node.nodeValue && node.nodeValue.length > 2000) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } catch (e) {
      return NodeFilter.FILTER_SKIP;
    }
  }

  function apply(root = document.body) {
    if (!(root instanceof Node)) root = document.body;

    // 1) Texto
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: filterTextNode });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) {
      let t = n.nodeValue;
      if (!t || !t.trim()) continue;

      // reemplazos directos
      for (const [en, es] of Object.entries(DICT)) {
        if (t.includes(en)) t = t.replaceAll(en, es);
      }
      // tokens comunes
      t = t.replace(/\bHP\b/g, "PG").replace(/\bHit Points\b/g, "Puntos de golpe");

      // dominios listados por comas/espacios
      t = t.replace(/(^|[,\s])Grace(?=([,\s]|$))/g, "$1Gracia")
           .replace(/(^|[,\s])Codex(?=([,\s]|$))/g, "$1Códice")
           .replace(/(^|[,\s])Valor(?=([,\s]|$))/g, "$1Valor")
           .replace(/(^|[,\s])Blade(?=([,\s]|$))/g, "$1Hoja")
           .replace(/(^|[,\s])Bone(?=([,\s]|$))/g, "$1Hueso")
           .replace(/(^|[,\s])Midnight(?=([,\s]|$))/g, "$1Medianoche")
           .replace(/(^|[,\s])Splendor(?=([,\s]|$))/g, "$1Esplendor")
           .replace(/(^|[,\s])Arcana(?=([,\s]|$))/g, "$1Arcanos")
           .replace(/(^|[,\s])Sage(?=([,\s]|$))/g, "$1Sabio");

      if (t !== n.nodeValue) n.nodeValue = t;
    }

    // 2) Placeholders (evitando inputs ya excluidos por SKIP_SELECTOR)
    const qsa = root.querySelectorAll?.("[placeholder]");
    if (qsa) for (const el of qsa) {
      try {
        if (el.closest(SKIP_SELECTOR)) continue;
        const ph = el.getAttribute("placeholder"); if (!ph) continue;
        let newPh = ph;
        for (const [en, es] of Object.entries(PLACEHOLDERS)) {
          if (newPh.includes(en)) newPh = newPh.replaceAll(en, es);
        }
        if (newPh !== ph) el.setAttribute("placeholder", newPh);
      } catch (e) { /* ignore */ }
    }
  }

  // Pasadas iniciales + retrasadas (ligeras; no usamos characterData para evitar bucles)
  apply(); setTimeout(apply, 300); setTimeout(apply, 900); setTimeout(apply, 2000);

  // Observer solo de estructura (no characterData)
  const mo = new MutationObserver(muts => {
    for (const m of muts) for (const node of m.addedNodes) {
      // Aplicar solo en nodos de la interfaz, no en editores
      if (node.nodeType === 1) {
        if (!node.matches || !node.matches(SKIP_SELECTOR)) apply(node);
      } else if (node.nodeType === 3) {
        apply(node.parentElement ?? document.body);
      }
    }
  });
  mo.observe(document.body, { childList:true, subtree:true });
});
