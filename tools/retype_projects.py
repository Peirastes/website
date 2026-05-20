#!/usr/bin/env python3
"""Apply the new 3-type taxonomy to projects.json.

Old: treatise / instrument / discourse  (overloaded, vague, doesn't
                                          handle hybrids cleanly)
New: study / simulator / application     (mutually exclusive, primary-
                                          artifact test, visitor-action
                                          oriented)

Mapping is per-project (not a blanket find-replace) because the old
labels overlapped categories. Cole's call 2026-05-19."""
import json
from pathlib import Path

ROOT = Path('C:/Users/Cole/Dropbox/Website')

# title -> new type
RETYPE = {
    # ─── SIMULATOR (11) — interactive widgets for exploring concepts ──
    '2D Particle Collision Lab':            'simulator',
    'Artemis II':                            'simulator',
    'Artemis II v2':                         'simulator',
    'Capacitor Dielectric Lab':              'simulator',
    'Data Center Cooling Testbed':           'simulator',
    'Dynamical Systems Lab':                 'simulator',
    'Electrostatics Lab':                    'simulator',
    'Induction Lab':                         'simulator',
    'Navier-Stokes Smoke Simulator':         'simulator',
    'Optics Lab':                            'simulator',
    'Rotating Slot Simulator':               'simulator',

    # ─── APPLICATION (6, incl. hidden) — utilities that do a job ──────
    'ECDO Watch':                            'application',
    'Eisenhower Task Manager':               'application',
    'Disk Cam Synthesis':                    'application',
    'Knowledge Base Explorer':               'application',  # hidden
    'Degree Navigator':                      'application',  # hidden
    'SPECTRUM Market Analytics':             'application',  # hidden

    # ─── STUDY (18+) — read and think about it ────────────────────────
    'Dispersion and Stratification':                            'study',
    'Fundamental Principles - On Analogies (continued)':        'study',
    'Gravitational Radiation':                                  'study',
    'Horizontal Frame Centering Algorithm':                     'study',
    'On Dynamical Systems':                                     'study',
    'On Physical Analogies':                                    'study',
    'Problem-Solving and Critical Path Reasoning':              'study',
    'Sound and Setting':                                        'study',
    'The Work-Energy Principle':                                'study',
    'Thermofluidic Finance':                                    'study',
    'Two-Body Gravitational Free Fall':                         'study',
    'Certainty, Inference, and Comprehension':                  'study',
    'Dynamic Control of an Aeropendulum':                       'study',
    'Gravitational Wave Detector':                              'study',
    'Inferential Dynamics':                                     'study',
    'Nonlinear Human Population Growth Modeling':               'study',
    'Rebound Pendulum':                                         'study',
    'Universe of Proportions':                                  'study',

    # Social Field is hidden + on hold per memory, but classify for
    # completeness — it's a magnetic-field-theory visualization
    'Social Field':                          'simulator',

    # Any leftover projects (in case I missed any)
    # Cam Synthesis UserForm = old name for Disk Cam? Check projects.json
}


def main():
    json_path = ROOT / 'projects.json'
    projects = json.loads(json_path.read_text(encoding='utf-8'))

    print(f'Loaded {len(projects)} project entries.\n')

    unmapped = []
    type_counts = {'simulator': 0, 'application': 0, 'study': 0, '(unchanged)': 0}

    for p in projects:
        title = p.get('title', '')
        new_type = RETYPE.get(title)
        old_type = p.get('type')
        if new_type is None:
            unmapped.append(title)
            type_counts['(unchanged)'] += 1
            continue
        if old_type != new_type:
            p['type'] = new_type
            print(f'  {title.ljust(50)}  {old_type} -> {new_type}')
        type_counts[new_type] += 1

    print(f'\nType distribution after update:')
    for k, v in type_counts.items():
        print(f'  {k.ljust(15)}: {v}')

    if unmapped:
        print(f'\n[!] Unmapped titles (left at original type):')
        for t in unmapped:
            print(f'    - {t}')

    # Write back with preserved formatting (2-space indent, like the
    # existing file). Keep ASCII-safe so we don't break encoding.
    json_path.write_text(
        json.dumps(projects, indent=2, ensure_ascii=False),
        encoding='utf-8',
    )
    print(f'\nWrote {json_path}.')


if __name__ == '__main__':
    main()
