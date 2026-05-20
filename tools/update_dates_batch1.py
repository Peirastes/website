#!/usr/bin/env python3
"""Batch date corrections for 5 pre-2024 projects (Cole's audit 2026-05-19).

Two changes per project:
  1. projects.json `published` ISO date (used for sorting on /projects)
  2. The page meta-row Published value (the human-readable date shown
     on each individual page)
"""
import json
import re
from pathlib import Path

ROOT = Path('C:/Users/Cole/Dropbox/Website')

# title -> (iso_date_for_sort, human_display_string)
UPDATES = {
    'Nonlinear Human Population Growth Modeling': (
        '2018-04-30', 'Summer 2017 &mdash; Spring 2018'),
    'Disk Cam Synthesis': (
        '2018-04-30', 'Summer 2017 &mdash; Spring 2018'),
    'Gravitational Radiation': (
        '2020-12-10', 'December 10th, 2020'),
    'On Physical Analogies': (
        '2021-04-06', 'April 6th, 2021'),
    'Fundamental Principles - On Analogies (continued)': (
        '2021-10-03', 'October 3rd, 2021'),
}

# slug map (title -> page filename)
SLUGS = {
    'Nonlinear Human Population Growth Modeling':       'pop-modeling.html',
    'Disk Cam Synthesis':                                'disk-cam.html',
    'Gravitational Radiation':                           'grav-rad.html',
    'On Physical Analogies':                             'physical-analogies.html',
    'Fundamental Principles - On Analogies (continued)': 'physical-analogies-continued.html',
}


def update_json():
    json_path = ROOT / 'projects.json'
    projects = json.loads(json_path.read_text(encoding='utf-8'))
    for p in projects:
        title = p.get('title', '')
        if title in UPDATES:
            iso, _ = UPDATES[title]
            old = p.get('published')
            if old != iso:
                p['published'] = iso
                print(f'  json: {title}  {old} -> {iso}')
    json_path.write_text(json.dumps(projects, indent=2, ensure_ascii=False), encoding='utf-8')


# Match the Published meta-item and capture its value
META_ITEM_RE = re.compile(
    r'(<div class="meta-item">\s*'
    r'<span class="meta-item__label">Published</span>\s*'
    r'<span class="meta-item__value">)([^<]*)(</span>\s*</div>)',
    re.DOTALL,
)


def update_page(title: str, page_path: Path, new_display: str) -> None:
    if not page_path.exists():
        print(f'  page missing: {page_path}')
        return
    text = page_path.read_text(encoding='utf-8')
    new_text, n = META_ITEM_RE.subn(
        lambda m: m.group(1) + new_display + m.group(3),
        text,
        count=1,
    )
    if n == 0:
        print(f'  page no Published item: {page_path.name}')
        return
    page_path.write_text(new_text, encoding='utf-8')
    print(f'  page: {page_path.name}  -> "{new_display}"')


if __name__ == '__main__':
    print('--- projects.json ---')
    update_json()
    print('\n--- page metalines ---')
    proj_dir = ROOT / 'projects'
    for title, (iso, display) in UPDATES.items():
        slug = SLUGS[title]
        update_page(title, proj_dir / slug, display)
