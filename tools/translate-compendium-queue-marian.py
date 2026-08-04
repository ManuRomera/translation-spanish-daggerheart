#!/usr/bin/env python3
"""Traducción local rápida de la cola mediante Helsinki-NLP/opus-mt-en-es."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path

import torch
from transformers import MarianMTModel, MarianTokenizer


ROOT = Path(__file__).resolve().parent.parent
QUEUE_FILE = ROOT / "tools" / ".compendium-translation-queue.json"
CACHE_FILE = ROOT / "tools" / ".compendium-translation-cache.json"
SEGMENT_CACHE_FILE = ROOT / "tools" / ".compendium-translation-cache-marian.json"

PROTECTED = re.compile(
    r"(<[^>]+>|@[A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]+\])?(?:\{[^}]*\})?|"
    r"Compendium\.daggerheart\.[A-Za-z0-9_.]+|\[\[[^\]]+\]\]|"
    r"https?://[^\s<]+|\{[^{}]+\}|\b\d*d\d+s?(?:\s*[+\-*/]\s*(?:\d+|@[A-Za-z0-9_.]+))*\b)",
    re.IGNORECASE,
)
HTML_TAG = re.compile(r"<[^>]+>")
TECHNICAL = re.compile(
    r"(@[A-Za-z_][A-Za-z0-9_.]*(?:\[[^\]]+\])?(?:\{[^}]*\})?|"
    r"Compendium\.daggerheart\.[A-Za-z0-9_.]+|\[\[[^\]]+\]\]|"
    r"https?://[^\s<]+|\{[^{}]+\}|\b\d*d\d+s?(?:\s*[+\-*/]\s*(?:\d+|@[A-Za-z0-9_.]+))*\b)",
    re.IGNORECASE,
)

GLOSSARY = (
    (r"\bHope\b", "Esperanza"), (r"\bFear\b", "Miedo"), (r"\bStress\b", "Estrés"),
    (r"\bHit Points?\b", "Puntos de Golpe"), (r"\bArmor Slots?\b", "Ranuras de armadura"),
    (r"\bDuality Dice\b", "Dados de Dualidad"), (r"\bGM\b", "DJ"), (r"\bPCs\b", "PJ"),
    (r"\bVery Close\b", "Muy Cerca"), (r"\bVery Far\b", "Muy Lejos"),
    (r"\bMelee\b", "Cuerpo a cuerpo"), (r"\bClose\b", "Cerca"), (r"\bFar\b", "Lejos"),
    (r"\bSpellcast Roll\b", "tirada de lanzamiento de conjuros"),
)


MARKER = re.compile(r"DHKEEP(\d{5})")


def split_plain(text: str, max_chars: int) -> list[str]:
    pieces = re.split(r"(?<=[.!?;:])(?=\s)|(?<=\n)", text)
    output: list[str] = []
    for piece in pieces:
        while len(piece) > max_chars:
            cut = max(piece.rfind(", ", 0, max_chars), piece.rfind(" ", 0, max_chars))
            if cut < max_chars // 3:
                cut = max_chars
            else:
                cut += 1
            output.append(piece[:cut])
            piece = piece[cut:]
        if piece:
            output.append(piece)
    return output


def tokenize_visible(text: str, max_chars: int) -> list[tuple[bool, str]]:
    tokens: list[tuple[bool, str]] = []
    cursor = 0
    for match in HTML_TAG.finditer(text):
        if match.start() > cursor:
            tokens.extend((True, part) for part in split_plain(text[cursor : match.start()], max_chars))
        tokens.append((False, match.group(0)))
        cursor = match.end()
    if cursor < len(text):
        tokens.extend((True, part) for part in split_plain(text[cursor:], max_chars))
    return tokens


def protect(text: str) -> tuple[str, list[str]]:
    values: list[str] = []

    def replace(match: re.Match[str]) -> str:
        values.append(match.group(0))
        return f"ZZZDHKEEP{len(values) - 1:05d}ZZZ"

    return TECHNICAL.sub(replace, text), values


def restore(text: str, values: list[str], source: str) -> str:
    expected = [f"{index:05d}" for index in range(len(values))]
    found = MARKER.findall(text)
    for marker_id in expected:
        if found.count(marker_id) <= 1:
            continue
        matches = list(re.finditer(rf"Z*DHKEEP{marker_id}Z*", text))
        for duplicate in reversed(matches[:-1]):
            text = text[: duplicate.start()] + text[duplicate.end() :]
        found = MARKER.findall(text)
    for index, marker_id in enumerate(expected):
        if marker_id in found:
            continue
        if source.startswith(values[index]):
            text = values[index] + text
            found.append(marker_id)
            values[index] = ""
        elif source.endswith(values[index]):
            text += values[index]
            found.append(marker_id)
            values[index] = ""
    if Counter(found) != Counter(expected):
        raise ValueError(f"marcadores alterados: esperados={expected}, recibidos={found}")
    for index, value in enumerate(values):
        text = re.sub(rf"Z*DHKEEP{index:05d}Z*", lambda _match: value, text)
    return text


def translatable(text: str) -> bool:
    return bool(re.search(r"[A-Za-z]{2,}", TECHNICAL.sub("", text)))


def polish(source: str, translation: str) -> str:
    prefix = re.match(r"^\s*", source).group(0)
    suffix = re.search(r"\s*$", source).group(0)
    value = translation.strip()
    for pattern, replacement in GLOSSARY:
        value = re.sub(pattern, replacement, value, flags=re.IGNORECASE)
    value = re.sub(r"\bpuntos? de impacto\b", lambda m: "Puntos de Golpe" if m.group(0).lower().startswith("puntos") else "Punto de Golpe", value, flags=re.IGNORECASE)
    value = re.sub(r"\bespacios? de armadura\b", lambda m: "Ranuras de armadura" if m.group(0).lower().startswith("espacios") else "Ranura de armadura", value, flags=re.IGNORECASE)
    if source.strip().isupper() and len(source.strip()) > 2:
        value = value.upper()
    return prefix + value + suffix


def save(path: Path, value: dict[str, str]) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--batch-size", type=int, default=48)
    parser.add_argument("--max-chars", type=int, default=380)
    parser.add_argument("--limit-batches", type=int)
    args = parser.parse_args()

    queue = json.loads(QUEUE_FILE.read_text())
    cache = json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}
    segment_cache = json.loads(SEGMENT_CACHE_FILE.read_text()) if SEGMENT_CACHE_FILE.exists() else {}
    cache = {source: translated for source, translated in cache.items() if translated != source}
    segment_cache = {source: translated for source, translated in segment_cache.items() if translated != source}
    pending = [item["source"] for item in queue if item["source"] not in cache]
    tokenized = {source: tokenize_visible(source, args.max_chars) for source in pending}
    segments = list(dict.fromkeys(
        part for tokens in tokenized.values() for visible, part in tokens
        if visible and translatable(part) and part not in segment_cache
    ))

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"Cargando traductor local en {device}; {len(pending)} textos y {len(segments)} segmentos…", flush=True)
    tokenizer = MarianTokenizer.from_pretrained(args.model, local_files_only=True)
    model = MarianMTModel.from_pretrained(args.model, local_files_only=True).to(device).eval()
    batch_count = (len(segments) + args.batch_size - 1) // args.batch_size
    if args.limit_batches:
        batch_count = min(batch_count, args.limit_batches)
    started = time.monotonic()

    with torch.inference_mode():
        for batch_index in range(batch_count):
            batch = segments[batch_index * args.batch_size : (batch_index + 1) * args.batch_size]
            protected = [protect(source) for source in batch]
            encoded = tokenizer([masked for masked, _values in protected], return_tensors="pt", padding=True, truncation=True, max_length=512)
            encoded = {key: value.to(device) for key, value in encoded.items()}
            generated = model.generate(**encoded, max_new_tokens=512, num_beams=3)
            translations = tokenizer.batch_decode(generated, skip_special_tokens=True)
            for source, translation, (_masked, values) in zip(batch, translations, protected, strict=True):
                try:
                    restored = restore(translation, values, source)
                except ValueError:
                    print(f"Marcador alterado: source={source!r} masked={_masked!r} translation={translation!r}", flush=True)
                    raise
                segment_cache[source] = polish(source, restored)
            save(SEGMENT_CACHE_FILE, segment_cache)
            elapsed = time.monotonic() - started
            print(f"[{batch_index + 1}/{batch_count}] {len(batch)} segmentos; {elapsed:.1f}s", flush=True)

    completed = 0
    for source, tokens in tokenized.items():
        if all((not visible or not translatable(part) or part in segment_cache) for visible, part in tokens):
            cache[source] = "".join(segment_cache[part] if visible and translatable(part) else part for visible, part in tokens)
            completed += 1
    save(CACHE_FILE, cache)
    print(f"Textos completos incorporados a la memoria: {completed}/{len(pending)}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
