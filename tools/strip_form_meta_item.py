#!/usr/bin/env python3
"""Strip the `Form` meta-item from .meta-row blocks on cinematic pages.

Cole's call (2026-05-19): the Form label (Treatise/Discourse/etc.) is
tautological at the page level — the page itself makes clear what it
is. Type lives in projects.json for filtering on /projects; on the
individual pages we just want the factual data (Published, Venue,
Modified, etc.). This script removes the Form <div class="meta-item">
block; the rest of the meta-row stays intact."""
import re
import sys
from pathlib import Path

ROOT = Path('C:/Users/Cole/Dropbox/Website/projects')

# Match the Form meta-item block; tolerate any value inside.
FORM_ITEM_RE = re.compile(
    r'\s*<div class="meta-item">\s*'
    r'<span class="meta-item__label">Form</span>\s*'
    r'<span class="meta-item__value">[^<]*</span>\s*'
    r'</div>\s*\n',
    re.MULTILINE,
)

def process(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    new = FORM_ITEM_RE.sub('\n', text, count=1)
    if new == text:
        print(f'  [no Form item]   {path.name}')
    else:
        path.write_text(new, encoding='utf-8')
        print(f'  [stripped Form]  {path.name}')

if __name__ == '__main__':
    for p in sorted(ROOT.glob('*.html')):
        process(p)
