#!/usr/bin/env python3
"""
kb_ingest_append.py — allocate IDs and append vetted claims to a KB domain file.

Used as the write step of the "KB Ingest — Human" Keleustes pipeline. Runs AFTER
the RA-review breakpoint, so its input is already human-vetted claim text.

Why this exists: claim IDs are assigned deterministically here, post-vetting —
never by the drafting LLM. The drafter emits placeholder headers (### NEW-1:, ### NEW-2: …);
this script scans the target file for the highest existing <PREFIX>-<n>, then renumbers
the placeholders sequentially from there. Rejected drafts therefore consume no IDs,
and the LLM can never invent a colliding ID.

Usage:
    python kb_ingest_append.py <target_domain.md> <new_claims.md> --prefix BIO [--title "Life Sciences & Biology"]

- target_domain.md : the domain file to append to (created with a header if absent)
- new_claims.md    : vetted claim blocks, each headed "### NEW-<k>: <Title>"
- --prefix         : claim ID prefix (e.g. BIO, PHYS). Required for a new file;
                     inferred from existing IDs if omitted and the file exists.
- --title          : domain title used only when creating a new file's header.

Exit codes: 0 ok, 2 bad usage / no claims found.
"""
import argparse
import os
import re
import sys

# Placeholder header (drafter output): ### NEW-1: Title  (tolerates ### NEW-01:)
PLACEHOLDER = re.compile(r'^###\s+NEW-(\d+):', re.MULTILINE)


def build_id_re(prefix):
    """Regex matching '### <prefix>-<digits>:' headers for the given prefix.
    Supports single-segment ('BIO') and multi-segment ('SOP-CE', 'IFC-CE-CD') prefixes
    — the AI KB uses the latter."""
    return re.compile(rf'^###\s+{re.escape(prefix)}-(\d+):', re.MULTILINE)


def read_text(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        return None


def max_existing_id(text, prefix):
    """Highest <prefix>-<n> in text, or 0 if none."""
    if not text:
        return 0
    nums = [int(m.group(1)) for m in build_id_re(prefix).finditer(text)]
    return max(nums) if nums else 0


def renumber(claims_text, prefix, start_num):
    """Replace ### NEW-k: headers with sequential ### <prefix>-<n>: headers AND
    rewrite any inline NEW-k mentions (e.g. in Dependencies fields) to the
    corresponding assigned ID. Returns (new_text, assigned_ids).

    Headers are renumbered in document order; the original placeholder k is
    captured so inline references stay consistent with the header that defined them.
    """
    assigned = []
    k_to_real = {}  # placeholder k (int) -> assigned ID (e.g. 'BIO-004')
    counter = {'n': start_num}

    def repl(m):
        k = int(m.group(1))
        counter['n'] += 1
        new_id = f"{prefix}-{counter['n']:03d}"
        assigned.append(new_id)
        k_to_real[k] = new_id
        return f"### {new_id}:"

    new_text = PLACEHOLDER.sub(repl, claims_text)

    # Rewrite remaining inline NEW-k tokens (Dependencies fields etc.) using the
    # k -> real-ID map captured above. Word boundaries prevent collisions with
    # tokens like NEW-12 when only NEW-1 is in the map.
    for k, real in k_to_real.items():
        new_text = re.sub(rf'\bNEW-{k}\b', real, new_text)

    return new_text, assigned


def main():
    ap = argparse.ArgumentParser(description="Append vetted KB claims with allocated IDs.")
    ap.add_argument('target')
    ap.add_argument('claims')
    ap.add_argument('--prefix', default=None)
    ap.add_argument('--title', default=None)
    ap.add_argument('--dry-run', action='store_true', help="Print result, do not write.")
    args = ap.parse_args()

    claims_text = read_text(args.claims)
    if claims_text is None:
        print(f"ERROR: claims file not found: {args.claims}", file=sys.stderr)
        return 2
    claims_text = claims_text.strip()
    if not PLACEHOLDER.search(claims_text):
        print("ERROR: no '### NEW-<k>:' placeholder headers found in claims file. "
              "Nothing to ingest (all drafts rejected?).", file=sys.stderr)
        return 2

    target_text = read_text(args.target)
    creating = target_text is None

    if not args.prefix:
        print("ERROR: --prefix is required (e.g. 'BIO' for a human domain, "
              "'SOP-CE' or 'SKL-RA' for the AI KB).", file=sys.stderr)
        return 2
    prefix = args.prefix

    start = max_existing_id(target_text, prefix)
    new_claims, assigned = renumber(claims_text, prefix, start)

    if creating:
        title = args.title or prefix
        header = f"# Domain: {title}\n\n"
        body = header + new_claims + "\n"
    else:
        sep = "" if target_text.endswith("\n\n") else ("\n" if target_text.endswith("\n") else "\n\n")
        body = target_text + sep + new_claims + "\n"

    if args.dry_run:
        print(f"[dry-run] {'CREATE' if creating else 'APPEND'} {args.target}")
        print(f"[dry-run] prefix={prefix}  start={start}  assigned={assigned}")
        print("---")
        print(body)
        return 0

    # newline='' disables Python's default \n -> \r\n translation on Windows.
    # The KB domain files are LF-only by convention (the export-kb.js regex
    # doesn't handle CRLF); writing CRLF here silently breaks the parser.
    with open(args.target, 'w', encoding='utf-8', newline='') as f:
        f.write(body)

    print(f"{'Created' if creating else 'Appended to'} {args.target}")
    print(f"Allocated {len(assigned)} ID(s): {', '.join(assigned)}")
    return 0


if __name__ == '__main__':
    sys.exit(main())
