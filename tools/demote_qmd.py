#!/usr/bin/env python3
"""Normalize Quarto-rendered QMD content for cinematic injection.

Operates on the region between <!-- QMD_CONTENT_START --> and
<!-- QMD_CONTENT_END --> markers. Three transforms:

1. Remove the duplicate <h1 class="title">...</h1> Quarto inserts (the
   page title is already rendered by .page-hero__title above).
2. Remove the auto-generated <div id="title-block-header">...</div> div
   Quarto inserts. It contains subtitle/author/published metadata that
   the cinematic page-hero (subtitle + page-hero__meta line) renders.
3. Demote heading levels by 1 (h3->h4, h2->h3, h1->h2) so the QMD
   structure matches the .content-body contract:
     .content-body h2 = major section (white, large)
     .content-body h3 = sub-section (amber, smaller)
     .content-body h4 = sub-sub-section (cyan, smaller still)

Idempotent within the QMD block; the page-hero outside the markers
is never touched."""
import re
import sys
from pathlib import Path

START = '<!-- QMD_CONTENT_START -->'
END   = '<!-- QMD_CONTENT_END -->'

def shift(html: str, src: str, dst: str) -> str:
    html = re.sub(rf'<{src}(\s|>)', f'<{dst}\\1', html)
    html = re.sub(rf'</{src}>', f'</{dst}>', html)
    return html

def strip_balanced_div(html: str, open_pattern: str) -> str:
    """Find the first <div> matching open_pattern and remove it along with
    its balanced closing </div>, regardless of nested divs inside."""
    open_re = re.compile(open_pattern)
    open_m = open_re.search(html)
    if not open_m:
        return html
    start = open_m.start()
    pos = open_m.end()
    depth = 1
    div_re = re.compile(r'<(/?)div\b')
    while depth > 0:
        m = div_re.search(html, pos)
        if not m:
            return html  # unbalanced — bail
        if m.group(1):
            depth -= 1
        else:
            depth += 1
        pos = m.end()
    # Strip trailing whitespace + newline so we don't leave blank rows
    while pos < len(html) and html[pos] in ' \t':
        pos += 1
    if pos < len(html) and html[pos] == '\n':
        pos += 1
    return html[:start] + html[pos:]

def process(path: Path) -> None:
    html = path.read_text(encoding='utf-8')
    i = html.find(START)
    j = html.find(END)
    if i == -1 or j == -1:
        print(f'  [skip - no QMD markers] {path}')
        return
    before = html[:i + len(START)]
    qmd    = html[i + len(START):j]
    after  = html[j:]

    # Remove duplicate Quarto title heading (idempotent — no-op if absent)
    qmd = re.sub(r'<h1\s+class="title"[^>]*>.*?</h1>\s*', '', qmd, flags=re.DOTALL)

    # Remove Quarto's auto-generated title-block-header (subtitle/author/date
    # block — already rendered by page-hero subtitle + page-hero__meta line).
    # Idempotent — strip_balanced_div is a no-op if the div is absent.
    qmd = strip_balanced_div(qmd, r'<div\s+id="title-block-header"[^>]*>')

    # Idempotency guard: heading shift is NOT idempotent. Only run it if an
    # h1 still exists in the QMD region (i.e., it hasn't been demoted yet).
    # After demotion, all section h1s become h2s and there's no h1 left
    # inside the QMD content (the page-hero h1 lives outside the markers).
    if re.search(r'<h1(\s|>)', qmd):
        # Demote in REVERSE order so higher levels don't get double-shifted
        qmd = shift(qmd, 'h3', 'h4')
        qmd = shift(qmd, 'h2', 'h3')
        qmd = shift(qmd, 'h1', 'h2')

    path.write_text(before + qmd + after, encoding='utf-8')
    print(f'  [demoted] {path.name}')

if __name__ == '__main__':
    for p in sys.argv[1:]:
        process(Path(p))
