Translation Spanish Daggerheart
Módulo de localización externo para el sistema Daggerheart en Foundry VTT.

Añade el idioma Español (lang/es.json).

Incluye parches sutiles (scripts/patches.js y scripts/additions.js) para cubrir cadenas incrustadas sin i18n (menús, chat, placeholders, abreviaturas, HP→PG, etc.).

Instalación
A) Por Manifest (recomendado)

Foundry → Add-on Modules → Install Module.

Pega la URL del manifest:
https://raw.githubusercontent.com/ManuRomera/translation-spanish-daggerheart/main/module.json
Instala y activa el módulo.

En tu perfil de usuario, selecciona Español.

B) Manual

Descomprime la carpeta translation-spanish-daggerheart dentro de Data/modules/.

Activa el módulo en Configuración → Módulos.

Cambia el idioma de tu usuario a Español.

Notas
es.json parte de en.json del sistema para asegurar cobertura completa (placeholders intactos).

Los parches son solo JS; no añaden CSS (evita errores MIME).

Compatible con Foundry v13; no modifica archivos del sistema.

Recomendado (opcional)
Para traducir compendios (nombres y descripciones), usa Babele con diccionarios por pack.
