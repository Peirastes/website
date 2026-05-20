#!/usr/bin/env python3
"""Normalize .meta-row across cinematic pages so every page leads with
the Published date.

Two transformations:
  1. On discourse pages, rename the "Date" label to "Published" (the
     "Date" was just the presentation/publication date — same semantic
     as Published, just inconsistent terminology).
  2. Reorder meta-items so a Published meta-item comes first when it's
     not already in position 1.

Parses each .meta-row, sorts items with Published-first, rewrites
back. Idempotent."""
import re
import sys
from pathlib import Path

ROOT = Path('C:/Users/Cole/Dropbox/Website/projects')

META_ROW_OPEN_RE = re.compile(r'<div class="meta-row">')


def find_balanced_div(html: str, open_match) -> tuple[int, int, int] | None:
    """Given a regex match for an opening <div ...>, scan forward counting
    <div> opens and </div> closes until balanced. Returns (inner_start,
    inner_end, full_end) — inner is the content between the tags, full_end
    includes the closing </div>."""
    inner_start = open_match.end()
    pos = inner_start
    depth = 1
    div_re = re.compile(r'<(/?)div\b')
    last_close_start = -1
    while depth > 0:
        m = div_re.search(html, pos)
        if not m:
            return None
        if m.group(1):
            depth -= 1
            if depth == 0:
                last_close_start = m.start()
        else:
            depth += 1
        gt = html.find('>', m.end())
        if gt == -1:
            return None
        pos = gt + 1
    return (inner_start, last_close_start, pos)
META_ITEM_RE = re.compile(
    r'<div class="meta-item">\s*'
    r'<span class="meta-item__label">([^<]+)</span>\s*'
    r'<span class="meta-item__value">(.*?)</span>\s*'
    r'</div>',
    re.DOTALL,
)


def rebuild_meta_row(items: list[tuple[str, str]]) -> str:
    """items is a list of (label, value) tuples. Returns the full
    .meta-row block content (between <div class="meta-row"> and </div>)."""
    rendered = []
    for label, value in items:
        rendered.append(
            '\n                    <div class="meta-item">\n'
            f'                        <span class="meta-item__label">{label}</span>\n'
            f'                        <span class="meta-item__value">{value}</span>\n'
            '                    </div>'
        )
    return ''.join(rendered) + '\n                '


def transform(meta_row_inner: str) -> str:
    items = []
    for m in META_ITEM_RE.finditer(meta_row_inner):
        label = m.group(1).strip()
        value = m.group(2).strip()
        # Rename "Date" -> "Published" (discourse pages)
        if label == 'Date':
            label = 'Published'
        items.append((label, value))

    if not items:
        return meta_row_inner

    # Sort: Published first; everything else preserves original order
    pub_items = [it for it in items if it[0] == 'Published']
    rest = [it for it in items if it[0] != 'Published']
    sorted_items = pub_items + rest
    return rebuild_meta_row(sorted_items)


def process(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    open_m = META_ROW_OPEN_RE.search(text)
    if not open_m:
        print(f'  [no meta-row]    {path.name}')
        return
    span = find_balanced_div(text, open_m)
    if span is None:
        print(f'  [unbalanced]     {path.name}')
        return
    inner_start, inner_end, full_end = span
    inner = text[inner_start:inner_end]
    new_inner = transform(inner)
    if new_inner == inner:
        print(f'  [unchanged]      {path.name}')
        return
    new_text = text[:inner_start] + new_inner + text[inner_end:]
    path.write_text(new_text, encoding='utf-8')
    print(f'  [normalized]     {path.name}')


if __name__ == '__main__':
    for p in sorted(ROOT.glob('*.html')):
        process(p)
