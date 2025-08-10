# translation-spanish-daggerheart
Descripción
Traducción al español del sistema Daggerheart para Foundry VTT. Incluye paquete de idioma y parches en tiempo de ejecución para textos incrustados (menús, chat, placeholders, abreviaturas, HP→PG) sin modificar el sistema original.

Características
lang/es.json completo.

Parches inteligentes (scripts/patches.js + scripts/additions.js) que:

Traducen textos “duros” de la UI (p. ej. Compendium Browser, diálogos).

Traducen placeholders (ej.: “Search…” → “Buscar…”, “Situational Bonus” → “Bonus Situacional”).

Mejoran el chat: “Agilidad Prueba” → “Prueba de Agilidad” (y resto).

Abreviaturas de atributos: AGI/STR/FIN/INS/PRE/KNO → AGI/FUE/SUT/INS/PRE/CON.

Normalizan HP: HP → PG, “Maximum/Max HP (Increase)” → PG máx./Aumento de PG máximo.

Términos específicos: “Bardic Rally Dice(s)/Dados” → Arengar del Bardo, “Modifiers” → Modificadores, etc.

No reemplaza archivos del sistema. Activación/desactivación segura.

Compatibilidad
Foundry VTT: v13 (probado 13.347).

Sistema: Daggerheart ≥ 1.0.0.

Instalación
A) Por Manifest URL

Foundry → Módulos → Instalar.

Pega la URL del manifest:

bash
Copiar
Editar
https://raw.githubusercontent.com/<TU_USUARIO_GITHUB>/translation-spanish-daggerheart/main/module.json
Instala y activa el módulo en tu mundo.

En tu perfil de usuario, selecciona Español.

B) ZIP manual

Descarga el ZIP de la Release (ej.: translation-spanish-daggerheart-vX.Y.Z.zip).

Descomprime en Data/modules/translation-spanish-daggerheart/.

Activa el módulo y selecciona Español como idioma de usuario.

Actualización
Actualiza desde la pestaña de Módulos o instala el nuevo ZIP.

Haz Hard Reload del navegador (Ctrl/Cmd+F5) tras actualizar.

Notas de uso
Este módulo traduce la interfaz visible y corrige textos incrustados con parches DOM.

Compendios (nombres/descripciones) no se traducen con i18n de Foundry. Para eso, usa Babele y diccionarios.

Solución de problemas
¿Aún ves inglés?

Verifica Idioma de usuario: Español.

Hard reload del navegador.

Abre la consola (F12). Los parches registran textos ingleses sospechosos.

Desactiva otros módulos de traducción/parcheo y prueba de nuevo.

Abre un Issue con captura + texto exacto para añadirlo al parche.

Cómo contribuir
Se aceptan Issues y PRs. Mantén los placeholders intactos ({valor}, {{var}}), no modifiques ficheros del sistema, añade capturas si puedes.

Estilo: español neutro y claro.

Licencia
La que elijas (recomendado MIT). Añade un archivo LICENSE.
