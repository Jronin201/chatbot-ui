import re
import os
import textwrap
import unicodedata
from pathlib import Path

INPUT_PATH = Path("documents/dune/dune-manual.txt")
OUTPUT_PATH = Path("documents/dune/dune-manual-cleaned.txt")

raw = INPUT_PATH.read_text(encoding="utf-8", errors="ignore")

# 1️⃣ Unicode normalise and strip weird control chars
text = unicodedata.normalize("NFKC", raw)
text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]",
              " ", text)   # low-ASCII controls

# 2️⃣ Remove headers / footers that repeat on every page
text = re.sub(r"\bD U N E\s*\|\s*A D V E N T U R E S.*?\n",
              "", text, flags=re.I)
text = re.sub(r"\b\d{1,3}\s*$", "", text,
              flags=re.M)        # lone page numbers

# 3️⃣ Collapse hyphenated line-breaks (improves wrapping)
text = re.sub(r"-\n([a-z])", r"\1", text, flags=re.I)

# 4️⃣ Separate paragraphs cleanly
# 3+ → double break
text = re.sub(r"\n{3,}", "\n\n", text)
text = re.sub(r"[ \t]+", " ", text)                          # collapse spaces
text = textwrap.dedent(text).strip()

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.write_text(text, encoding="utf-8")

print(f"✔  Cleaned text written to {OUTPUT_PATH.resolve()}")
