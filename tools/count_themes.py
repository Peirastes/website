import re
from collections import defaultdict

with open('quotes.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract all quote cards
pattern = r'<blockquote>"([^"]+)"</blockquote>\s*<cite>— ([^<]+)'
matches = re.findall(pattern, content)

print(f"Total quotes found: {len(matches)}\n")

# Define themes to search for
themes = {
    'education': [
        'teach', 'learning', 'educate', 'study', 'student', 'school',
        'instruct', 'youth', 'corrupt'
    ],
    'wisdom': [
        'wisdom', 'wise', 'understand', 'understanding'
    ],
    'discipline': [
        'discipline', 'control', 'master', 'self-mastery', 'restraint',
        'calm', 'moderation', 'regulate'
    ],
    'integrity': [
        'integrity', 'principle', 'character', 'virtue', 'honest',
        'faithful', 'true', 'sincere'
    ]
}

theme_counts = defaultdict(list)

for quote, author in matches:
    quote_lower = quote.lower()
    
    for theme, keywords in themes.items():
        if any(keyword in quote_lower for keyword in keywords):
            theme_counts[theme].append((quote[:70] + '...', author))

print("Theme counts:\n")
for theme in sorted(theme_counts.keys()):
    count = len(theme_counts[theme])
    print(f"{theme.upper()}: {count} quotes")
    if count >= 5:
        print(f"  ✓ MEETS 5+ THRESHOLD")
    for quote, author in theme_counts[theme]:
        print(f"    - {quote}")
    print()

