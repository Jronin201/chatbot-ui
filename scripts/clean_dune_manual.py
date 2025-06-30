import argparse
import re
import textwrap
import unicodedata
from pathlib import Path

DEFAULT_INPUT = Path("documents/dune/dune-manual.txt")
DEFAULT_OUTPUT = Path("documents/dune/dune-manual-cleaned.txt")


def clean(in_path: Path, out_path: Path) -> None:
    raw = in_path.read_text(encoding="utf-8", errors="ignore")

    # 1️⃣ Unicode normalise and strip weird control chars
    text = unicodedata.normalize("NFKC", raw)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", text)

    # 2️⃣ Remove headers / footers that repeat on every page
    text = re.sub(r"\bD U N E\s*\|\s*A D V E N T U R E S.*?\n", "", text, flags=re.I)
    text = re.sub(r"\b\d{1,3}\s*$", "", text, flags=re.M)

    # 3️⃣ Collapse hyphenated line-breaks (improves wrapping)
    text = re.sub(r"-\n([a-z])", r"\1", text, flags=re.I)

    # 4️⃣ Separate paragraphs cleanly
    # 3+ → double break
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = textwrap.dedent(text).strip()

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean the Dune manual")
    parser.add_argument("--in", dest="infile", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--out", dest="outfile", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    try:
        clean(args.infile, args.outfile)
        print(f"✅ cleaned {args.infile} → {args.outfile}")
        return 0
    except Exception as exc:  # pragma: no cover - simple CLI
        print(f"❌ {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
