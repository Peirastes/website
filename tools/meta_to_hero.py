#!/usr/bin/env python3
"""Move legacy .page-meta card content into a compact .page-hero__meta line
that sits below the subtitle.

Old structure:
    <p class="page-hero__subtitle">...</p>
  </div>
</header>
<article class="page-body">
  <div class="page-body__inner">
    <div class="content-body">
      <div class="page-meta">
        <div class="meta-item"><span class="meta-label">Published:</span><span>...</span></div>
        ...
      </div>
      ...

New structure:
    <p class="page-hero__subtitle">...</p>
    <div class="page-hero__meta">
      <span>Treatise</span><span>Published Nov 1, 2025</span><span>Updated March 2026</span>
    </div>
  </div>
</header>
... (page-meta inside content-body removed)

Detects two field-set patterns:
  Treatise: Published / Last Updated / Status
  Discourse: Venue / Date / Audience [/ Download]
"""
import re
import sys
from pathlib import Path

SUBTITLE_RE = re.compile(
    r'(<p class="page-hero__subtitle">[^<]*</p>)',
    re.DOTALL,
)
META_OPEN_RE = re.compile(r'\s*<div class="page-meta">')
META_ITEM_RE = re.compile(
    r'<div class="meta-item"[^>]*>\s*'
    r'<span class="meta-label">([^<]+)</span>\s*'
    r'(?:<span>(.*?)</span>|(<a[^>]*>.*?</a>))'
    r'\s*</div>',
    re.DOTALL,
)


def find_balanced_block(html: str, open_match) -> tuple:
    """Given a regex match for an opening <div ...>, scan forward counting
    <div> opens and </div> closes until balanced. Returns (start, end_inclusive)
    where end_inclusive is the index AFTER the matched closing </div>."""
    start = open_match.start()
    pos = open_match.end()
    depth = 1
    # Pattern matches `<div` or `</div` (not the closing `>`), so we have to
    # advance pos past the next `>` ourselves after each match — otherwise
    # the bare `>` gets left behind in the output (Cole noticed this on
    # 2026-05-13: stray `>` chars on every metaline-migrated page).
    pattern = re.compile(r'<(/?)div\b')
    while depth > 0:
        m = pattern.search(html, pos)
        if not m:
            return None
        if m.group(1):  # </div>
            depth -= 1
        else:           # <div ...>
            depth += 1
        # Advance past attributes and the closing > of THIS tag
        gt = html.find('>', m.end())
        if gt == -1:
            return None
        pos = gt + 1
    # advance past trailing whitespace + newline if present
    while pos < len(html) and html[pos] in ' \t':
        pos += 1
    if pos < len(html) and html[pos] == '\n':
        pos += 1
    return (start, pos)

# Map labels to compact metaline text (label -> (prefix, drop_label))
TREATISE_LABELS = {
    'Published':    'Published',
    'Last Updated': 'Updated',
    'Status':       None,           # only show if not "Published"
}
DISCOURSE_LABELS = {
    'Venue':    None,               # show value only (no prefix)
    'Date':     None,
    'Audience': None,
    'Download': 'PDF',              # rendered as anchor link
}


def detect_type(items: dict) -> str:
    if 'Published' in items or 'Last Updated' in items or 'Status' in items:
        return 'Treatise'
    if 'Venue' in items or 'Audience' in items:
        return 'Discourse'
    return ''


def build_metaline(items: dict, type_label: str) -> str:
    """Build a single-line metaline below the subtitle. The type label
    (Treatise/Discourse) is NOT included — it was redundant with the
    page title context. Cole's call 2026-05-13."""
    parts = []
    if type_label == 'Treatise':
        if 'Published' in items:
            parts.append(f'<span>Published {items["Published"]}</span>')
        if 'Last Updated' in items and items['Last Updated'].strip().lower() != items.get('Published', '').strip().lower():
            parts.append(f'<span>Updated {items["Last Updated"]}</span>')
        status = items.get('Status', '').strip()
        if status and status.lower() != 'published':
            parts.append(f'<span>{status}</span>')
    elif type_label == 'Discourse':
        if 'Venue' in items:
            parts.append(f'<span>{items["Venue"]}</span>')
        elif 'Date' in items:
            parts.append(f'<span>{items["Date"]}</span>')
        if 'Audience' in items:
            parts.append(f'<span>{items["Audience"]}</span>')
        if 'Download' in items:
            # items['Download'] is the raw <a> tag
            parts.append(f'<span>{items["Download"]}</span>')

    if not parts:
        return ''
    inner = '\n              '.join(parts)
    return f'<div class="page-hero__meta">\n              {inner}\n            </div>'


def process(path: Path) -> None:
    html = path.read_text(encoding='utf-8')

    open_m = META_OPEN_RE.search(html)
    if not open_m:
        print(f'  [skip — no page-meta] {path.name}')
        return

    span = find_balanced_block(html, open_m)
    if span is None:
        print(f'  [skip — unbalanced page-meta block] {path.name}')
        return
    block_start, block_end = span
    block_text = html[block_start:block_end]

    items = {}
    for item_m in META_ITEM_RE.finditer(block_text):
        label = item_m.group(1).strip().rstrip(':')
        text_value = item_m.group(2)
        anchor = item_m.group(3)
        if anchor:
            items[label] = anchor
        else:
            items[label] = (text_value or '').strip()

    type_label = detect_type(items)
    metaline = build_metaline(items, type_label)
    if not metaline:
        print(f'  [skip — no usable items] {path.name}  (parsed {len(items)} fields)')
        return

    # Remove the old .page-meta block first (so the subtitle insertion doesn't shift)
    new_html = html[:block_start] + '\n' + html[block_end:]

    insertion = f'\\1\n            {metaline}'
    new_html, count = SUBTITLE_RE.subn(insertion, new_html, count=1)
    if count == 0:
        print(f'  [skip — no subtitle found] {path.name}')
        return

    path.write_text(new_html, encoding='utf-8')
    print(f'  [migrated] {path.name}  -->  {type_label}: {len(items)} fields')


if __name__ == '__main__':
    for p in sys.argv[1:]:
        process(Path(p))
