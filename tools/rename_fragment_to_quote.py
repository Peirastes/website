#!/usr/bin/env python3
"""One-shot rename of the legacy "fragment" naming on the Quotes page
to plain "quote". Hits three files:
  - quotes.html        (~102 article elements + grid + stat counter)
  - css/cinematic.css  (.fragment* selectors)
  - js/cinematic.js    (querySelectors for filter + random-quote loader)

Order matters — the more specific substrings ("fragment__quote", etc.)
must be replaced BEFORE the bare "fragment" so we don't corrupt them.
Also the BEM child `fragment__quote` becomes `quote__text` to avoid
the ugly `quote__quote` collision.
"""
import sys
from pathlib import Path

REPLACEMENTS = [
    # Visible text first — case-sensitive so we don't touch CSS comments
    ('Fragment ', 'Quote '),   # "Fragment 01", "Fragment 02", ...
    ('>Fragments<', '>Quotes<'),  # the stat label

    # Compound class names (these have "fragment" as substring — handle first)
    ('fragments-grid', 'quotes-grid'),
    ('fragment__num',  'quote__num'),
    ('fragment__quote', 'quote__text'),  # rename body to __text to avoid `quote__quote`
    ('fragment__cite', 'quote__cite'),
    ('data-fragment-count', 'data-quote-count'),

    # Variable names in JS for consistency
    ('applyFragmentFilter', 'applyQuoteFilter'),
    ('[data-fragment-count]', '[data-quote-count]'),

    # Bare class name LAST so the compound ones are already gone
    ('class="fragment"', 'class="quote"'),
    ("class='fragment'", "class='quote'"),
    ('".fragment"',  '".quote"'),
    ("'.fragment'",  "'.quote'"),
    # CSS selectors — must come AFTER compound class names above
    ('.fragment {',           '.quote {'),
    ('.fragment.is-hidden',   '.quote.is-hidden'),
    ('.fragment:hover',       '.quote:hover'),

    # JS variable name (keep "fragments" plural to match "quotes" plural)
    ('const fragments =', 'const quoteEls ='),
    ('fragments.length',  'quoteEls.length'),
    ('fragments[Math',    'quoteEls[Math'),
    ('fragments.forEach', 'quoteEls.forEach'),

    # Comment cleanups
    ('Random quote (Lore Fragments)', 'Random quote'),
    ('the quotes fragment', 'the quote'),
]

FILES = [
    'quotes.html',
    'css/cinematic.css',
    'js/cinematic.js',
]

def main():
    root = Path(__file__).resolve().parent.parent  # Website/
    for rel in FILES:
        p = root / rel
        text = p.read_text(encoding='utf-8')
        before = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text == before:
            print(f'  [unchanged] {rel}')
        else:
            p.write_text(text, encoding='utf-8')
            n_changes = sum(1 for old, _ in REPLACEMENTS if old in before)
            print(f'  [rewrote]   {rel}  ({n_changes} substitution patterns matched)')

if __name__ == '__main__':
    main()
