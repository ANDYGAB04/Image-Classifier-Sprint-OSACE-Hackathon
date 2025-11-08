"""
Download sample images for training the Robot vs Human classifier.
This script downloads publicly available images to get you started quickly.
"""

import os
import urllib.request
import shutil
from pathlib import Path

# Sample image URLs (public domain / creative commons)
HUMAN_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
    "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400",
]

ROBOT_IMAGES = [
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
    "https://images.unsplash.com/photo-1518314916381-77a37c2a49ae?w=400",
    "https://images.unsplash.com/photo-1563207153-f403bf289096?w=400",
    "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=400",
    "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400",
    "https://images.unsplash.com/photo-1563968743333-044cef800494?w=400",
    "https://images.unsplash.com/photo-1546776230-bb86256870c8?w=400",
    "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=400",
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
]


def download_image(url, filepath):
    """Download an image from URL to filepath."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)

        with urllib.request.urlopen(req, timeout=10) as response:
            with open(filepath, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
        return True
    except Exception as e:
        print(f"  ⚠ Failed to download {url}: {str(e)}")
        return False


def download_dataset():
    """Download sample dataset for training."""
    print("="*60)
    print("DOWNLOADING SAMPLE DATASET")
    print("="*60)
    print("\nThis will download sample robot and human images from Unsplash")
    print("(Free to use under Unsplash License)\n")

    # Create directories
    dirs = {
        'train_human': 'data/train/human',
        'train_robot': 'data/train/robot',
        'val_human': 'data/val/human',
        'val_robot': 'data/val/robot',
    }

    for dir_path in dirs.values():
        Path(dir_path).mkdir(parents=True, exist_ok=True)

    # Download training images (80%)
    print("\n[1/2] Downloading training images...")

    # Humans
    print("\n  Downloading human images...")
    train_human_count = int(len(HUMAN_IMAGES) * 0.8)
    for i, url in enumerate(HUMAN_IMAGES[:train_human_count]):
        filepath = f"{dirs['train_human']}/human_{i+1:03d}.jpg"
        print(f"    {i+1}/{train_human_count}: {filepath}")
        download_image(url, filepath)

    # Robots
    print("\n  Downloading robot images...")
    train_robot_count = int(len(ROBOT_IMAGES) * 0.8)
    for i, url in enumerate(ROBOT_IMAGES[:train_robot_count]):
        filepath = f"{dirs['train_robot']}/robot_{i+1:03d}.jpg"
        print(f"    {i+1}/{train_robot_count}: {filepath}")
        download_image(url, filepath)

    # Download validation images (20%)
    print("\n[2/2] Downloading validation images...")

    # Humans
    print("\n  Downloading human images...")
    for i, url in enumerate(HUMAN_IMAGES[train_human_count:]):
        filepath = f"{dirs['val_human']}/human_{i+1:03d}.jpg"
        print(f"    {i+1}/{len(HUMAN_IMAGES)-train_human_count}: {filepath}")
        download_image(url, filepath)

    # Robots
    print("\n  Downloading robot images...")
    for i, url in enumerate(ROBOT_IMAGES[train_robot_count:]):
        filepath = f"{dirs['val_robot']}/robot_{i+1:03d}.jpg"
        print(f"    {i+1}/{len(ROBOT_IMAGES)-train_robot_count}: {filepath}")
        download_image(url, filepath)

    print("\n" + "="*60)
    print("DOWNLOAD COMPLETE!")
    print("="*60)

    # Count files
    train_files = len(list(Path('data/train/human').glob('*.jpg'))) + \
                  len(list(Path('data/train/robot').glob('*.jpg')))
    val_files = len(list(Path('data/val/human').glob('*.jpg'))) + \
                len(list(Path('data/val/robot').glob('*.jpg')))

    print(f"\nTraining images: {train_files}")
    print(f"Validation images: {val_files}")
    print(f"\nYou can now train the model:")
    print("  python src/train.py --model_type transfer --epochs 10")


if __name__ == '__main__':
    download_dataset()
