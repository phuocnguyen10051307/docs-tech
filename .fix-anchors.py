from pathlib import Path
import re
import unicodedata

for path in Path('docs').rglob('*.md'):
    if '.vitepress' in path.parts:
        continue
    source = path.read_text(encoding='utf-8')
    source = re.sub(r'(?<=#)([^\s)]+)(?=\))', lambda m: ''.join(c for c in unicodedata.normalize('NFKD', m[1]) if not unicodedata.combining(c)), source)
    path.write_text(source, encoding='utf-8')
