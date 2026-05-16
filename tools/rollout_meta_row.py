#!/usr/bin/env python3
"""Rolls out the meta-row visual to cinematic content pages. For each page:
  1. Removes the legacy <div class="page-hero__meta">...</div> single-line cyan
     metaline from inside the page-hero.
  2. Inserts a <div class="meta-row">...</div> block at the top of
     <div class="page-body__inner"> (above .content-body if present, or
     above whatever follows).

The per-page config is hardcoded below — each entry maps page slug to a list
of (label, value) tuples that become meta-row columns. Dates already in the
spelled-out format ("Month Dth, YYYY") — no conversion."""
import re
import sys
from pathlib import Path

PAGES = {
    # ─── Treatises ──────────────────────────────────────────────────────
    'two-body-problem': [
        ('Form',      'Treatise'),
        ('Published', 'November 1st, 2025'),
        ('Modified',  'March 2026'),
    ],
    'work-energy-principle': [
        ('Form',      'Treatise'),
        ('Published', 'February 2026'),
        ('Modified',  'March 2026'),
    ],
    # on-dynamical-systems: skip (already has meta-row)
    'physical-analogies': [
        ('Form',      'Treatise'),
        ('Published', '2019'),
    ],
    'physical-analogies-continued': [
        ('Form',      'Treatise'),
        ('Published', '2020'),
    ],
    'grav-rad': [
        ('Form',      'Treatise'),
        ('Published', '2019'),
    ],
    'problem-solving-cpr': [
        ('Form',      'Treatise'),
        ('Published', 'October 1st, 2025'),
    ],
    # ─── Discourses ─────────────────────────────────────────────────────
    'disk-cam': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO &mdash; NCUR'),
        ('Date',     '2017'),
    ],
    'grav-det': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO &mdash; ENGR Senior Design'),
        ('Date',     'Spring 2019'),
    ],
    'inferential-dynamics': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO Physics Seminar'),
        ('Date',     '2025'),
    ],
    'pop-modeling': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO &mdash; NCUR + OAS'),
        ('Date',     '2018'),
    ],
    'rebound-pendulum': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO Physics'),
        ('Date',     '2018'),
    ],
    'univ-of-proportions': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO Physics &amp; Engineering'),
        ('Date',     '2018'),
    ],
    'aeropendulum': [
        ('Form',     'Discourse'),
        ('Venue',    'UCO &mdash; ENGR Senior Design'),
        ('Date',     'Spring 2019'),
    ],
}

PAGE_HERO_META_RE = re.compile(
    r'\s*<div class="page-hero__meta">[\s\S]*?</div>\s*\n',
    re.MULTILINE,
)
PAGE_BODY_INNER_OPEN_RE = re.compile(
    r'(<div class="page-body__inner">\s*\n)',
)


def build_meta_row(items: list) -> str:
    rows = []
    for label, value in items:
        rows.append(
            f'                    <div class="meta-item">\n'
            f'                        <span class="meta-item__label">{label}</span>\n'
            f'                        <span class="meta-item__value">{value}</span>\n'
            f'                    </div>'
        )
    inner = '\n'.join(rows)
    return (
        '\n                <div class="meta-row">\n'
        f'{inner}\n'
        '                </div>\n'
    )


def process(slug: str, items: list, root: Path) -> None:
    path = root / f'{slug}.html'
    if not path.exists():
        print(f'  [missing] {slug}')
        return
    html = path.read_text(encoding='utf-8')

    # Skip if already has meta-row at top of page-body__inner
    if re.search(r'<div class="page-body__inner">\s*\n\s*<div class="meta-row">', html):
        print(f'  [already has meta-row] {slug}')
        return

    # Remove the legacy page-hero__meta block
    new_html, n_removed = PAGE_HERO_META_RE.subn('\n', html, count=1)
    if n_removed == 0:
        print(f'  [no page-hero__meta to strip] {slug}')

    # Insert the new meta-row at top of page-body__inner
    meta_row = build_meta_row(items)
    new_html, n_inserted = PAGE_BODY_INNER_OPEN_RE.subn(
        lambda m: m.group(1) + meta_row,
        new_html,
        count=1,
    )
    if n_inserted == 0:
        print(f'  [no page-body__inner found] {slug}')
        return

    path.write_text(new_html, encoding='utf-8')
    print(f'  [migrated] {slug}  ({len(items)} fields)')


if __name__ == '__main__':
    root = Path('C:/Users/Cole/Dropbox/Website/projects')
    for slug, items in PAGES.items():
        process(slug, items, root)
