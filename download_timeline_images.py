#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Download public domain images from Wikimedia Commons for the Physics Timeline.
This script fetches high-quality portrait images and saves them with standardized filenames.
"""

import urllib.request
import urllib.error
import os
import json
import sys
from pathlib import Path

# Fix encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Base directory for timeline images
IMAGE_DIR = r"C:\Users\Cole\Dropbox\Website\images\timeline_images"
os.makedirs(IMAGE_DIR, exist_ok=True)

# List of (Wikimedia Commons page, filename) tuples - high priority figures first
IMAGES_TO_DOWNLOAD = [
    # Renaissance & Enlightenment - Most Important
    ("Leonardo_da_Vinci", "leonardo-da-vinci-thumb.jpg"),
    ("Galileo_Galilei", "galileo-thumb.jpg"),
    ("Isaac_Newton", "newton-thumb.jpg"),
    ("Johannes_Kepler", "kepler-thumb.jpg"),

    # Ancient Greek - Core Figures
    ("Pythagoras", "pythagoras-thumb.jpg"),
    ("Plato", "plato-thumb.jpg"),
    ("Aristotle", "aristotle-thumb.jpg"),
    ("Euclid", "euclid-thumb.jpg"),
    ("Archimedes", "archimedes-thumb.jpg"),

    # Hellenistic
    ("Eratosthenes", "eratosthenes-thumb.jpg"),
    ("Aristarchus_of_Samos", "aristarchus-thumb.jpg"),
    ("Hipparchus", "hipparchus-thumb.jpg"),

    # Pre-Socratic
    ("Heraclitus", "heraclitus-thumb.jpg"),
    ("Democritus", "democritus-thumb.jpg"),
    ("Socrates", "socrates-thumb.jpg"),

    # 18th-19th Century - Physics Revolution
    ("Michael_Faraday", "faraday-thumb.jpg"),
    ("James_Clerk_Maxwell", "maxwell-thumb.jpg"),
    ("Ludwig_Boltzmann", "boltzmann-thumb.jpg"),
    ("Niels_Bohr", "bohr-thumb.jpg"),
    ("Max_Planck", "planck-thumb.jpg"),

    # 20th Century - Relativity & Quantum
    ("Albert_Einstein", "einstein-thumb.jpg"),
    ("Werner_Heisenberg", "heisenberg-thumb.jpg"),
    ("Erwin_Schrödinger", "schrodinger-thumb.jpg"),
    ("Paul_Dirac", "dirac-thumb.jpg"),
    ("Richard_Feynman", "feynman-thumb.jpg"),

    # Modern Physics
    ("Stephen_Hawking", "hawking-thumb.jpg"),
    ("Murray_Gell-Mann", "gell-mann-thumb.jpg"),
]

def get_wikimedia_image_url(person_name):
    """
    Use Wikimedia Commons API to find actual image files for a person.
    Returns the Wikimedia Commons page URL and a list of potential image URLs.
    """
    import json

    commons_url = f"https://commons.wikimedia.org/wiki/{person_name}"
    image_variants = []

    try:
        # Query Wikimedia Commons API for pages in the person's category
        api_url = (
            f"https://commons.wikimedia.org/w/api.php?"
            f"action=query&titles={person_name}&prop=images&format=json"
        )

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))

            # Extract image links from API response
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_data in pages.items():
                images = page_data.get('images', [])
                for img in images:
                    img_title = img.get('title', '')
                    if img_title.lower().endswith(('.jpg', '.jpeg', '.png')):
                        # Convert Wikipedia/Commons image title to URL
                        # Example: "File:Albert Einstein Head.jpg" -> URL
                        img_name = img_title.replace('File:', '').replace(' ', '_')
                        image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{img_name}"
                        image_variants.append(image_url)
    except Exception as e:
        print(f"  (API query failed: {str(e)[:50]})")
        pass

    # Fallback: Try direct image URLs if API fails
    if not image_variants:
        # Common patterns for person portrait files
        image_variants = [
            f"https://upload.wikimedia.org/wikipedia/commons/a/a4/{person_name}.jpg",
            f"https://upload.wikimedia.org/wikipedia/commons/b/b1/{person_name}.jpg",
        ]

    return commons_url, image_variants

def download_image(url, filepath, timeout=10):
    """Download an image from URL and save to filepath."""
    try:
        print(f"  Downloading from: {url}")
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            with open(filepath, 'wb') as f:
                f.write(response.read())
        return True
    except (urllib.error.URLError, urllib.error.HTTPError, Exception) as e:
        print(f"  ❌ Failed: {e}")
        return False

def main():
    print("=" * 70)
    print("Physics Timeline Images Downloader")
    print("=" * 70)
    print(f"\nTarget directory: {IMAGE_DIR}")
    print(f"Images already present: 3")
    print(f"Planning to download: {len(IMAGES_TO_DOWNLOAD)} high-priority images\n")

    successful = 0
    failed = 0
    skipped = 0

    for person_name, filename in IMAGES_TO_DOWNLOAD:
        filepath = os.path.join(IMAGE_DIR, filename)

        # Skip if already exists
        if os.path.exists(filepath):
            print(f"✓ {filename} (already exists)")
            skipped += 1
            continue

        print(f"\n📥 {person_name}")
        print(f"   Target: {filename}")

        commons_url, image_variants = get_wikimedia_image_url(person_name)
        print(f"   Source: {commons_url}")

        # Try different image URL patterns
        success = False
        for image_url in image_variants:
            if download_image(image_url, filepath):
                print(f"  ✅ Success!")
                successful += 1
                success = True
                break

        if not success:
            failed += 1
            print(f"  Note: Could not auto-download, please visit:")
            print(f"    {commons_url}")

    print("\n" + "=" * 70)
    print("Download Summary")
    print("=" * 70)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed} (manual download needed)")
    print(f"⏭️  Already present: {skipped}")
    print(f"📊 Total: {successful + failed + skipped}")
    print("\nFor failed downloads, visit the Wikimedia Commons links and")
    print("save images with the specified filenames to:")
    print(f"  {IMAGE_DIR}")

if __name__ == "__main__":
    main()
