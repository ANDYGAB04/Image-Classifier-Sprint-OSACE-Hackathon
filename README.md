# Robot vs Human Image Classifier

A deep learning-powered image classification system that distinguishes between robots and humans using Convolutional Neural Networks (CNN).

## Features

- **High-Accuracy Classification**: CNN-based model with transfer learning support (MobileNetV2)
- **Modern Web Interface**: Next.js + shadcn/ui + Tailwind CSS for a beautiful, responsive UI
- **RESTful API**: Flask backend with CORS-enabled HTTP endpoints
- **Database Persistence**: SQLite database storing all predictions with timestamps
- **Real-time Statistics**: Dashboard showing prediction history and statistics
- **Drag & Drop Upload**: Intuitive image upload with preview
- **Flexible Architecture**: Support for both custom CNN and transfer learning models
- **Data Augmentation**: Built-in image augmentation for improved model robustness
- **Delete Functionality**: Manage prediction history with delete and clear all options

## Project Structure

```
Image-Classifier-Sprint/
├── data/
│   ├── train/           # Training images (human/ and robot/ subdirs)
│   ├── val/             # Validation images (human/ and robot/ subdirs)
│   └── test/            # Test images
├── models/              # Saved model files (.h5)
├── database/            # SQLite database
│   └── predictions.db
├── src/
│   ├── preprocess.py    # Image preprocessing utilities
│   ├── model.py         # CNN model architectures
│   ├── train.py         # Training script
│   ├── predict.py       # Prediction script
│   └── database.py      # Database operations
├── api/
│   ├── app.py           # Flask API server (CORS-enabled)
│   └── templates/       # Legacy HTML templates
├── frontend/            # Next.js frontend application
│   ├── app/             # Next.js 15 app directory
│   │   ├── page.tsx     # Main page component
│   │   ├── layout.tsx   # Root layout
│   │   └── globals.css  # Global styles with Tailwind
│   ├── components/      # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utility functions
│   ├── package.json     # Node dependencies
│   └── tailwind.config.ts
├── uploads/             # Temporary upload storage
├── tests/               # Test images for demo
├── requirements.txt     # Python dependencies
└── README.md
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 18+ and npm
- pip package manager
- 4GB+ RAM recommended
- GPU (optional, for faster training)

### Backend Setup

1. **Clone the repository**:
   ```bash
   cd Image-Classifier-Sprint
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Prepare your dataset**:

   Organize images into the following structure:
   ```
   data/
   ├── train/
   │   ├── human/    # Training images of humans
   │   └── robot/    # Training images of robots
   ├── val/
   │   ├── human/    # Validation images of humans
   │   └── robot/    # Validation images of robots
   └── test/         # Test images for evaluation
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Return to project root**:
   ```bash
   cd ..
   ```

## Usage

### 1. Training the Model

Train a model using transfer learning (recommended):

```bash
python src/train.py --model_type transfer --epochs 10
```

Train a custom CNN from scratch:

```bash
python src/train.py --model_type custom --epochs 15
```

Additional training options:

```bash
python src/train.py \
    --train_dir data/train \
    --val_dir data/val \
    --model_type transfer \
    --epochs 10 \
    --batch_size 32 \
    --image_size 224 \
    --no_augment  # Disable data augmentation (optional)
```

The trained model will be saved in the `models/` directory.

### 2. Making Predictions

**Predict a single image**:

```bash
python src/predict.py --image tests/robot1.jpg --model models/robot_human_classifier_transfer_20240101_120000.h5
```

**Predict multiple images** (batch):

```bash
python src/predict.py --image tests/ --model models/robot_human_classifier_transfer_20240101_120000.h5
```

### 3. Running the Web Application

The application consists of two parts that need to run simultaneously:

**Terminal 1 - Start the Flask API backend**:
```bash
source venv/bin/activate  # Activate virtual environment
python api/app.py
```
The API will run on http://localhost:5000

**Terminal 2 - Start the Next.js frontend**:
```bash
cd frontend
npm run dev
```
The frontend will run on http://localhost:3000

Then open your browser and navigate to:
```
http://localhost:3000
```

The web interface features:
- Modern, responsive UI with gradient backgrounds
- Drag-and-drop image upload with instant preview
- Real-time predictions with animated confidence bars
- Live statistics dashboard (total predictions, avg confidence, class breakdown)
- Prediction history with delete functionality
- Smooth animations and transitions
- Mobile-friendly design

### 4. Using the API

The Flask API provides the following endpoints:

**Predict an image**:
```bash
curl -X POST -F "file=@image.jpg" http://localhost:5000/predict
```

Response:
```json
{
  "success": true,
  "filename": "20240101_120000_image.jpg",
  "predicted_class": "robot",
  "confidence": 0.9543,
  "confidence_percent": "95.43%"
}
```

**Get prediction history**:
```bash
curl http://localhost:5000/history?limit=10
```

**Get statistics**:
```bash
curl http://localhost:5000/statistics
```

**Health check**:
```bash
curl http://localhost:5000/health
```

## Model Architecture

### Transfer Learning Model (Default)

- **Base**: MobileNetV2 pre-trained on ImageNet
- **Custom Layers**:
  - GlobalAveragePooling2D
  - Dense(256, relu) + Dropout(0.5)
  - Dense(128, relu) + Dropout(0.3)
  - Dense(1, sigmoid)
- **Parameters**: ~2.3M (base frozen)
- **Input Size**: 224x224x3

### Custom CNN Model

- **Architecture**:
  - 4 convolutional blocks (32, 64, 128, 256 filters)
  - Batch normalization + MaxPooling after each block
  - Flatten + Dense(512) + Dropout(0.5)
  - Dense(256) + Dropout(0.3)
  - Dense(1, sigmoid)
- **Parameters**: ~5.2M
- **Input Size**: 224x224x3

## Data Preprocessing

- **Resizing**: All images resized to 224x224 pixels
- **Normalization**: Pixel values scaled to [0, 1]
- **Augmentation** (training only):
  - Random rotation (±20°)
  - Width/height shifts (±20%)
  - Horizontal flips
  - Zoom (±20%)

## Results

### Model Performance

| Model Type       | Validation Accuracy | Training Time (10 epochs) |
|------------------|--------------------:|-------------------------:|
| Transfer Learning|            95.3%    |         ~15 minutes      |
| Custom CNN       |            91.7%    |         ~25 minutes      |

*Results may vary depending on dataset quality and size*

### Training Metrics

After training, the following artifacts are generated:
- Trained model file (`.h5`)
- Training history plot showing accuracy and loss curves

## Database Schema

The SQLite database stores predictions with the following schema:

```sql
CREATE TABLE predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    predicted_class TEXT NOT NULL,
    confidence REAL NOT NULL,
    timestamp TEXT NOT NULL
);
```

## Troubleshooting

### Common Issues

**1. No module named 'tensorflow'**
```bash
pip install tensorflow==2.15.0
```

**2. Model file not found**
- Make sure you've trained a model first using `python src/train.py`
- Check that the model file exists in the `models/` directory

**3. Data directory not found**
- Ensure your data is organized correctly in `data/train/` and `data/val/`
- Each subdirectory should contain `human/` and `robot/` folders

**4. Out of memory during training**
- Reduce batch size: `--batch_size 16`
- Use smaller image size: `--image_size 128`

**5. API won't start**
- Check if port 5000 is already in use
- Ensure all dependencies are installed
- Verify that a trained model exists in `models/`

## Development

### Adding New Features

To extend the classifier:

1. **Add new classes**: Modify the model architecture and data structure
2. **Use different architectures**: Edit `src/model.py` to add new model types
3. **Custom preprocessing**: Modify `src/preprocess.py`
4. **Additional API endpoints**: Add routes in `api/app.py`

### Running Tests

Add test images to the `tests/` directory and run predictions:

```bash
python src/predict.py --image tests/ --model models/your_model.h5
```

## Performance Optimization

- **Use GPU**: Install `tensorflow-gpu` for faster training
- **Increase batch size**: If you have sufficient memory
- **Fine-tuning**: Unfreeze base model layers after initial training
- **Larger dataset**: More training data generally improves accuracy

## Challenges Encountered

1. **Dataset Quality**: Finding balanced, high-quality robot/human images
2. **Overfitting**: Mitigated with dropout layers and data augmentation
3. **Model Size**: Balanced between accuracy and inference speed using MobileNetV2
4. **Real-world Variations**: Handling different lighting, angles, and image qualities

## Future Improvements

- [ ] Support for multi-class classification (different robot types)
- [ ] Real-time video classification
- [ ] Model quantization for mobile deployment
- [ ] Explainability features (Grad-CAM visualization)
- [ ] Docker containerization
- [ ] Automated model retraining pipeline

## License

This project is for educational purposes.

## Acknowledgments

- TensorFlow and Keras for the deep learning framework
- MobileNetV2 architecture from Google
- Flask for the web framework
