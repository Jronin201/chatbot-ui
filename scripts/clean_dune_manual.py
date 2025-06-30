import re
import os

INPUT_PATH = "documents/dune/dune-manual.txt"
OUTPUT_PATH = "documents/dune/dune-manual-cleaned.txt"

# Read the original file
with open(INPUT_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# Step 1: Normalize & Clean
text = re.sub(r"\x0c", " ", text)  # form feed
text = re.sub(r"—+", "-", text)    # em-dashes
text = re.sub(r"[■•●]+", "", text)
text = re.sub(r"\n\s*\n", "\n\n", text)  # normalize blank lines
text = re.sub(r"\n(?=\w)", " ", text)    # fix line breaks inside paragraphs

# Step 2: Remove isolated numbers (page #s)
text = re.sub(r"\n?\s*\d{1,3}\s*\n?", "\n", text)

# Step 3: Collapse repeated whitespace
text = re.sub(r"\s{2,}", " ", text)

# Step 4: Save the cleaned version
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print(f"✔ Cleaned text written to {OUTPUT_PATH}")
