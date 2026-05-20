#!/usr/bin/env python3
"""Two passes:
1. Add `subtype` field to each Study in projects.json (Essay / Treatise /
   Investigation).
2. Inject a small <p class="page-hero__descriptor">SUBTYPE</p> element
   right below the page-hero__subtitle on each Study page.

Simulators and Applications don't get subtypes — they're homogeneous
enough that the primary type label is sufficient."""
import json
import re
from pathlib import Path

ROOT = Path('C:/Users/Cole/Dropbox/Website')

# title -> subtype (only for Studies)
SUBTYPES = {
    # Essays — narrative/conceptual prose
    'Sound and Setting':                                'Essay',
    'Universe of Proportions':                          'Essay',
    'Certainty, Inference, and Comprehension':          'Essay',
    'Inferential Dynamics':                             'Essay',

    # Treatises — formal mathematical/theoretical work
    'On Dynamical Systems':                             'Treatise',
    'On Physical Analogies':                            'Treatise',
    'Fundamental Principles - On Analogies (continued)': 'Treatise',
    'Gravitational Radiation':                          'Treatise',
    'The Work-Energy Principle':                        'Treatise',
    'Two-Body Gravitational Free Fall':                 'Treatise',
    'Horizontal Frame Centering Algorithm':             'Treatise',
    'Problem-Solving and Critical Path Reasoning':      'Treatise',
    'Thermofluidic Finance':                            'Treatise',
    'Dispersion and Stratification':                    'Treatise',

    # Investigations — hardware/empirical/numerical studies
    'Dynamic Control of an Aeropendulum':               'Investigation',
    'Gravitational Wave Detector':                      'Investigation',
    'Rebound Pendulum':                                 'Investigation',
    'Nonlinear Human Population Growth Modeling':       'Investigation',
}


def update_projects_json():
    json_path = ROOT / 'projects.json'
    projects = json.loads(json_path.read_text(encoding='utf-8'))
    updated = 0
    for p in projects:
        title = p.get('title', '')
        if title in SUBTYPES:
            p['subtype'] = SUBTYPES[title]
            updated += 1
    json_path.write_text(
        json.dumps(projects, indent=2, ensure_ascii=False),
        encoding='utf-8',
    )
    print(f'projects.json: added subtype to {updated} Study entries.')


SUBTITLE_RE = re.compile(
    r'(<p class="page-hero__subtitle">[^<]*</p>)',
    re.DOTALL,
)


def inject_descriptor(path: Path, subtype: str) -> str:
    text = path.read_text(encoding='utf-8')
    # Idempotent — skip if already present
    if 'page-hero__descriptor' in text:
        return 'unchanged'
    descriptor = f'\n                <p class="page-hero__descriptor">{subtype}</p>'
    new_text, n = SUBTITLE_RE.subn(r'\1' + descriptor, text, count=1)
    if n == 0:
        return 'no-subtitle'
    path.write_text(new_text, encoding='utf-8')
    return 'injected'


def update_study_pages():
    json_path = ROOT / 'projects.json'
    projects = json.loads(json_path.read_text(encoding='utf-8'))
    project_root = ROOT / 'projects'

    for p in projects:
        subtype = SUBTYPES.get(p.get('title', ''))
        if not subtype:
            continue
        # link is e.g. "projects/sound-and-setting.html"
        link = p.get('link', '')
        if not link.startswith('projects/'):
            print(f'  [skip non-projects link] {p["title"]}: {link}')
            continue
        slug = link.replace('projects/', '')
        page_path = project_root / slug
        if not page_path.exists():
            print(f'  [missing file]           {p["title"]}: {page_path}')
            continue
        status = inject_descriptor(page_path, subtype)
        print(f'  [{status:11}] {p["title"]}  ({subtype})')


if __name__ == '__main__':
    print('--- Pass 1: projects.json ---')
    update_projects_json()
    print('\n--- Pass 2: per-page descriptor injection ---')
    update_study_pages()
