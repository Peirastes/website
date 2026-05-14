#!/usr/bin/env python3
"""Demote QMD headings inside .content-body to match the cinematic contract:
    .content-body h2 = major section (white, large)
    .content-body h3 = sub-section (amber, smaller)
    .content-body h4 = sub-sub-section (cyan, smaller still)
Quarto outputs h1 for top-level sections, so we shift each level by 1.
Also remove the duplicate <h1 class="title">...</h1> Quarto inserts (already
rendered by page-hero__title)."""
import re
import sys
from pathlib import Path

START = '<!-- QMD_CONTENT_START -->'
END   = '<!-- QMD_CONTENT_END -->'

def shift(html: str, src: str, dst: str) -> str:
    html = re.sub(rf'<{src}(\s|>)', f'<{dst}\\1', html)
    html = re.sub(rf'</{src}>', f'</{dst}>', html)
    return html

def process(path: Path) -> None:
    html = path.read_text(encoding='utf-8')
    i = html.find(START)
    j = html.find(END)
    if i == -1 or j == -1:
        print(f'  [skip — no QMD markers] {path}')
        return
    before = html[:i + len(START)]
    qmd    = html[i + len(START):j]
    after  = html[j:]

    # Remove duplicate Quarto title heading
    qmd = re.sub(r'<h1\s+class="title"[^>]*>.*?</h1>\s*', '', qmd, flags=re.DOTALL)

    # Demote in REVERSE order so higher levels don't get double-shifted
    qmd = shift(qmd, 'h3', 'h4')
    qmd = shift(qmd, 'h2', 'h3')
    qmd = shift(qmd, 'h1', 'h2')

    path.write_text(before + qmd + after, encoding='utf-8')
    print(f'  [demoted] {path.name}')

if __name__ == '__main__':
    for p in sys.argv[1:]:
        process(Path(p))
