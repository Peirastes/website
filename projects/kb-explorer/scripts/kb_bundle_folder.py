#!/usr/bin/env python3
"""
kb_bundle_folder.py — concatenate files in a folder, writing the bundle to stdout.

Used as the front-end of the "KB Ingest — Human (Folder)" Keleustes pipeline:
a shell node runs this script and its captured stdout feeds straight into the
context-assembler, replacing the single-file file-reader pattern.

Each file is preceded by a clear `=== FILE: <relpath> ===` separator so the
drafter (Claude) can distinguish sources within a single context payload.

Usage:
    python kb_bundle_folder.py <folder> [--glob '*.md' OR '*.md,*.html']

Exit codes: 0 ok, 2 bad usage / no files matched.
"""
import argparse
import glob
import os
import sys


def main():
    ap = argparse.ArgumentParser(description="Bundle a folder's files into stdout.")
    ap.add_argument('folder')
    ap.add_argument('--glob', default='*.md',
                    help="Glob pattern(s), comma-separated. Default '*.md'. "
                         "Examples: '*.md', '*.md,*.html', '*.{md,html,txt}'.")
    args = ap.parse_args()

    if not os.path.isdir(args.folder):
        print(f"ERROR: folder not found: {args.folder}", file=sys.stderr)
        return 2

    patterns = [p.strip() for p in args.glob.split(',') if p.strip()]
    seen = set()
    files = []
    for p in patterns:
        for f in glob.glob(os.path.join(args.folder, p)):
            if os.path.isfile(f) and f not in seen:
                seen.add(f)
                files.append(f)
    files.sort()

    if not files:
        print(f"ERROR: no files matching '{args.glob}' in {args.folder}",
              file=sys.stderr)
        return 2

    bundled = 0
    out_parts = []
    skipped = []
    for path in files:
        rel = os.path.relpath(path, args.folder).replace(os.sep, '/')
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            skipped.append(rel)
            continue
        out_parts.append(f"=== FILE: {rel} ===\n\n{content.strip()}\n")
        bundled += 1

    # Bundle to stdout (becomes the shell node's :text output).
    # Use the byte-level stdout to force UTF-8 regardless of Windows codepage —
    # text-mode stdout defaults to cp1252 on Windows and chokes on common
    # characters (em-dashes, arrows, smart quotes, etc.) found in KB content.
    bundle = "\n\n".join(out_parts)
    sys.stdout.buffer.write(bundle.encode('utf-8'))

    # Summary on stderr — visible in the pipeline log, not in the data.
    sys.stderr.write(
        f"Bundled {bundled} file(s) from {args.folder} "
        f"(matching: {args.glob})\n"
    )
    if skipped:
        sys.stderr.write(f"Skipped {len(skipped)} non-UTF-8 file(s): "
                         f"{', '.join(skipped)}\n")
    return 0


if __name__ == '__main__':
    sys.exit(main())
