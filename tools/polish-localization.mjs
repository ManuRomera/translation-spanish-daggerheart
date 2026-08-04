import fs from "node:fs";

const [file] = process.argv.slice(2);
if (!file) {
    console.error("Usage: node tools/polish-localization.mjs <es.json>");
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));

const exactOverrides = {
    "DAGGERHEART.ACTIONS.TYPES.effect.tooltip": "Acción genérica que muestra un mensaje en el chat si no hay nada configurado.",
    "DAGGERHEART.ACTORS.Character.defaultHopeDice": "Dado de Esperanza predeterminado",
    "DAGGERHEART.ACTORS.Character.defaultFearDice": "Dado de Miedo predeterminado",
    "DAGGERHEART.ACTORS.Character.companionFeatures": "Rasgos del compañero",
    "DAGGERHEART.APPLICATIONS.CountdownEdit.title": "Editar cuenta atrás",
    "DAGGERHEART.APPLICATIONS.DaggerheartMenu.title": "Herramientas del DJ",
    "DAGGERHEART.APPLICATIONS.HUD.tokenHUD.depositPartyTokens": "Guardar los tokens del grupo",
    "DAGGERHEART.APPLICATIONS.HUD.tokenHUD.retrievePartyTokens": "Recuperar los tokens del grupo",
    "DAGGERHEART.APPLICATIONS.HUD.tokenHUD.depositCompanionTokens": "Guardar el token del compañero",
    "DAGGERHEART.APPLICATIONS.HUD.tokenHUD.retrieveCompanionTokens": "Recuperar el token del compañero",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.title": "Tirada en equipo",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.createTagTeam": "Crear tirada en equipo",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.cancelConfirmTitle": "Cancelar tirada en equipo",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.cancelConfirmText": "¿Seguro que quieres cancelar la tirada en equipo? También se cerrará para el resto de jugadores.",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.chatMessageRollTitle": "Tirada",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.linkMessageHint": "Haz una tirada desde tu hoja de personaje para vincularla a la tirada en equipo.",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.insufficientHope": "El personaje iniciador no tiene suficiente Esperanza.",
    "DAGGERHEART.APPLICATIONS.TagTeamSelect.hints.selectRoll": "Selecciona qué resultado se usará para la tirada en equipo.",
    "DAGGERHEART.CLASS.Feature.rallyDice": "Dados de arenga",
    "DAGGERHEART.CLASS.Feature.short": "Arenga",
    "DAGGERHEART.CONFIG.DamageType.physical.abbreviation": "Fís.",
    "DAGGERHEART.CONFIG.DamageType.magical.abbreviation": "Mág.",
    "DAGGERHEART.CONFIG.DamageType.direct.abbreviation": "Dir.",
    "DAGGERHEART.CONFIG.DeathMoves.riskItAll.name": "Arriesgarlo todo",
    "DAGGERHEART.CONFIG.DeathMoves.riskItAll.description": "Tira tus dados de dualidad. Si el dado de Esperanza obtiene el resultado más alto, tu personaje se mantiene en pie y elimina tantos puntos de golpe o de estrés como el resultado del dado de Esperanza; puedes repartir esa cantidad entre ambos recursos como prefieras. Si el dado de Miedo obtiene el resultado más alto, tu personaje atraviesa el velo de la muerte. Si ambos dados muestran el mismo resultado, tu personaje se mantiene en pie y elimina todos sus puntos de golpe y de estrés marcados.",
    "DAGGERHEART.CONFIG.DeathMoves.blazeOfGlory.name": "Momento de gloria",
    "DAGGERHEART.CONFIG.DeathMoves.blazeOfGlory.description": "Tu personaje abraza la muerte y se marcha en un momento de gloria. Realiza una última acción: obtiene automáticamente un éxito crítico (con la aprobación del DJ) y después atraviesas el velo de la muerte. NOTA: se ha añadido a tu personaje un efecto de Momento de gloria. Cualquier tirada de dualidad será automáticamente un éxito crítico.",
    "DAGGERHEART.CONFIG.HealingType.hitPoints.abbreviation": "PG",
    "DAGGERHEART.CONFIG.HealingType.stress.abbreviation": "EST",
    "DAGGERHEART.CONFIG.HealingType.hope.abbreviation": "ESP",
    "DAGGERHEART.CONFIG.HealingType.armor.abbreviation": "ARM",
    "DAGGERHEART.CONFIG.HealingType.fear.abbreviation": "MIE",
    "DAGGERHEART.CONFIG.Range.self.name": "Personal",
    "DAGGERHEART.CONFIG.Range.self.short": "Personal",
    "DAGGERHEART.CONFIG.Range.self.description": "se refiere a ti mismo.",
    "DAGGERHEART.CONFIG.Range.melee.name": "Cuerpo a cuerpo",
    "DAGGERHEART.CONFIG.Range.melee.short": "C. a cuerpo",
    "DAGGERHEART.CONFIG.Range.veryClose.name": "Muy cerca",
    "DAGGERHEART.CONFIG.Range.veryClose.short": "Muy cerca",
    "DAGGERHEART.CONFIG.Range.close.name": "Cerca",
    "DAGGERHEART.CONFIG.Range.close.short": "Cerca",
    "DAGGERHEART.CONFIG.Range.far.name": "Lejos",
    "DAGGERHEART.CONFIG.Range.far.short": "Lejos",
    "DAGGERHEART.CONFIG.Range.veryFar.name": "Muy lejos",
    "DAGGERHEART.CONFIG.Range.veryFar.short": "Muy lejos",
    "DAGGERHEART.CONFIG.Traits.agility.name": "Agilidad",
    "DAGGERHEART.CONFIG.Traits.agility.short": "AGI",
    "DAGGERHEART.CONFIG.Traits.agility.verb.sprint": "Correr",
    "DAGGERHEART.CONFIG.Traits.agility.verb.leap": "Saltar",
    "DAGGERHEART.CONFIG.Traits.agility.verb.maneuver": "Maniobrar",
    "DAGGERHEART.CONFIG.Traits.strength.name": "Fuerza",
    "DAGGERHEART.CONFIG.Traits.strength.short": "FUE",
    "DAGGERHEART.CONFIG.Traits.strength.verb.lift": "Levantar",
    "DAGGERHEART.CONFIG.Traits.strength.verb.smash": "Destrozar",
    "DAGGERHEART.CONFIG.Traits.strength.verb.grapple": "Agarrar",
    "DAGGERHEART.CONFIG.Traits.finesse.name": "Sutileza",
    "DAGGERHEART.CONFIG.Traits.finesse.short": "SUT",
    "DAGGERHEART.CONFIG.Traits.finesse.verb.control": "Controlar",
    "DAGGERHEART.CONFIG.Traits.finesse.verb.hide": "Ocultarse",
    "DAGGERHEART.CONFIG.Traits.finesse.verb.tinker": "Manipular",
    "DAGGERHEART.CONFIG.Traits.instinct.name": "Instinto",
    "DAGGERHEART.CONFIG.Traits.instinct.short": "INS",
    "DAGGERHEART.CONFIG.Traits.instinct.verb.perceive": "Percibir",
    "DAGGERHEART.CONFIG.Traits.instinct.verb.sense": "Detectar",
    "DAGGERHEART.CONFIG.Traits.instinct.verb.navigate": "Orientarse",
    "DAGGERHEART.CONFIG.Traits.presence.name": "Presencia",
    "DAGGERHEART.CONFIG.Traits.presence.short": "PRE",
    "DAGGERHEART.CONFIG.Traits.presence.verb.charm": "Encandilar",
    "DAGGERHEART.CONFIG.Traits.presence.verb.perform": "Actuar",
    "DAGGERHEART.CONFIG.Traits.presence.verb.deceive": "Engañar",
    "DAGGERHEART.CONFIG.Traits.knowledge.name": "Conocimiento",
    "DAGGERHEART.CONFIG.Traits.knowledge.short": "CON",
    "DAGGERHEART.CONFIG.Traits.knowledge.verb.recall": "Recordar",
    "DAGGERHEART.CONFIG.Traits.knowledge.verb.analyze": "Analizar",
    "DAGGERHEART.CONFIG.Traits.knowledge.verb.comprehend": "Comprender",
    "DAGGERHEART.GENERAL.Advantage.short": "Vent.",
    "DAGGERHEART.GENERAL.Battlepoints.full": "Puntos de batalla",
    "DAGGERHEART.GENERAL.Battlepoints.short": "PB",
    "DAGGERHEART.GENERAL.Disadvantage.short": "Desv.",
    "DAGGERHEART.GENERAL.Domain.arcana.label": "Arcana",
    "DAGGERHEART.GENERAL.Domain.blade.label": "Hoja",
    "DAGGERHEART.GENERAL.Domain.bone.label": "Hueso",
    "DAGGERHEART.GENERAL.Domain.codex.label": "Códice",
    "DAGGERHEART.GENERAL.Domain.grace.label": "Gracia",
    "DAGGERHEART.GENERAL.Domain.midnight.label": "Medianoche",
    "DAGGERHEART.GENERAL.Domain.sage.label": "Sabiduría",
    "DAGGERHEART.GENERAL.Domain.splendor.label": "Esplendor",
    "DAGGERHEART.GENERAL.Domain.valor.label": "Valor",
    "DAGGERHEART.GENERAL.HitPoints.short": "PG",
    "DAGGERHEART.GENERAL.levelShort": "Nv.",
    "DAGGERHEART.GENERAL.maxWithThing": "Máx. {thing}",
    "DAGGERHEART.GENERAL.rerolled": "Repetida",
    "DAGGERHEART.GENERAL.rollWith": "Tirada de {roll}",
    "DAGGERHEART.GENERAL.rollDamage": "Tirar daño",
    "DAGGERHEART.GENERAL.dualityDice": "Dados de dualidad",
    "DAGGERHEART.GENERAL.Damage.severe": "Grave",
    "DAGGERHEART.GENERAL.Damage.major": "Mayor",
    "DAGGERHEART.SETTINGS.Appearance.fearDisplay.bar": "Barra",
    "DAGGERHEART.SETTINGS.Menu.appearance.diceSoNice.title": "Dice So Nice",
    "DAGGERHEART.GENERAL.Bonuses.maxLoadout.label": "Bonificación al máximo de cartas equipadas",
    "DAGGERHEART.SETTINGS.Homebrew.deleteResourceTitle": "Eliminar recurso de reglas caseras",
    "DAGGERHEART.SETTINGS.Menu.homebrew.name": "Reglas caseras",
    "DAGGERHEART.SETTINGS.Menu.homebrew.label": "Configurar reglas caseras",
    "DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxLoadout.label": "Máximo de cartas equipadas",
    "DAGGERHEART.SETTINGS.Homebrew.FIELDS.maxLoadout.hint": "Déjalo en blanco o usa 0 para no establecer ningún máximo.",
    "DAGGERHEART.UI.Chat.attackRoll.rollDamage": "Tirar daño",
    "DAGGERHEART.UI.Chat.damageRoll.dealDamageToTargets": "Infligir daño a los objetivos",
    "DAGGERHEART.UI.Chat.damageRoll.rollDamage": "Tirar daño",
    "DAGGERHEART.UI.Chat.deathMove.journeysEnd": "Tienes {scars} cicatrices y has tachado tu último espacio de Esperanza. El viaje de tu personaje termina.",
    "DAGGERHEART.UI.Chat.deathMove.riskItAllFailure": "El dado de Miedo obtuvo el resultado más alto. Has atravesado el velo de la muerte.",
    "DAGGERHEART.UI.Chat.deathMove.riskItAllSuccessWithEnoughHope": "El valor de Esperanza supera los puntos de estrés y de golpe marcados. Elimínalos todos.",
    "DAGGERHEART.UI.Chat.deathMove.riskItAllSuccess": "El dado de Esperanza obtuvo el resultado más alto. Elimina hasta {hope} puntos de estrés o de golpe.",
    "DAGGERHEART.UI.Notifications.featureNotHope": "Este rasgo se está usando para otra finalidad y no puede utilizarse como rasgo de Esperanza.",
    "DAGGERHEART.UI.Notifications.featureNotPrimary": "Este rasgo se está usando para otra finalidad y no puede utilizarse como rasgo principal.",
    "DAGGERHEART.UI.Notifications.featureNotSecondary": "Este rasgo se está usando para otra finalidad y no puede utilizarse como rasgo secundario.",
    "DAGGERHEART.UI.Notifications.featureNotSpecialization": "Este rasgo se está usando para otra finalidad y no puede utilizarse como rasgo de especialización.",
    "DAGGERHEART.UI.Notifications.loadoutMaxReached": "Has alcanzado el máximo de cartas equipadas. Mueve al menos una carta de dominio a la bóveda o aumenta el límite en las reglas caseras.",
    "DAGGERHEART.UI.Notifications.domainMaxReached": "Has alcanzado el máximo de dominios de la clase. Puedes aumentar el límite en las reglas caseras.",
    "DAGGERHEART.UI.Notifications.lackingItemTransferPermission": "El usuario {user} no tiene permiso de propietario para transferir objetos a {target}.",
    "DAGGERHEART.UI.Tooltip.openItemWorld": "Abrir objeto del mundo",
    "DAGGERHEART.UI.Chat.tagTeam.title": "Tirada en equipo",
    "DAGGERHEART.UI.ChatLog.assignTagRoll": "Asignar como tirada en equipo"
};

function polishText(key, input) {
    if (exactOverrides[key] !== undefined) return exactOverrides[key];
    let text = input;
    const replacements = [
        [/\bRollo(s)?\b/g, (_, plural) => plural ? "Tiradas" : "Tirada"],
        [/\brollo(s)?\b/g, (_, plural) => plural ? "tiradas" : "tirada"],
        [/\bTarjeta(s)?\b/g, (_, plural) => plural ? "Cartas" : "Carta"],
        [/\btarjeta(s)?\b/g, (_, plural) => plural ? "cartas" : "carta"],
        [/\bCuenta(s)? regresiva(s)?\b/g, (_, p1, p2) => (p1 || p2) ? "Cuentas atrás" : "Cuenta atrás"],
        [/\bcuenta(s)? regresiva(s)?\b/g, (_, p1, p2) => (p1 || p2) ? "cuentas atrás" : "cuenta atrás"],
        [/\btiempo de inactividad\b/gi, "descanso"],
        [/\bequipo de etiqueta\b/gi, "equipo"],
        [/\bTagTeam\b/g, "equipo"],
        [/\bDados tan bonitos\b/g, "Dice So Nice"],
        [/\bDados de dualidad\b/g, "Dados de dualidad"],
        [/\bForma animal\b/g, "Forma bestial"],
        [/\bforma animal\b/g, "forma bestial"],
        [/\bBeastform\b/g, "Forma bestial"],
        [/\bLevelup Auto\b/g, "subida de nivel automática"],
        [/\bNivel superior\b/g, "Subida de nivel"],
        [/\bnivel superior\b/g, "subida de nivel"],
        [/\bGM\b/g, "DJ"],
        [/\bArtículo(s)?\b/g, (_, plural) => plural ? "Objetos" : "Objeto"],
        [/\bartículo(s)?\b/g, (_, plural) => plural ? "objetos" : "objeto"],
        [/\brasgos de carácter\b/g, "rasgos del personaje"],
        [/\btamaño de carácter\b/g, "tamaño del personaje"]
    ];
    for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);

    if (/Party|party/i.test(key)) text = text.replace(/\bfiesta(s)?\b/gi, (_, plural) => plural ? "grupos" : "grupo");
    if (/Character|character/i.test(key)) {
        text = text.replace(/\bCarácter(?:es)?\b/g, "Personaje");
        text = text.replace(/\bcarácter(?:es)?\b/g, "personaje");
        text = text.replace(/\bcaracteres\b/g, "personajes");
    }
    if (/Background|background/i.test(key)) text = text.replace(/\bFondo(s)?\b/g, (_, plural) => plural ? "Trasfondos" : "Trasfondo").replace(/\bfondo(s)?\b/g, (_, plural) => plural ? "trasfondos" : "trasfondo");
    if (/Environment|environment/i.test(key)) text = text.replace(/\bAmbiente(s)?\b/g, (_, plural) => plural ? "Entornos" : "Entorno").replace(/\bambiente(s)?\b/g, (_, plural) => plural ? "entornos" : "entorno");
    if (/Item|item/i.test(key)) text = text.replace(/\bArtículo(s)?\b/g, (_, plural) => plural ? "Objetos" : "Objeto").replace(/\bartículo(s)?\b/g, (_, plural) => plural ? "objetos" : "objeto");
    if (/Traits?|trait/i.test(key)) {
        text = text.replace(/\bCaracterística(s)?\b/g, (_, plural) => plural ? "Rasgos" : "Rasgo");
        text = text.replace(/\bcaracterística(s)?\b/g, (_, plural) => plural ? "rasgos" : "rasgo");
    }
    if (/DomainCard|domainCard/i.test(key)) text = text.replace(/\btarjeta(s)?\b/gi, (_, plural) => plural ? "cartas" : "carta");
    if (/GENERAL\.Domain\./.test(key)) {
        const domains = new Map([
            ["Blade", "Hoja"], ["Bone", "Hueso"], ["Codex", "Códice"], ["Grace", "Gracia"],
            ["Midnight", "Medianoche"], ["Sage", "Sabiduría"], ["Splendor", "Esplendor"]
        ]);
        for (const [english, spanish] of domains) text = text.replaceAll(english, spanish);
    }
    return text;
}

function visit(value, prefix = "") {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        for (const [key, child] of Object.entries(value)) {
            const path = prefix ? `${prefix}.${key}` : key;
            value[key] = visit(child, path);
        }
        return value;
    }
    return typeof value === "string" ? polishText(prefix, value) : value;
}

visit(data);
fs.writeFileSync(file, `${JSON.stringify(data, null, 4)}\n`);
