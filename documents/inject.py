import re
import sys
from pathlib import Path

START = "<!-- QMD_CONTENT_START -->"
END   = "<!-- QMD_CONTENT_END -->"

def extract_content(html: str) -> str:
    # Extract the TOC sidebar if present
    toc_match = re.search(
        r'(<div\s+id="quarto-margin-sidebar"[^>]*>.*?</nav>\s*</div>)',
        html, flags=re.DOTALL
    )

    # Extract <main>...</main>
    main_match = re.search(
        r"<main[^>]*>(.*?)</main>",
        html, flags=re.DOTALL | re.IGNORECASE
    )
    if not main_match:
        raise RuntimeError("Couldn't find <main>...</main> in rendered HTML.")

    main_content = main_match.group(1).strip()

    # Rename <header id="title-block-header"> to <div> so it doesn't
    # get styled by the site's header CSS rules
    main_content = re.sub(
        r'<header\s+id="title-block-header"',
        '<div id="title-block-header"',
        main_content
    )
    # Replace only the corresponding </header> (first one after title-block)
    main_content = main_content.replace('</header>', '</div>', 1)

    # Include TOC alongside main content with simple layout (no Quarto grid)
    if toc_match:
        toc_html = toc_match.group(1).strip()
        return (
            '<div id="quarto-toc-sidebar">\n'
            + toc_html + '\n'
            + '</div>\n'
            + '<div id="quarto-document-content">\n'
            + main_content + '\n'
            + '</div>'
        )
    else:
        return main_content

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

    merged = inject(target_html, extract_content(rendered_html))
    target_path.write_text(merged, encoding="utf-8")
    print(f"Injected into: {target_path}")
