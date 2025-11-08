"""
Setup script for the Robot vs Human Image Classifier.
Helps with initial project setup and environment verification.
"""

import os
import sys
import subprocess


def print_header(text):
    """Print a formatted header."""
    print("\n" + "="*60)
    print(text.center(60))
    print("="*60 + "\n")


def print_step(step_num, text):
    """Print a formatted step."""
    print(f"[{step_num}] {text}")


def check_python_version():
    """Check if Python version meets requirements."""
    print_step("1/6", "Checking Python version...")

    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ required. Current: {version.major}.{version.minor}")
        return False

    print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
    return True


def check_pip():
    """Check if pip is available."""
    print_step("2/6", "Checking pip...")

    try:
        subprocess.run([sys.executable, "-m", "pip", "--version"],
                      check=True, capture_output=True)
        print("✓ pip is installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ pip not found")
        return False


def install_dependencies():
    """Install project dependencies."""
    print_step("3/6", "Installing dependencies...")

    if not os.path.exists("requirements.txt"):
        print("❌ requirements.txt not found")
        return False

    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            check=True
        )
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        return False


def create_directories():
    """Create necessary project directories."""
    print_step("4/6", "Creating project directories...")

    directories = [
        "data/train/human",
        "data/train/robot",
        "data/val/human",
        "data/val/robot",
        "data/test",
        "models",
        "database",
        "uploads",
        "tests",
        "notebooks"
    ]

    for directory in directories:
        os.makedirs(directory, exist_ok=True)

    print("✓ Project directories created")
    return True


def create_placeholder_files():
    """Create placeholder files to help users."""
    print_step("5/6", "Creating helper files...")

    # Create a sample data organization guide
    guide_path = "data/DATA_ORGANIZATION_GUIDE.txt"
    with open(guide_path, "w") as f:
        f.write("""
DATA ORGANIZATION GUIDE
======================

To train the model, organize your images as follows:

data/
├── train/
│   ├── human/        <- Place training images of humans here
│   └── robot/        <- Place training images of robots here
├── val/
│   ├── human/        <- Place validation images of humans here
│   └── robot/        <- Place validation images of robots here
└── test/             <- Place test images here (for final evaluation)

Tips:
-----
1. Aim for at least 100+ images per class for decent results
2. More data = better accuracy
3. Ensure balanced classes (similar number of human and robot images)
4. Use diverse images (different angles, lighting, backgrounds)
5. Recommended split: 70% train, 20% validation, 10% test

Where to find datasets:
-----------------------
- Kaggle: https://www.kaggle.com/datasets
- Google Images: Use for educational purposes
- ImageNet: http://www.image-net.org/
- Custom collection: Take/gather your own images

After organizing your data, run:
    python src/train.py --model_type transfer --epochs 10
""")

    print(f"✓ Created {guide_path}")
    return True


def verify_installation():
    """Verify that critical packages are importable."""
    print_step("6/6", "Verifying installation...")

    packages = [
        "tensorflow",
        "keras",
        "numpy",
        "PIL",
        "flask",
        "matplotlib",
        "sklearn"
    ]

    failed = []
    for package in packages:
        try:
            __import__(package)
            print(f"  ✓ {package}")
        except ImportError:
            print(f"  ❌ {package}")
            failed.append(package)

    if failed:
        print(f"\n❌ Failed to import: {', '.join(failed)}")
        return False

    print("\n✓ All packages verified")
    return True


def print_next_steps():
    """Print instructions for next steps."""
    print_header("SETUP COMPLETE!")

    print("Next steps:\n")

    print("1. Prepare your dataset:")
    print("   - Read: data/DATA_ORGANIZATION_GUIDE.txt")
    print("   - Organize images into data/train/ and data/val/")
    print()

    print("2. Train the model:")
    print("   python src/train.py --model_type transfer --epochs 10")
    print()

    print("3. Test predictions:")
    print("   python src/predict.py --image tests/your_image.jpg --model models/your_model.h5")
    print()

    print("4. Run the web application:")
    print("   python api/app.py")
    print("   Then visit: http://localhost:5000")
    print()

    print("For more information, see README.md")
    print("="*60 + "\n")


def main():
    """Main setup function."""
    print_header("ROBOT VS HUMAN CLASSIFIER - SETUP")

    steps = [
        check_python_version,
        check_pip,
        install_dependencies,
        create_directories,
        create_placeholder_files,
        verify_installation
    ]

    for step in steps:
        if not step():
            print("\n❌ Setup failed. Please fix the errors above and try again.")
            return False

    print_next_steps()
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
