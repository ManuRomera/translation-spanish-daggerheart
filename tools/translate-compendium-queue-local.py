#!/usr/bin/env python3
"""Traduce localmente la cola de compendios con un modelo MLX ya instalado.

No envía el SRD ni ninguna otra información a servicios externos. Guarda el
resultado tras cada lote para que el proceso se pueda reanudar sin perder nada.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path

from mlx_vlm import generate, load
from mlx_vlm.prompt_utils import apply_chat_template


ROOT = Path(__file__).resolve().parent.parent
QUEUE_FILE = ROOT / "tools" / ".compendium-translation-queue.json"
CACHE_FILE = ROOT / "tools" / ".compendium-translation-cache.json"

PROTECTED = re.compile(
    r"(<[^>]+>|@[A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]+\])?(?:\{[^}]*\})?|"
    r"Compendium\.daggerheart\.[A-Za-z0-9_.]+|\[\[[^\]]+\]\]|"
    r"https?://[^\s<]+|\{[^{}]+\}|\b\d*d\d+s?(?:\s*[+\-*/]\s*(?:\d+|@[A-Za-z0-9_.]+))*\b)",
    re.IGNORECASE,
)
MARKER = re.compile(r"__DH_KEEP_\d{5}__")

SYSTEM_PROMPT = """Eres traductor profesional de juegos de rol. Traduce del inglés a español de España el texto visible de Daggerheart.

Reglas obligatorias:
- Devuelve EXCLUSIVAMENTE un array JSON válido con objetos {\"id\": número, \"translation\": texto} en el mismo orden.
- Conserva exactamente todos los marcadores __DH_KEEP_00000__; no los traduzcas, borres, dupliques ni reordenes.
- No añadas explicaciones, notas ni formato Markdown.
- Traduce todo el texto natural, incluidos nombres propios descriptivos, títulos, botones y frases breves.
- Mantén coherencia editorial y una redacción natural; usa tuteo.
- Glosario: Hope=Esperanza; Fear=Miedo; Stress=Estrés; Hit Point=Punto de Golpe; Armor Slot=Ranura de armadura; Duality Dice=Dados de Dualidad; GM=DJ; action roll=tirada de acción; reaction roll=tirada de reacción; Spellcast Roll=tirada de lanzamiento de conjuros; advantage=ventaja; disadvantage=desventaja; short rest=descanso breve; long rest=descanso prolongado; downtime move=movimiento de descanso; melee=Cuerpo a cuerpo; Very Close=Muy Cerca; Close=Cerca; Far=Lejos; Very Far=Muy Lejos; Agility=Agilidad; Strength=Fuerza; Finesse=Sutileza; Instinct=Instinto; Presence=Presencia; Knowledge=Conocimiento; damage=daño; Major=Mayor; Severe=Severo.
"""


def protect(text: str) -> tuple[str, list[str]]:
    values: list[str] = []

    def replace(match: re.Match[str]) -> str:
        values.append(match.group(0))
        return f"__DH_KEEP_{len(values) - 1:05d}__"

    return PROTECTED.sub(replace, text), values


def restore(text: str, values: list[str]) -> str:
    expected = [f"__DH_KEEP_{index:05d}__" for index in range(len(values))]
    found = MARKER.findall(text)
    if Counter(found) != Counter(expected):
        raise ValueError(f"marcadores alterados: esperados={expected}, recibidos={found}")
    for index, value in enumerate(values):
        text = text.replace(f"__DH_KEEP_{index:05d}__", value)
    return text


def extract_json(text: str):
    text = text.replace("<end_of_utterance>", "").strip()
    decoder = json.JSONDecoder()
    for index, char in enumerate(text):
        if char != "[":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
            if isinstance(value, list):
                return value
        except json.JSONDecodeError:
            continue
    # Gemma omite ocasionalmente la última comilla en respuestas de un elemento.
    prefix = '[{"id": 0, "translation": "'
    if text.startswith(prefix) and text.endswith("}]"):
        body = text[len(prefix) : -2]
        try:
            return [{"id": 0, "translation": json.loads(f'"{body}"')}]
        except json.JSONDecodeError:
            pass
    raise ValueError(f"no se encontró un array JSON válido: {text[:300]!r}")


def make_batches(queue: list[dict], max_chars: int) -> list[list[dict]]:
    batches: list[list[dict]] = []
    current: list[dict] = []
    current_size = 0
    for item in queue:
        size = len(item["source"])
        if current and current_size + size > max_chars:
            batches.append(current)
            current = []
            current_size = 0
        current.append(item)
        current_size += size
    if current:
        batches.append(current)
    return batches


def split_long_text(text: str, max_chars: int) -> list[str]:
    """Divide HTML/texto grande sin cambiar un solo carácter al recomponerlo."""
    if len(text) <= max_chars:
        return [text]
    raw_parts = re.split(r"(?i)(</(?:p|h[1-6]|li|blockquote|tr|table)>|\n)", text)
    parts: list[str] = []
    for index in range(0, len(raw_parts), 2):
        part = raw_parts[index]
        if index + 1 < len(raw_parts):
            part += raw_parts[index + 1]
        parts.append(part)
    chunks: list[str] = []
    current = ""
    for part in parts:
        if not part:
            continue
        if len(current) + len(part) <= max_chars:
            current += part
            continue
        if current:
            chunks.append(current)
            current = ""
        while len(part) > max_chars:
            cut = max(part.rfind(". ", 0, max_chars), part.rfind("; ", 0, max_chars), part.rfind(" ", 0, max_chars))
            if cut < max_chars // 3:
                cut = max_chars
            else:
                cut += 1
            chunks.append(part[:cut])
            part = part[cut:]
        current = part
    if current:
        chunks.append(current)
    if "".join(chunks) != text:
        raise ValueError("la división de texto no es reversible")
    return chunks


def translate_batch(model, processor, batch: list[dict], max_tokens: int) -> dict[str, str]:
    prepared = []
    protected_by_id: dict[int, list[str]] = {}
    for index, item in enumerate(batch):
        masked, protected = protect(item["source"])
        prepared.append({"id": index, "text": masked})
        protected_by_id[index] = protected

    request = SYSTEM_PROMPT + "\nTEXTOS:\n" + json.dumps(prepared, ensure_ascii=False)
    prompt = apply_chat_template(
        processor,
        model.config,
        [{"role": "user", "content": [{"type": "text", "text": request}]}],
        num_images=0,
        enable_thinking=False,
    )
    response = generate(
        model,
        processor,
        prompt,
        max_tokens=max_tokens,
        temperature=0.1,
        verbose=False,
    ).text
    try:
        parsed = extract_json(response)
    except ValueError:
        Path("/tmp/daggerheart-last-model-response.txt").write_text(response)
        print(f"  Respuesta inválida: {len(response)} caracteres; final={response[-180:]!r}", flush=True)
        raise
    by_id = {int(item["id"]): item["translation"] for item in parsed if "id" in item and "translation" in item}
    if set(by_id) != set(range(len(batch))):
        raise ValueError(f"IDs incompletos: esperados {len(batch)}, recibidos {sorted(by_id)}")

    translated: dict[str, str] = {}
    for index, item in enumerate(batch):
        value = restore(str(by_id[index]), protected_by_id[index]).strip()
        if not value:
            raise ValueError(f"traducción vacía para ID {index}")
        translated[item["source"]] = value
    return translated


def translate_with_fallback(model, processor, batch: list[dict], max_tokens: int, depth: int = 0) -> dict[str, str]:
    try:
        return translate_batch(model, processor, batch, max_tokens)
    except Exception as error:
        if len(batch) == 1 or depth >= 5:
            raise RuntimeError(f"No se pudo traducir {batch[0]['source'][:100]!r}: {error}") from error
        midpoint = len(batch) // 2
        print(f"  Lote dividido por validación: {error}", flush=True)
        return {
            **translate_with_fallback(model, processor, batch[:midpoint], max_tokens, depth + 1),
            **translate_with_fallback(model, processor, batch[midpoint:], max_tokens, depth + 1),
        }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="Ruta local del modelo MLX")
    parser.add_argument("--queue-file", type=Path, default=QUEUE_FILE)
    parser.add_argument("--cache-file", type=Path, default=CACHE_FILE)
    parser.add_argument("--batch-chars", type=int, default=5200)
    parser.add_argument("--max-tokens", type=int, default=7000)
    parser.add_argument("--limit-batches", type=int)
    args = parser.parse_args()

    queue = json.loads(args.queue_file.read_text())
    cache = json.loads(args.cache_file.read_text()) if args.cache_file.exists() else {}
    pending = [item for item in queue if item["source"] not in cache]
    parents: dict[str, list[str]] = {}
    units: list[dict] = []
    for item in pending:
        pieces = split_long_text(item["source"], args.batch_chars)
        parents[item["source"]] = pieces
        for piece in pieces:
            if piece not in cache:
                units.append({"source": piece, "contexts": item.get("contexts", [])})
    # La memoria por segmento también evita traducir párrafos repetidos.
    units = list({item["source"]: item for item in units}.values())
    batches = make_batches(units, args.batch_chars)
    if args.limit_batches:
        batches = batches[: args.limit_batches]
    if not batches:
        print("No hay textos pendientes.")
        return 0

    print(f"Cargando modelo local; {len(pending)} textos ({len(units)} segmentos) en {len(batches)} lotes…", flush=True)
    model, processor = load(args.model)
    started = time.monotonic()
    for index, batch in enumerate(batches, 1):
        translated = translate_with_fallback(model, processor, batch, args.max_tokens)
        cache.update(translated)
        for source, pieces in parents.items():
            if source not in cache and all(piece in cache for piece in pieces):
                cache[source] = "".join(cache[piece] for piece in pieces)
        args.cache_file.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n")
        elapsed = time.monotonic() - started
        print(
            f"[{index}/{len(batches)}] {len(translated)} textos; "
            f"{sum(len(value) for value in translated.values())} caracteres; {elapsed:.0f}s",
            flush=True,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
