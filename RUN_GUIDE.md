# Complete Application Setup & Run Guide

## Robot vs Human AI Classifier

This guide provides comprehensive instructions for setting up and running the complete application stack, including backend API, frontend interface, and all dependencies.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Running the Application](#running-the-application)
5. [Using the Application](#using-the-application)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## 🔧 Prerequisites

### Required Software

- **Python 3.8 or higher**

  - Download from: https://www.python.org/downloads/
  - Verify installation: `python --version`

- **Node.js 18+ and npm**

  - Download from: https://nodejs.org/
  - Verify installation: `node --version` and `npm --version`

- **Git** (optional, for cloning)
  - Download from: https://git-scm.com/

### System Requirements

- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 2GB free space
- **GPU:** Optional (CUDA-compatible GPU for faster training)
- **Internet:** Required for initial setup and dependencies

---

## ⚡ Quick Start

If you just want to get the app running quickly:

```powershell
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Train a model (or use pre-trained if available)
python src/train.py --model_type transfer --epochs 10

# 3. Start the backend API (in Terminal 1)
python api/app.py

# 4. Install frontend dependencies (in Terminal 2)
cd frontend
npm install

# 5. Start the frontend (in Terminal 2)
npm run dev

# 6. Open browser to http://localhost:3000
```

---

## 📦 Detailed Setup

### Step 1: Clone or Download the Repository

```powershell
# If using Git
git clone https://github.com/ANDYGAB04/Image-Classifier-Sprint.git
cd Image-Classifier-Sprint

# Or download ZIP and extract
```

### Step 2: Python Environment Setup

#### Option A: Using Virtual Environment (Recommended)

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

#### Option B: Global Installation

```powershell
# Install dependencies globally
pip install -r requirements.txt
```

### Step 3: Verify Python Installation

```powershell
# Check if TensorFlow is installed correctly
python -c "import tensorflow as tf; print(f'TensorFlow version: {tf.__version__}')"

# Check if all required packages are available
python -c "import flask, PIL, numpy, sklearn; print('All packages OK')"
```

### Step 4: Prepare Training Data

The application requires training data organized in a specific structure:

```
data/
├── train/
│   ├── human/     # Place human images here (100+ recommended)
│   └── robot/     # Place robot images here (100+ recommended)
├── val/
│   ├── human/     # Validation human images (20+ recommended)
│   └── robot/     # Validation robot images (20+ recommended)
└── test/          # Optional test images
```

#### Getting Sample Data

**Option 1: Use provided download script**

```powershell
python download_sample_data.py
```

**Option 2: Manual collection**

- Download images from:
  - Kaggle datasets
  - Google Images (for educational use)
  - Pexels/Unsplash (free stock photos)
  - Your own photos

**Option 3: Use existing data**

- The project already includes some data in `data/train`, `data/val`, and `data/test` directories

### Step 5: Train the Model

#### Quick Training (Transfer Learning - Recommended)

```powershell
python src/train.py --model_type transfer --epochs 10
```

This will:

- Use MobileNetV2 with transfer learning
- Train for 10 epochs (~15 minutes on CPU)
- Save model to `models/` directory
- Generate training plots

#### Full Training (Custom CNN)

```powershell
python src/train.py --model_type custom --epochs 20 --batch_size 32
```

#### Training Options

```powershell
python src/train.py `
    --train_dir data/train `
    --val_dir data/val `
    --model_type transfer `
    --epochs 10 `
    --batch_size 32 `
    --image_size 224 `
    --learning_rate 0.001
```

**Parameters:**

- `--train_dir`: Path to training data directory
- `--val_dir`: Path to validation data directory
- `--model_type`: `transfer` or `custom`
- `--epochs`: Number of training epochs
- `--batch_size`: Batch size for training
- `--image_size`: Input image size (224 recommended)
- `--learning_rate`: Learning rate for optimizer
- `--no_augment`: Disable data augmentation

#### Expected Output

```
Epoch 1/10
32/32 [==============================] - 45s 1s/step - loss: 0.4532 - accuracy: 0.8125 - val_loss: 0.2156 - val_accuracy: 0.9200
Epoch 2/10
32/32 [==============================] - 42s 1s/step - loss: 0.2345 - accuracy: 0.9063 - val_loss: 0.1523 - val_accuracy: 0.9400
...
Training completed!
Model saved: models/robot_human_classifier_transfer_20251108_143022.h5
```

### Step 6: Frontend Setup

```powershell
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# This will install:
# - Next.js 15
# - React 19
# - TypeScript
# - Tailwind CSS
# - shadcn/ui components
# - Axios for API calls
# - Recharts for analytics
# - Framer Motion for animations
```

#### Verify Frontend Setup

```powershell
# Check if installation was successful
npm list --depth=0

# Should show all packages from package.json
```

---

## 🚀 Running the Application

The application consists of two parts that must run simultaneously:

### Terminal 1: Backend API Server

```powershell
# Navigate to project root
cd Image-Classifier-Sprint

# Activate virtual environment (if using one)
.\venv\Scripts\activate

# Start Flask API server
python api/app.py
```

**Expected Output:**

```
============================================================
ROBOT VS HUMAN CLASSIFIER - API SERVER
============================================================
Loading model: models/robot_human_classifier_transfer_20251108_143022.h5
Application initialized successfully!

============================================================
Server is ready!
============================================================

Access the web interface at: http://localhost:5000
API endpoints:
  POST /predict       - Upload image for prediction
  GET  /history       - View prediction history
  GET  /statistics    - View statistics
  GET  /health        - Health check

Press CTRL+C to stop the server
============================================================

 * Running on http://0.0.0.0:5000
```

### Terminal 2: Frontend Development Server

```powershell
# Navigate to frontend directory
cd frontend

# Start Next.js development server
npm run dev
```

**Expected Output:**

```
  ▲ Next.js 15.1.3
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.100:3000

 ✓ Ready in 2.5s
```

### Optional: HTTPS Development (for Camera Access)

If you need HTTPS for camera testing:

```powershell
cd frontend
npm run dev:https
```

Then access: `https://localhost:3000`

### Accessing the Application

1. **Open your web browser**
2. **Navigate to:** `http://localhost:3000`
3. **You should see:** The Robot vs Human Classifier interface

---

## 🎯 Using the Application

### Main Interface Features

#### 1. Image Upload

**Method A: Drag & Drop**

- Drag an image file from your computer
- Drop it into the upload area
- Preview appears automatically

**Method B: Click to Upload**

- Click on the upload area
- Select an image from file dialog
- Supported formats: JPG, PNG, GIF, BMP

**Method C: Camera Capture**

- Click "Use Camera" button
- Grant camera permissions
- Position subject in frame
- Click "Capture Photo"
- Image is automatically classified

#### 2. Classification

1. Upload or capture an image
2. Click "Classify Image" button
3. Wait for prediction (usually <1 second)
4. View results:
   - **Predicted Class:** ROBOT or HUMAN
   - **Confidence Score:** Percentage (0-100%)
   - **Visual Feedback:** Color-coded badge

#### 3. Results Interpretation

**Confidence Levels:**

- **90-100%** (Green): Very High - Excellent prediction
- **75-89%** (Cyan): High - Good prediction
- **60-74%** (Yellow): Moderate - Acceptable prediction
- **0-59%** (Red): Low - Uncertain, may need better image

**Low Confidence Tips:**

- Use clearer, well-lit images
- Ensure subject is centered
- Avoid blurry or distorted images
- Try different angles

#### 4. Statistics Dashboard

View real-time statistics:

- **Total Predictions:** Count of all classifications
- **Average Confidence:** Mean confidence score
- **Robots Count:** Number of robot predictions
- **Humans Count:** Number of human predictions

#### 5. Prediction History

- View up to 50 recent predictions
- Filter by confidence range (0-100%)
- See timestamp for each prediction
- Delete individual predictions
- Clear all history

**History Features:**

- Image thumbnails
- Prediction class badge
- Confidence bar chart
- Delete button per item
- Timestamp display

#### 6. Analytics Page

Access advanced analytics at `/analytics`:

**Available Metrics:**

- **Confidence Distribution Chart**

  - Very High (90-100%)
  - High (75-89%)
  - Moderate (60-74%)
  - Low (0-59%)

- **Class Distribution**

  - Human vs Robot pie chart
  - Percentage breakdown

- **Confusion Matrix**

  - True Positives/Negatives
  - False Positives/Negatives
  - Accuracy, Precision, Recall, F1 Score

- **Model Evaluation**
  - Run on test dataset
  - Detailed performance metrics

---

## 🔌 API Reference

### Base URL

```
http://localhost:5000
```

### Endpoints

#### 1. Predict Image

**Endpoint:** `POST /predict`

**Description:** Upload an image for classification

**Request:**

```bash
curl -X POST http://localhost:5000/predict \
  -F "file=@path/to/image.jpg"
```

**Response:**

```json
{
  "success": true,
  "filename": "20251108_143022_image.jpg",
  "predicted_class": "robot",
  "confidence": 0.9543,
  "confidence_percent": "95.43%"
}
```

#### 2. Get Prediction History

**Endpoint:** `GET /history`

**Description:** Retrieve prediction history with optional filters

**Query Parameters:**

- `limit` (int): Maximum records to return (default: 50)
- `min_confidence` (float): Minimum confidence threshold (0.0-1.0)
- `max_confidence` (float): Maximum confidence threshold (0.0-1.0)

**Request:**

```bash
curl "http://localhost:5000/history?limit=10&min_confidence=0.8"
```

**Response:**

```json
{
  "success": true,
  "count": 10,
  "filters": {
    "min_confidence": 0.8,
    "max_confidence": 1.0
  },
  "predictions": [
    {
      "id": 1,
      "filename": "robot1.jpg",
      "predicted_class": "robot",
      "confidence": 0.9543,
      "timestamp": "2025-11-08 14:30:22"
    }
  ]
}
```

#### 3. Get Statistics

**Endpoint:** `GET /statistics`

**Description:** Get overall statistics

**Request:**

```bash
curl http://localhost:5000/statistics
```

**Response:**

```json
{
  "success": true,
  "statistics": {
    "total_predictions": 150,
    "average_confidence": 0.8924,
    "predictions_by_class": {
      "robot": 75,
      "human": 75
    }
  }
}
```

#### 4. Delete Prediction

**Endpoint:** `DELETE /prediction/:id`

**Description:** Delete a specific prediction by ID

**Request:**

```bash
curl -X DELETE http://localhost:5000/prediction/1
```

**Response:**

```json
{
  "success": true,
  "message": "Prediction 1 deleted successfully"
}
```

#### 5. Clear All Predictions

**Endpoint:** `DELETE /predictions`

**Description:** Delete all predictions from database

**Request:**

```bash
curl -X DELETE http://localhost:5000/predictions
```

**Response:**

```json
{
  "success": true,
  "message": "Deleted 150 predictions",
  "count": 150
}
```

#### 6. Confidence Distribution

**Endpoint:** `GET /analytics/confidence-distribution`

**Description:** Get confidence distribution for charts

**Request:**

```bash
curl http://localhost:5000/analytics/confidence-distribution
```

#### 7. Class Distribution

**Endpoint:** `GET /analytics/class-distribution`

**Description:** Get human vs robot distribution

**Request:**

```bash
curl http://localhost:5000/analytics/class-distribution
```

#### 8. Model Evaluation

**Endpoint:** `POST /analytics/evaluate`

**Description:** Evaluate model on test dataset

**Request:**

```bash
curl -X POST http://localhost:5000/analytics/evaluate \
  -H "Content-Type: application/json" \
  -d '{"test_dir": "data/test"}'
```

#### 9. Health Check

**Endpoint:** `GET /health`

**Description:** Check API server health

**Request:**

```bash
curl http://localhost:5000/health
```

**Response:**

```json
{
  "status": "healthy",
  "predictor_loaded": true,
  "database_connected": true
}
```

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "No module named 'tensorflow'"

**Solution:**

```powershell
pip install tensorflow==2.15.0
```

If still fails, try:

```powershell
pip uninstall tensorflow
pip install tensorflow-cpu==2.15.0
```

#### Issue 2: "Model file not found"

**Problem:** No trained model exists

**Solution:**

```powershell
# Train a model first
python src/train.py --model_type transfer --epochs 10
```

#### Issue 3: "Data directory not found"

**Problem:** Training/validation data not organized correctly

**Solution:**

```powershell
# Create directories
mkdir data\train\human
mkdir data\train\robot
mkdir data\val\human
mkdir data\val\robot

# Add images to each directory
# Minimum 20 images per directory recommended
```

#### Issue 4: Port 5000 already in use

**Solution:**

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in api/app.py
# app.run(host="0.0.0.0", port=5001, debug=True)
```

#### Issue 5: Frontend won't start

**Solution:**

```powershell
# Delete node_modules and reinstall
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```

#### Issue 6: Camera not working

**Problem:** Browser security restrictions

**Solutions:**

1. **Use localhost:** Always access via `http://localhost:3000`
2. **Enable HTTPS:**
   ```powershell
   cd frontend
   npm run dev:https
   ```
3. **Check browser permissions:** Allow camera access in browser settings
4. **Try different browser:** Chrome, Firefox, or Edge

#### Issue 7: Out of memory during training

**Solution:**

```powershell
# Reduce batch size and image size
python src/train.py `
    --model_type transfer `
    --batch_size 16 `
    --image_size 128 `
    --epochs 10
```

#### Issue 8: Slow predictions

**Solution:**

- Ensure using transfer learning model (smaller and faster)
- Check if GPU is being used: `python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"`
- Reduce image size before upload
- Close unnecessary applications

#### Issue 9: CORS errors in browser console

**Problem:** API and frontend on different origins

**Solution:**
The API already has CORS enabled. Ensure:

1. API is running on port 5000
2. Frontend is running on port 3000
3. Accessing frontend via `http://localhost:3000` (not IP address)

#### Issue 10: Database errors

**Solution:**

```powershell
# Delete and recreate database
Remove-Item database\predictions.db -Force
python api/app.py
```

---

## ⚙️ Advanced Usage

### Custom Model Training

#### Fine-tuning with More Data

```powershell
# Train with more epochs and fine-tuning
python src/train.py `
    --model_type transfer `
    --epochs 20 `
    --batch_size 32 `
    --learning_rate 0.0001
```

#### Training Without Data Augmentation

```powershell
python src/train.py `
    --model_type transfer `
    --epochs 15 `
    --no_augment
```

### Batch Predictions

```powershell
# Predict all images in a directory
python src/predict.py `
    --image tests/ `
    --model models/your_model.h5
```

### Model Evaluation

```powershell
# Evaluate model on test set
python -c "
from src.predict import RobotHumanPredictor
predictor = RobotHumanPredictor('models/your_model.h5')
results = predictor.evaluate_on_test_set('data/test')
print(results)
"
```

### Database Management

```powershell
# View database statistics
python -c "
from src.database import PredictionDatabase
db = PredictionDatabase()
stats = db.get_statistics()
print(stats)
"
```

### Custom API Port

Edit `api/app.py`:

```python
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)  # Change port here
```

### Production Deployment

#### Using Gunicorn (Linux/Mac)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.app:app
```

#### Using Waitress (Windows)

```powershell
pip install waitress
waitress-serve --port=5000 api.app:app
```

#### Frontend Production Build

```powershell
cd frontend
npm run build
npm run start
```

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "api/app.py"]
```

Build and run:

```powershell
docker build -t robot-human-classifier .
docker run -p 5000:5000 robot-human-classifier
```

---

## 📊 Performance Optimization

### For Training

1. **Use GPU if available:**

   ```powershell
   pip install tensorflow-gpu==2.15.0
   ```

2. **Increase batch size:**

   ```powershell
   python src/train.py --batch_size 64
   ```

3. **Use transfer learning:**
   - Faster training (10-15 mins vs 25-30 mins)
   - Better accuracy with less data

### For Inference

1. **Model optimization:**

   - Use MobileNetV2 (already default)
   - Consider model quantization for production

2. **Image preprocessing:**

   - Resize images before upload
   - Use appropriate image formats (JPEG recommended)

3. **Caching:**
   - Enable browser caching for static assets
   - Cache model in memory (already implemented)

---

## 🔐 Security Considerations

### For Development

- API runs on localhost only by default
- CORS enabled for frontend communication
- File upload size limited to 16MB
- File type validation on backend

### For Production

Consider adding:

- Authentication (JWT tokens)
- Rate limiting
- HTTPS/SSL certificates
- Input sanitization
- API key protection
- Database encryption

---

## 📁 Project Structure Reference

```
Image-Classifier-Sprint/
├── api/
│   ├── app.py                 # Flask API server
│   ├── templates/
│   │   └── index.html        # Legacy HTML interface
│   └── uploads/              # Temporary upload storage
├── data/
│   ├── train/                # Training images
│   │   ├── human/
│   │   └── robot/
│   ├── val/                  # Validation images
│   │   ├── human/
│   │   └── robot/
│   └── test/                 # Test images
├── database/
│   └── predictions.db        # SQLite database
├── frontend/
│   ├── app/                  # Next.js app directory
│   │   ├── page.tsx          # Main page
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   └── analytics/        # Analytics page
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   ├── certificates/         # HTTPS certificates
│   ├── package.json
│   └── next.config.js
├── models/                   # Trained models (.h5)
├── src/
│   ├── __init__.py
│   ├── model.py              # CNN architectures
│   ├── train.py              # Training script
│   ├── predict.py            # Prediction script
│   ├── preprocess.py         # Image preprocessing
│   └── database.py           # Database operations
├── tests/                    # Test images
├── requirements.txt          # Python dependencies
├── README.md                 # Main documentation
├── QUICKSTART.md            # Quick start guide
├── PRESENTATION_GUIDE.md    # Presentation instructions (RO)
└── RUN_GUIDE.md            # This file (EN)
```

---

## 🎓 Learning Resources

### TensorFlow & Deep Learning

- [TensorFlow Documentation](https://www.tensorflow.org/api_docs)
- [Keras Guide](https://keras.io/guides/)
- [Transfer Learning Tutorial](https://www.tensorflow.org/tutorials/images/transfer_learning)

### Next.js & React

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Flask & APIs

- [Flask Documentation](https://flask.palletsprojects.com/)
- [RESTful API Design](https://restfulapi.net/)

---

## 💡 Tips for Best Results

### Dataset Quality

- Use high-quality, clear images
- Balanced classes (equal human and robot images)
- Diverse angles, lighting, and backgrounds
- Minimum 100 images per class for good results
- 500+ images per class for excellent results

### Model Training

- Start with transfer learning
- Use data augmentation for small datasets
- Monitor validation accuracy to avoid overfitting
- Train for more epochs if accuracy plateaus
- Save multiple model checkpoints

### User Experience

- Use good lighting when capturing with camera
- Center subjects in frame
- Avoid blurry or distorted images
- Try multiple angles if confidence is low
- Check analytics for model performance insights

---

## 🆘 Support & Community

### Getting Help

1. **Check documentation:**

   - README.md
   - QUICKSTART.md
   - This guide (RUN_GUIDE.md)

2. **Review code:**

   - Well-commented source code
   - Example scripts in `src/`

3. **GitHub Issues:**
   - Report bugs
   - Request features
   - Ask questions

### Contributing

Contributions welcome! Consider:

- Bug fixes
- New features
- Documentation improvements
- Test cases
- Performance optimizations

---

## ✅ Success Checklist

Before presenting or deploying:

- [ ] Python dependencies installed
- [ ] Node.js dependencies installed
- [ ] Model trained and saved
- [ ] Backend API running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can upload and classify images
- [ ] Camera capture working (if needed)
- [ ] Analytics page accessible
- [ ] Database storing predictions
- [ ] No console errors
- [ ] Tested on multiple images
- [ ] History and statistics working
- [ ] All features demonstrated

---

## 🎉 Congratulations!

You now have a fully functional AI-powered image classifier with:

- ✅ Modern web interface
- ✅ Real-time predictions
- ✅ Advanced analytics
- ✅ Complete API
- ✅ Database persistence
- ✅ Camera integration

**Ready to impress at your hackathon!** 🚀

---

## 📞 Quick Reference Commands

### Start Everything (Two Terminals)

**Terminal 1 - Backend:**

```powershell
cd Image-Classifier-Sprint
.\venv\Scripts\activate  # if using venv
python api/app.py
```

**Terminal 2 - Frontend:**

```powershell
cd Image-Classifier-Sprint\frontend
npm run dev
```

**Access:** http://localhost:3000

### Stop Everything

- Press `Ctrl+C` in both terminals
- Deactivate venv: `deactivate`

---

**Last Updated:** November 8, 2025  
**Version:** 1.0  
**Author:** ANDYGAB04  
**Repository:** github.com/ANDYGAB04/Image-Classifier-Sprint
