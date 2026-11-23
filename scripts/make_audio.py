#!/usr/bin/env python3
"""Build the short English clips the reading trainer plays.

Letter sounds are synthesized from the same phonemes as the words, so
blending s-a-t matches "sat". A few dictionary pronunciations are overridden
where espeak would teach the wrong vowel (on, log, the article "a").
"""

import re
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PH_DIR = ROOT / "audio" / "p"
WORD_DIR = ROOT / "audio" / "w"
SENT_DIR = ROOT / "audio" / "s"

# espeak-ng phoneme inside [[ ]]. Short i must be stressed ('I), or the
# voice says the letter name. r- is the English approximant, not a trill.
PHONEMES = {
    "s": "s",
    "a": "a",
    "t": "t",
    "p": "p",
    "i": "'I",
    "n": "n",
    "m": "m",
    "d": "d",
    "g": "g",
    "o": "0",
    "c": "k",
    "e": "E",
    "u": "V",
    "r": "r-",
    "h": "h",
    "b": "b",
    "f": "f",
    "l": "l",
}

EXPECT_PHONEME_IPA = {
    "s": "s",
    "a": "æ",
    "t": "t",
    "p": "p",
    "i": "ɪ",
    "n": "n",
    "m": "m",
    "d": "d",
    "g": "ɡ",
    "o": "ɑ",
    "c": "k",
    "e": "ɛ",
    "u": "ʌ",
    "r": "ɹ",
    "h": "h",
    "b": "b",
    "f": "f",
    "l": "l",
}

# Whole-word phoneme chunks. Vowels match the isolated letter sounds.
CHUNK = {
    "sat": "s'at",
    "pat": "p'at",
    "tap": "t'ap",
    "pin": "p'In",
    "pan": "p'an",
    "sit": "s'It",
    "nap": "n'ap",
    "tin": "t'In",
    "ant": "'ant",
    "mat": "m'at",
    "map": "m'ap",
    "dad": "d'ad",
    "mad": "m'ad",
    "sad": "s'ad",
    "and": "'and",
    "sam": "s'am",
    "cat": "k'at",
    "dog": "d'0g",
    "cap": "k'ap",
    "pot": "p'0t",
    "mop": "m'0p",
    "on": "'0n",
    "sun": "s'Vn",
    "red": "r'Ed",
    "hen": "h'En",
    "pen": "p'En",
    "bed": "b'Ed",
    "cup": "k'Vp",
    "bus": "b'Vs",
    "run": "r'Vn",
    "rat": "r'at",
    "net": "n'Et",
    "hat": "h'at",
    "bag": "b'ag",
    "bat": "b'at",
    "fan": "f'an",
    "log": "l'0g",
    "leg": "l'Eg",
    "hot": "h'0t",
    "hop": "h'0p",
    "fat": "f'at",
    "big": "b'Ig",
    "a": "@",
    "the": "D@",
    "I": "'aI",
    "see": "s'i:",
}

VOWEL_OF = {
    "sat": "æ",
    "pat": "æ",
    "tap": "æ",
    "pin": "ɪ",
    "pan": "æ",
    "sit": "ɪ",
    "nap": "æ",
    "tin": "ɪ",
    "ant": "æ",
    "mat": "æ",
    "map": "æ",
    "dad": "æ",
    "mad": "æ",
    "sad": "æ",
    "and": "æ",
    "sam": "æ",
    "cat": "æ",
    "dog": "ɑ",
    "cap": "æ",
    "pot": "ɑ",
    "mop": "ɑ",
    "on": "ɑ",
    "sun": "ʌ",
    "red": "ɛ",
    "hen": "ɛ",
    "pen": "ɛ",
    "bed": "ɛ",
    "cup": "ʌ",
    "bus": "ʌ",
    "run": "ʌ",
    "rat": "æ",
    "net": "ɛ",
    "hat": "æ",
    "bag": "æ",
    "bat": "æ",
    "fan": "æ",
    "log": "ɑ",
    "leg": "ɛ",
    "hot": "ɑ",
    "hop": "ɑ",
    "fat": "æ",
    "big": "ɪ",
    "a": "ə",
    "the": "ə",
    "I": "aɪ",
    "see": "iː",
}

# Speak plain text when the dictionary vowel is already right.
# These three are not: "a" would become the letter name, on/log a different o.
SPOKEN = {
    "sam": "Sam",
    "I": "I",
}
FORCED = {"on", "log", "a"}

SENTENCES = {
    "a-pin": ["a", "pin"],
    "a-pan": ["a", "pan"],
    "a-nap": ["a", "nap"],
    "sam-sat": ["sam", "sat"],
    "dad-sat": ["dad", "sat"],
    "a-sad-dad": ["a", "sad", "dad"],
    "sam-and-dad": ["sam", "and", "dad", "sat"],
    "a-cat-sat": ["a", "cat", "sat"],
    "dog-on-mat": ["a", "dog", "sat", "on", "a", "mat"],
    "sam-on-map": ["sam", "sat", "on", "a", "map"],
    "cat-on-pot": ["a", "cat", "sat", "on", "a", "pot"],
    "cat-and-dog": ["a", "cat", "and", "a", "dog"],
    "a-red-hen": ["a", "red", "hen"],
    "the-cat-sat": ["the", "cat", "sat"],
    "the-red-hen": ["the", "red", "hen", "sat"],
    "the-sun": ["the", "sun"],
    "a-fat-cat": ["a", "fat", "cat"],
    "a-big-bag": ["a", "big", "bag"],
    "hat-on-cat": ["the", "hat", "sat", "on", "the", "cat"],
    "dog-on-log": ["a", "dog", "sat", "on", "a", "log"],
    "i-see-cat": ["I", "see", "a", "cat"],
    "i-see-sun": ["I", "see", "the", "sun"],
    "i-see-hen": ["I", "see", "a", "red", "hen"],
    "i-see-bus": ["I", "see", "a", "big", "bus"],
    "i-see-rat": ["I", "see", "a", "rat"],
    "the-fat-cat-sat": ["the", "fat", "cat", "sat"],
    "cat-on-hat": ["the", "cat", "sat", "on", "a", "hat"],
    "cat-on-dog": ["the", "cat", "sat", "on", "the", "dog"],
}


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def ipa(spec):
    out = subprocess.check_output(
        ["espeak-ng", "-v", "en-us", "-q", "--ipa=1", spec],
        stderr=subprocess.DEVNULL,
    )
    return out.decode().strip()


RATE = 22050

# Isolated b/d/g from espeak are silent, and the other consonants are so
# short that an mp3 encoder drops them. Stops are cut from a tiny release.
# Continuants are stretched so a child can actually hear them.
STOP_AUDIO = {
    "b": "[[b@]]",
    "d": "[[d@]]",
    "g": "[[g@]]",
    "p": "[[p@]]",
    "t": "[[t@]]",
    "c": "[[k@]]",
}
HOLD_AUDIO = {
    "s": "[[s s]]",
    "f": "[[f f]]",
    "h": "[[h h h]]",
    "m": "[[m m m]]",
    "n": "[[n n n]]",
    "l": "[[l l l]]",
    "r": "[[r- r- r-]]",
}


def read_pcm(spec, speed):
    wav = Path("/tmp/kira-phoneme.wav")
    run(
        [
            "espeak-ng",
            "-v",
            "en-us",
            "-s",
            str(speed),
            "-a",
            "200",
            "-w",
            str(wav),
            spec,
        ]
    )
    raw = subprocess.check_output(
        [
            "ffmpeg",
            "-v",
            "error",
            "-i",
            str(wav),
            "-f",
            "s16le",
            "-ac",
            "1",
            "-ar",
            str(RATE),
            "pipe:1",
        ]
    )
    count = len(raw) // 2
    return list(struct.unpack("<" + "h" * count, raw[: count * 2]))


def write_wav(dest, samples):
    dest.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(dest), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(struct.pack("<" + "h" * len(samples), *samples))


def normalize(samples, target=28000):
    peak = max((abs(sample) for sample in samples), default=1) or 1
    gain = target / peak
    return [max(-32767, min(32767, int(sample * gain))) for sample in samples]


def first_loud(samples, threshold):
    for index, sample in enumerate(samples):
        if abs(sample) > threshold:
            return index
    return 0


def last_loud(samples, threshold, start):
    for index in range(len(samples) - 1, start, -1):
        if abs(samples[index]) > threshold:
            return index
    return start


def fade_edges(samples, fade_s=0.02):
    count = min(len(samples) // 2, int(fade_s * RATE))
    out = list(samples)
    for index in range(count):
        gain = index / count
        out[index] = int(out[index] * gain)
        out[-1 - index] = int(out[-1 - index] * gain)
    return out


def stretch(samples, target_s):
    if len(samples) < int(0.02 * RATE):
        return samples
    src = Path("/tmp/kira-stretch-in.wav")
    dst = Path("/tmp/kira-stretch-out.wav")
    write_wav(src, samples)
    speed = (len(samples) / RATE) / target_s
    filters = []
    while speed < 0.5:
        filters.append("atempo=0.5")
        speed /= 0.5
    filters.append(f"atempo={speed:.5f}")
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(src),
            "-filter:a",
            ",".join(filters),
            str(dst),
        ]
    )
    with wave.open(str(dst), "r") as handle:
        frames = handle.readframes(handle.getnframes())
        count = len(frames) // 2
        return list(struct.unpack("<" + "h" * count, frames[: count * 2]))


def build_stop(spec):
    samples = read_pcm(spec, 130)
    start = max(0, first_loud(samples, 1200) - int(0.01 * RATE))
    length = int(0.18 * RATE)
    chunk = samples[start : start + length]
    fade_from = int(0.09 * RATE)
    for index in range(fade_from, len(chunk)):
        gain = 1 - (index - fade_from) / max(1, len(chunk) - fade_from)
        chunk[index] = int(chunk[index] * max(0, gain))
    return fade_edges(normalize(chunk), 0.012)


def build_hold(spec):
    samples = read_pcm(spec, 90)
    start = first_loud(samples, 600)
    end = last_loud(samples, 600, start)
    chunk = samples[start : end + 1] or samples
    return fade_edges(normalize(stretch(chunk, 0.46)))


def build_vowel(spec):
    samples = read_pcm(spec, 105)
    start = first_loud(samples, 800)
    end = last_loud(samples, 800, start)
    return fade_edges(normalize(samples[start : end + 1]))


def silence(seconds):
    return [0] * int(seconds * RATE)


def synth_phoneme(key, dest):
    if key in STOP_AUDIO:
        samples = build_stop(STOP_AUDIO[key])
    elif key in HOLD_AUDIO:
        samples = build_hold(HOLD_AUDIO[key])
    else:
        samples = build_vowel(f"[[{PHONEMES[key]}]]")
    samples = samples + silence(0.06)
    write_wav(dest, samples)
    peak = max((abs(sample) for sample in samples), default=0)
    voiced = [index for index, sample in enumerate(samples) if abs(sample) > 800]
    span = 0 if not voiced else (voiced[-1] - voiced[0]) / RATE
    if peak < 8000 or span < 0.12:
        sys.exit(f"phoneme {key} is still too quiet: peak={peak} span={span:.3f}s")


def synth(spec, dest, speed):
    dest.parent.mkdir(parents=True, exist_ok=True)
    wav = dest.with_suffix(".wav")
    run(
        [
            "espeak-ng",
            "-v",
            "en-us",
            "-s",
            str(speed),
            "-a",
            "175",
            "-w",
            str(wav),
            spec,
        ]
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(wav),
            "-ac",
            "1",
            "-ar",
            "22050",
            "-codec:a",
            "libmp3lame",
            "-b:a",
            "48k",
            str(dest),
        ]
    )
    wav.unlink(missing_ok=True)


def check_curriculum():
    js = (ROOT / "js" / "curriculum.js").read_text(encoding="utf-8")
    missing = []
    for wid in CHUNK:
        if not re.search(rf"^\s*{re.escape(wid)}:\s*\{{", js, re.M):
            missing.append(f"word {wid}")
    for sid in SENTENCES:
        if f'"{sid}":' not in js:
            missing.append(f"sentence {sid}")
    audios = set(re.findall(r'audio:\s*"([^"]+)"', js))
    for audio in sorted(audios):
        if audio not in CHUNK:
            missing.append(f"token audio {audio}")
    if missing:
        sys.exit("curriculum.js is missing:\n  " + "\n  ".join(missing))


def main():
    check_curriculum()
    print("phonemes")
    PH_DIR.mkdir(parents=True, exist_ok=True)
    for old in PH_DIR.glob("*.mp3"):
        old.unlink()
    for key, ph in PHONEMES.items():
        spec = f"[[{ph}]]"
        heard = ipa(spec)
        expect = EXPECT_PHONEME_IPA[key]
        if expect not in heard:
            sys.exit(f"phoneme {key}: expected {expect} in {heard!r} from {spec}")
        synth_phoneme(key, PH_DIR / f"{key}.wav")
    print("words")
    for wid, vowel in VOWEL_OF.items():
        if wid in FORCED:
            spec = f"[[{CHUNK[wid]}]]"
        else:
            spec = SPOKEN.get(wid, wid)
        heard = ipa(spec)
        if vowel not in heard:
            sys.exit(f"word {wid}: expected {vowel} in {heard!r} from {spec}")
        if wid not in FORCED and "ɔ" in heard:
            sys.exit(f"word {wid}: unexpected ɔ in {heard!r}")
        synth(spec, WORD_DIR / f"{wid}.mp3", 128)
    print("sentences")
    for sid, parts in SENTENCES.items():
        spec = "[[" + " ".join(CHUNK[p] for p in parts) + "]]"
        heard = ipa(spec)
        if "ɔ" in heard or "eɪ" in heard:
            sys.exit(f"sentence {sid}: {heard!r} from {spec}")
        synth(spec, SENT_DIR / f"{sid}.mp3", 118)
    print(f"done: {len(PHONEMES)} phonemes, {len(CHUNK)} words, {len(SENTENCES)} sentences")


if __name__ == "__main__":
    main()
