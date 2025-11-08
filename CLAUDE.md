# Image Classifier Sprint - Project Instructions

## PROJECT GOAL
Build a functional **image classification prototype** using CNN to classify images as **robots vs humans**.

---

## REQUIREMENTS CHECKLIST

### 1. Dataset
- [ ] Use public image dataset: **robots vs humans**
- [ ] Split data: train / validation / test sets

### 2. Model Architecture
- [ ] Use CNN architecture (Keras or PyTorch)
- [ ] Options: pretrained model (transfer learning) OR build from scratch
- [ ] Target: **>90% accuracy** (if resources allow)

### 3. Image Preprocessing
- [ ] Resize images to uniform dimensions
- [ ] Normalize pixel values (0-1 or standardization)
- [ ] Data augmentation (optional): rotation, flip, zoom

### 4. Training & Evaluation
- [ ] Train for 5-10 epochs minimum
- [ ] Track metrics: **accuracy** and **loss** (train + validation)
- [ ] Generate training progress plots (optional but recommended)
- [ ] Save trained model to file (`.h5` for Keras, `.pt` for PyTorch)

### 5. API/Interface Integration
- [ ] Build simple API using **Flask** OR CLI/GUI application
- [ ] Features:
  - Upload an image
  - Return: predicted class (robot/human) + confidence score

### 6. Database Persistence
- [ ] Use **SQLite** database
- [ ] Save each prediction with columns:
  - `filename` (image name)
  - `predicted_class` (robot or human)
  - `confidence` (probability score)
  - `timestamp` (when prediction was made)

### 7. Documentation & Demo
- [ ] Create **README.md** with:
  - How to run the project
  - Model architecture details
  - Results obtained
  - Challenges encountered
- [ ] Prepare **3+ test images** for final demo
- [ ] Show live classification demo

---

## TECH STACK
- **Language**: Python 3.x
- **ML Framework**: Keras (TensorFlow) or PyTorch
- **API**: Flask
- **Database**: SQLite
- **Dependencies**: requirements.txt

---

## PROJECT STRUCTURE (Target)
```
Image-Classifier-Sprint/
├── data/
│   ├── train/          # Training images
│   ├── val/            # Validation images
│   └── test/           # Test images
├── models/             # Saved model files (.h5 or .pt)
├── database/           # SQLite database
│   └── predictions.db
├── src/
│   ├── preprocess.py   # Image preprocessing
│   ├── model.py        # CNN model definition
│   ├── train.py        # Training script
│   └── predict.py      # Prediction logic
├── api/
│   └── app.py          # Flask API
├── notebooks/          # Jupyter notebooks (optional)
├── tests/              # Test images for demo
├── requirements.txt    # Python dependencies
├── README.md           # Project documentation
└── .gitignore          # Exclude data/, models/
```

---

## KEY COMMANDS

### Setup
```bash
pip install -r requirements.txt
```

### Train Model
```bash
python src/train.py
```

### Run API
```bash
python api/app.py
# Then visit: http://localhost:5000
```

### Make Prediction (CLI)
```bash
python src/predict.py --image tests/robot1.jpg
```

---

## SUCCESS CRITERIA
✅ Model achieves >90% accuracy
✅ API accepts image uploads and returns predictions
✅ All predictions saved to SQLite database
✅ 3+ demo images classify correctly
✅ Complete documentation in README

---

## IMPORTANT NOTES FOR DEVELOPMENT
- Always save the trained model after training
- Use relative paths, not hardcoded absolute paths
- Add `data/`, `models/`, `*.h5`, `*.pt` to `.gitignore`
- Include error handling in API endpoints
- Validate image formats before processing
