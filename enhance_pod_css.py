import sys

html_file = sys.argv[1]

# Read the HTML file
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Comprehensive CSS for print media
css = '''
<style>
@page {
  size: A4;
  margin: 0.75in;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    line-height: 1.6;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 11pt;
    color: #333;
  }
  
  h1 {
    page-break-after: avoid;
    margin-top: 24pt;
    margin-bottom: 12pt;
    font-size: 24pt;
    font-weight: bold;
    color: #1a1a1a;
    border-bottom: 3px solid #FF5500;
    padding-bottom: 8pt;
  }
  
  h2 {
    page-break-after: avoid;
    margin-top: 18pt;
    margin-bottom: 10pt;
    font-size: 18pt;
    font-weight: bold;
    color: #333;
    border-left: 4px solid #FF5500;
    padding-left: 10pt;
  }
  
  h3 {
    page-break-after: avoid;
    margin-top: 14pt;
    margin-bottom: 8pt;
    font-size: 14pt;
    font-weight: bold;
    color: #555;
  }
  
  h4 {
    page-break-after: avoid;
    margin-top: 12pt;
    margin-bottom: 6pt;
    font-size: 12pt;
    font-weight: bold;
    color: #666;
  }
  
  p {
    margin-bottom: 10pt;
    text-align: justify;
  }
  
  blockquote {
    margin-left: 30pt;
    margin-right: 30pt;
    padding-left: 12pt;
    border-left: 3px solid #FF5500;
    font-style: italic;
    color: #555;
    page-break-inside: avoid;
  }
  
  ul, ol {
    margin-left: 30pt;
    margin-bottom: 10pt;
  }
  
  li {
    margin-bottom: 6pt;
    page-break-inside: avoid;
  }
  
  table {
    width: 100%;
    margin-bottom: 12pt;
    border-collapse: collapse;
    page-break-inside: auto;
    font-size: 10pt;
  }
  
  tr {
    page-break-inside: avoid;
  }
  
  th {
    background-color: #FF5500;
    color: white;
    padding: 8pt;
    text-align: left;
    font-weight: bold;
    border: 1px solid #ddd;
  }
  
  td {
    padding: 8pt;
    border: 1px solid #ddd;
    vertical-align: top;
  }
  
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  code {
    background-color: #f4f4f4;
    padding: 2pt 4pt;
    border-radius: 3pt;
    font-family: 'Courier New', monospace;
    font-size: 10pt;
    color: #d63384;
  }
  
  pre {
    background-color: #f4f4f4;
    padding: 12pt;
    border-radius: 4pt;
    border-left: 3px solid #FF5500;
    overflow-x: auto;
    margin-bottom: 12pt;
    page-break-inside: avoid;
  }
  
  pre code {
    background-color: transparent;
    padding: 0;
    color: #333;
  }
  
  a {
    color: #FF5500;
    text-decoration: none;
  }
  
  a:visited {
    color: #d84315;
  }
  
  hr {
    border: none;
    border-top: 2px solid #FF5500;
    margin: 20pt 0;
    page-break-after: avoid;
  }
  
  .page-break {
    page-break-after: always;
  }
  
  sup, sub {
    font-size: 0.8em;
    line-height: 0;
  }
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}
</style>
'''

# Find where to insert CSS
head_end = html_content.find('</head>')
if head_end == -1:
  # If no head tag, create one at the beginning
  html_content = '<html><head>' + css + '</head><body>' + html_content + '</body></html>'
else:
  # Insert CSS before </head>
  html_content = html_content[:head_end] + css + html_content[head_end:]

# Write back
with open(html_file, 'w', encoding='utf-8') as f:
  f.write(html_content)

print(f"CSS enhanced: {html_file}")
