import re
import sys
from pathlib import Path

START = "<!-- QMD_CONTENT_START -->"
END   = "<!-- QMD_CONTENT_END -->"

def extract_main(html: str) -> str:
    m = re.search(r"<main[^>]*>(.*?)</main>", html, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        raise RuntimeError("Couldn't find <main>...</main> in rendered HTML.")
    return m.group(1).strip()

def inject(template: str, content: str) -> str:
    a = template.find(START)
    b = template.find(END)
    if a == -1 or b == -1 or b < a:
        raise RuntimeError("Couldn't find injection markers in the target HTML.")
    return template[:a+len(START)] + "\n\n" + content + "\n\n" + template[b:]

if __name__ == "__main__":
    rendered_html = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
    target_path   = Path(sys.argv[2])
    target_html   = target_path.read_text(encoding="utf-8", errors="ignore")

    merged = inject(target_html, extract_main(rendered_html))
    target_path.write_text(merged, encoding="utf-8")
    print(f"Injected into: {target_path}")
