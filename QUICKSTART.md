# Quick Start Guide

Get up and running with the Robot vs Human Image Classifier in minutes!

## Installation (5 minutes)

```bash
# 1. Navigate to project directory
cd Image-Classifier-Sprint

# 2. Run setup script (recommended)
python setup.py

# OR install manually:
pip install -r requirements.txt
```

## Usage

### Option A: Use Pre-trained Model (if available)

If you have a pre-trained model, skip to step 3.

### Option B: Train Your Own Model

#### 1. Get Training Data

You need images of robots and humans. Sources:
- Download from Kaggle
- Use Google Images (for educational use)
- Use your own images

Organize them like this:
```
data/
├── train/
│   ├── human/    ← 100+ images of humans
│   └── robot/    ← 100+ images of robots
└── val/
    ├── human/    ← 20+ images of humans
    └── robot/    ← 20+ images of robots
```

#### 2. Train Model (10-15 minutes)

```bash
python src/train.py --model_type transfer --epochs 10
```

This will:
- Train a model using transfer learning
- Save it to `models/` directory
- Generate accuracy/loss plots

#### 3. Test Prediction

```bash
# Find your model file
ls models/

# Make a prediction
python src/predict.py \
    --image path/to/test/image.jpg \
    --model models/robot_human_classifier_transfer_XXXXXXXX_XXXXXX.h5
```

#### 4. Launch Web App

```bash
python api/app.py
```

Then open: **http://localhost:5000**

## Web Interface Features

- 📤 **Drag & drop** images
- 🎯 **Instant predictions** with confidence scores
- 📊 **Real-time statistics**
- 📜 **Prediction history**

## API Usage

```bash
# Make prediction
curl -X POST -F "file=@image.jpg" http://localhost:5000/predict

# Get history
curl http://localhost:5000/history

# Get statistics
curl http://localhost:5000/statistics
```

## Tips for Best Results

1. **Balanced Dataset**: Use similar numbers of human and robot images
2. **Quality Over Quantity**: Clear, well-lit images work best
3. **Diversity**: Include various angles, backgrounds, and lighting
4. **More Data**: 500+ images per class → excellent results
5. **Data Augmentation**: Enabled by default to improve robustness

## Troubleshooting

**Problem**: `No module named 'tensorflow'`
```bash
pip install tensorflow==2.15.0
```

**Problem**: `Model file not found`
- Train a model first: `python src/train.py`

**Problem**: `Data directory not found`
- Create directories: `python setup.py`
- Add images to `data/train/human/` and `data/train/robot/`

**Problem**: Out of memory during training
```bash
python src/train.py --batch_size 16 --image_size 128
```

## Need Help?

See full documentation in [README.md](README.md)

## Project Structure

```
Image-Classifier-Sprint/
├── src/              # Core modules
├── api/              # Web interface
├── data/             # Training data (add your images here)
├── models/           # Trained models (auto-generated)
├── tests/            # Test images
└── requirements.txt
```

Happy classifying! 🤖
