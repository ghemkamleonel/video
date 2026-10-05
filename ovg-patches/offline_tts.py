"""Offline TTS backend used when no ElevenLabs API key is configured.

Synthesizes narration sentence by sentence with SVOX Pico (`pico2wave`),
concatenates the clips into one MP3 with ffmpeg, and writes a word-level
transcript in the same format as the ElevenLabs backend
(`[{"word", "start_ms", "end_ms"}, ...]`, punctuation as separate tokens).
Word timings inside a sentence are distributed by character length.
"""
import json
import os
import re
import shutil
import subprocess
import tempfile
import wave
from typing import Dict, List, Optional, Tuple

from scripts.logging_config import get_utility_logger

logger = get_utility_logger("OfflineTTS")

OFFLINE_TTS_LANG = os.getenv("OFFLINE_TTS_LANG", "fr-FR")
OFFLINE_TTS_TEMPO = float(os.getenv("OFFLINE_TTS_TEMPO", "1.05"))
SENTENCE_GAP_MS = 280
PARAGRAPH_GAP_MS = 550
PUNCT = ".,;:!?"


def is_available() -> bool:
    return shutil.which("pico2wave") is not None and shutil.which("ffmpeg") is not None


def _strip_tags(text: str) -> str:
    text = re.sub(r"\[[^\]]*\]", "", text)
    return re.sub(r"[ \t]+", " ", text)


def _split_sentences(paragraph: str) -> List[str]:
    parts = re.split(r"(?<=[.!?])\s+", paragraph.strip())
    return [p.strip() for p in parts if p.strip()]


def _tokenize(sentence: str) -> List[str]:
    tokens = []
    for raw in sentence.split():
        word = raw.strip(PUNCT)
        if word:
            tokens.append(word)
        trailing = raw[len(raw.rstrip(PUNCT)):]
        tokens.extend(ch for ch in trailing)
    return tokens


def _wav_duration_ms(path: str) -> int:
    with wave.open(path, "rb") as w:
        return int(w.getnframes() * 1000 / w.getframerate())


def _synthesize_sentence(sentence: str, out_wav: str, tmp_dir: str) -> int:
    raw = os.path.join(tmp_dir, "raw.wav")
    subprocess.run(["pico2wave", "-l", OFFLINE_TTS_LANG, "-w", raw, sentence], check=True)
    # Trim leading/trailing silence, apply tempo, normalise to 44.1 kHz mono.
    filters = (
        "silenceremove=start_periods=1:start_threshold=-45dB,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
        f"atempo={OFFLINE_TTS_TEMPO}"
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", filters, "-ar", "44100", "-ac", "1", out_wav],
        check=True,
    )
    return _wav_duration_ms(out_wav)


def _silence(path: str, ms: int) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
         "-t", f"{ms / 1000:.3f}", path],
        check=True,
    )


def _time_words(tokens: List[str], start_ms: int, duration_ms: int) -> List[Dict]:
    weights = [len(t) + 1 if t not in PUNCT else 0 for t in tokens]
    total = sum(weights) or 1
    words, cursor = [], float(start_ms)
    for token, weight in zip(tokens, weights):
        if weight == 0:
            t = int(cursor)
            words.append({"word": token, "start_ms": t, "end_ms": t + 1})
            continue
        span = duration_ms * weight / total
        words.append({"word": token, "start_ms": int(cursor), "end_ms": int(cursor + span) - 1})
        cursor += span
    return words


def generate_audio(text: str, audio_output_path: str, transcript_output_path: str) -> Tuple[bool, Optional[str], int, int, int]:
    """Same return contract as elevenlabs_tts.generate_audio_batched."""
    if not is_available():
        return False, "Offline TTS unavailable: install pico2wave (libttspico-utils) and ffmpeg", 0, 0, 0

    clean = _strip_tags(text)
    paragraphs = [p for p in re.split(r"\n\s*\n", clean) if p.strip()]
    words: List[Dict] = []
    clips: List[str] = []
    cursor_ms = 0

    with tempfile.TemporaryDirectory() as tmp:
        idx = 0
        for p_i, paragraph in enumerate(paragraphs):
            sentences = _split_sentences(paragraph)
            for s_i, sentence in enumerate(sentences):
                clip = os.path.join(tmp, f"s{idx:03d}.wav")
                dur = _synthesize_sentence(sentence, clip, tmp)
                clips.append(clip)
                words.extend(_time_words(_tokenize(sentence), cursor_ms, dur))
                cursor_ms += dur
                last = p_i == len(paragraphs) - 1 and s_i == len(sentences) - 1
                if not last:
                    gap = SENTENCE_GAP_MS if s_i < len(sentences) - 1 else PARAGRAPH_GAP_MS
                    gap_clip = os.path.join(tmp, f"g{idx:03d}.wav")
                    _silence(gap_clip, gap)
                    clips.append(gap_clip)
                    cursor_ms += _wav_duration_ms(gap_clip)
                idx += 1

        list_file = os.path.join(tmp, "list.txt")
        with open(list_file, "w", encoding="utf-8") as f:
            f.writelines(f"file '{c}'\n" for c in clips)
        os.makedirs(os.path.dirname(audio_output_path) or ".", exist_ok=True)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list_file,
             "-c:a", "libmp3lame", "-b:a", "192k", audio_output_path],
            check=True,
        )

    with open(transcript_output_path, "w", encoding="utf-8") as f:
        json.dump(words, f, indent=2, ensure_ascii=False)

    logger.info(f"Offline TTS generated {cursor_ms} ms of audio, {len(words)} tokens")
    return True, None, 0, len(words), len(clean)
