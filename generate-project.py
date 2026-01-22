#!/usr/bin/env python3
"""
Generate a new project page and add it to projects.json

Usage:
    python generate-project.py

This will prompt you for project details and create:
    1. A new HTML file in projects/
    2. An entry in projects.json

Example:
    Title: My New Physics Project
    Year: 2025
    Category: Physics
    Description: A fascinating exploration of...
    Link filename: my-new-physics-project.html
    Image: images/project_images/my-image.png
    Tags: Physics, Math
"""

import json
import re
import os
from pathlib import Path
from datetime import datetime

def kebab_case(text):
    """Convert text to kebab-case"""
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text)
    text = re.sub(r'-+', '-', text)
    return text.strip('-')

def load_projects():
    """Load existing projects from projects.json"""
    project_file = Path('projects.json')
    if not project_file.exists():
        print("Error: projects.json not found. Make sure you're running this from the website root directory.")
        exit(1)

    with open(project_file, 'r') as f:
        return json.load(f)

def save_projects(projects):
    """Save projects to projects.json"""
    with open('projects.json', 'w') as f:
        json.dump(projects, f, indent=2)
    print("✓ projects.json updated")

def generate_html_file(title, filename):
    """Generate HTML file from template"""
    template_path = Path('projects/template.html')

    if not template_path.exists():
        print("Error: projects/template.html not found.")
        exit(1)

    with open(template_path, 'r') as f:
        content = f.read()

    # Replace placeholders
    content = content.replace('{{PROJECT_TITLE}}', title)

    # Write new HTML file
    output_path = Path('projects') / filename
    with open(output_path, 'w') as f:
        f.write(content)

    print(f"✓ Created projects/{filename}")
    return output_path

def get_next_project_id(projects):
    """Generate the next project ID"""
    # Extract all numeric IDs
    ids = []
    for project in projects:
        match = re.search(r'project(\d+)', project['id'])
        if match:
            ids.append(int(match.group(1)))

    if ids:
        return f"project{max(ids) + 1}"
    return "project1"

def main():
    print("\n" + "="*60)
    print("  Peirastes Project Generator")
    print("="*60 + "\n")

    # Get project details from user
    print("Enter project details:")
    title = input("Project title: ").strip()
    if not title:
        print("Error: Title is required.")
        exit(1)

    year = input(f"Year (default {datetime.now().year}): ").strip()
    if not year:
        year = datetime.now().year
    else:
        try:
            year = int(year)
        except ValueError:
            print("Error: Year must be a number.")
            exit(1)

    category = input("Category (e.g., Physics, Engineering, Math): ").strip()
    if not category:
        print("Error: Category is required.")
        exit(1)

    description = input("Description (optional, press Enter to skip): ").strip()

    tags_input = input("Tags (comma-separated, e.g., Physics,Math,Mechanics): ").strip()
    tags = [tag.strip() for tag in tags_input.split(',')] if tags_input else []

    image_path = input("Image path (optional, e.g., images/project_images/example.png): ").strip()

    image_alt = input("Image alt text (optional): ").strip()
    if not image_alt and image_path:
        image_alt = f"{title} Image"

    # Generate filename
    default_filename = kebab_case(title) + ".html"
    filename = input(f"Filename (default {default_filename}): ").strip()
    if not filename:
        filename = default_filename
    elif not filename.endswith('.html'):
        filename += '.html'

    # Check if file already exists
    if Path(f'projects/{filename}').exists():
        print(f"Warning: projects/{filename} already exists. Overwrite? (y/n): ", end='')
        if input().lower() != 'y':
            print("Aborted.")
            exit(0)

    # Load existing projects
    projects = load_projects()

    # Generate new project ID
    project_id = get_next_project_id(projects)

    # Create HTML file
    generate_html_file(title, filename)

    # Create project entry
    new_project = {
        "id": project_id,
        "title": title,
        "year": year,
        "category": category,
        "description": description,
        "link": f"projects/{filename}",
        "image": image_path if image_path else "images/project_images/default.png",
        "imageAlt": image_alt if image_alt else f"{title} Thumbnail",
        "tags": tags
    }

    # Add to projects list (at the beginning, so newest projects appear first)
    projects.insert(0, new_project)

    # Save updated projects.json
    save_projects(projects)

    print("\n" + "="*60)
    print("✓ Project created successfully!")
    print("="*60)
    print(f"\nProject Details:")
    print(f"  ID: {project_id}")
    print(f"  Title: {title}")
    print(f"  Year: {year}")
    print(f"  Category: {category}")
    print(f"  File: projects/{filename}")
    print(f"  Tags: {', '.join(tags) if tags else 'None'}")
    print(f"\nNext steps:")
    print(f"  1. Edit projects/{filename} to add your project content")
    print(f"  2. If using an image, place it at: {image_path if image_path else 'images/project_images/<your-image.png>'}")
    print(f"  3. Update the archive sidebar in index.html if desired")
    print("\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nAborted.")
        exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        exit(1)
