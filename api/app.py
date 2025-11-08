"""
Flask API for the Robot vs Human Image Classifier.
Provides endpoints for image upload, prediction, and viewing results.
"""

import os
import sys
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from datetime import datetime
import glob

# Add parent directory to path to import from src
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.predict import RobotHumanPredictor
from src.database import PredictionDatabase
from src.preprocess import validate_image_format

app = Flask(__name__)
CORS(app)

# Configuration
# Use parent directory's uploads folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "bmp"}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

# Global variables
predictor = None
database = None


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def initialize_app():
    """Initialize predictor and database."""
    global predictor, database

    # Create upload folder
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # Find the most recent model file
    model_files = glob.glob("models/*.h5")
    if not model_files:
        print("WARNING: No trained model found in models/ directory")
        print("Please train a model first using: python src/train.py")
        return False

    # Use the most recent model
    model_path = max(model_files, key=os.path.getctime)
    print(f"Loading model: {model_path}")

    # Initialize predictor
    predictor = RobotHumanPredictor(model_path)

    # Initialize database
    database = PredictionDatabase()

    print("Application initialized successfully!")
    return True


@app.route("/")
def index():
    """Render the main page."""
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict endpoint for image classification.

    Expects: multipart/form-data with 'file' field containing image

    Returns: JSON with predicted_class and confidence
    """
    # Check if file is present
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    # Check if file is selected
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify(
            {"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, bmp"}
        ), 400

    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], unique_filename)

        file.save(filepath)

        # Validate image format
        if not validate_image_format(filepath):
            os.remove(filepath)
            return jsonify({"error": "Invalid or corrupted image file"}), 400

        # Make prediction
        predicted_class, confidence = predictor.predict_single(filepath)

        # Save to database
        database.save_prediction(
            filename=unique_filename,
            predicted_class=predicted_class,
            confidence=float(confidence),
        )

        # Return result
        return jsonify(
            {
                "success": True,
                "filename": unique_filename,
                "predicted_class": predicted_class,
                "confidence": float(confidence),
                "confidence_percent": f"{confidence * 100:.2f}%",
            }
        )

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@app.route("/history", methods=["GET"])
def history():
    """
    Get prediction history.

    Query params:
        limit (int): Maximum number of records to return
        min_confidence (float): Minimum confidence threshold (0.0-1.0)
        max_confidence (float): Maximum confidence threshold (0.0-1.0)

    Returns: JSON array of prediction records
    """
    try:
        limit = request.args.get("limit", type=int, default=50)
        min_confidence = request.args.get("min_confidence", type=float, default=0.0)
        max_confidence = request.args.get("max_confidence", type=float, default=1.0)

        # Validate confidence values
        min_confidence = max(0.0, min(1.0, min_confidence))
        max_confidence = max(0.0, min(1.0, max_confidence))

        # Ensure min <= max
        if min_confidence > max_confidence:
            min_confidence, max_confidence = max_confidence, min_confidence

        predictions = database.get_predictions_by_confidence(
            min_confidence=min_confidence, max_confidence=max_confidence, limit=limit
        )

        return jsonify(
            {
                "success": True,
                "count": len(predictions),
                "filters": {
                    "min_confidence": min_confidence,
                    "max_confidence": max_confidence,
                },
                "predictions": predictions,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/statistics", methods=["GET"])
def statistics():
    """
    Get prediction statistics.

    Returns: JSON with summary statistics
    """
    try:
        stats = database.get_statistics()

        return jsonify({"success": True, "statistics": stats})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/prediction/<int:prediction_id>", methods=["DELETE"])
def delete_prediction(prediction_id):
    """
    Delete a single prediction by ID.

    Args:
        prediction_id: ID of the prediction to delete

    Returns: JSON with success status
    """
    try:
        success = database.delete_prediction(prediction_id)

        if success:
            return jsonify(
                {
                    "success": True,
                    "message": f"Prediction {prediction_id} deleted successfully",
                }
            )
        else:
            return jsonify({"success": False, "error": "Prediction not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predictions", methods=["DELETE"])
def clear_all_predictions():
    """
    Clear all predictions from the database.

    Returns: JSON with count of deleted records
    """
    try:
        count = database.clear_all_predictions()

        return jsonify(
            {"success": True, "message": f"Deleted {count} predictions", "count": count}
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/uploads/<filename>")
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/analytics/confidence-distribution", methods=["GET"])
def confidence_distribution():
    """
    Get confidence distribution data for chart visualization.

    Returns: JSON with confidence distribution statistics
    """
    try:
        predictions = database.get_all_predictions(limit=None)

        if not predictions:
            return jsonify(
                {
                    "success": True,
                    "message": "No predictions available",
                    "total": 0,
                    "distribution": {
                        "very_high": 0,  # 90-100%
                        "high": 0,  # 75-89%
                        "moderate": 0,  # 60-74%
                        "low": 0,  # 0-59%
                    },
                    "by_class": {
                        "human": {"very_high": 0, "high": 0, "moderate": 0, "low": 0},
                        "robot": {"very_high": 0, "high": 0, "moderate": 0, "low": 0},
                    },
                    "average_confidence": 0,
                    "chart_data": {
                        "labels": [
                            "Very High (90-100%)",
                            "High (75-89%)",
                            "Moderate (60-74%)",
                            "Low (0-59%)",
                        ],
                        "values": [0, 0, 0, 0],
                        "colors": ["#22c55e", "#06b6d4", "#eab308", "#ef4444"],
                    },
                }
            )

        # Calculate distribution
        distribution = {"very_high": 0, "high": 0, "moderate": 0, "low": 0}
        by_class = {
            "human": {"very_high": 0, "high": 0, "moderate": 0, "low": 0},
            "robot": {"very_high": 0, "high": 0, "moderate": 0, "low": 0},
        }

        total_confidence = 0.0

        for pred in predictions:
            conf = pred["confidence"]
            total_confidence += conf
            pred_class = pred["predicted_class"]

            if conf >= 0.9:
                distribution["very_high"] += 1
                by_class[pred_class]["very_high"] += 1
            elif conf >= 0.75:
                distribution["high"] += 1
                by_class[pred_class]["high"] += 1
            elif conf >= 0.6:
                distribution["moderate"] += 1
                by_class[pred_class]["moderate"] += 1
            else:
                distribution["low"] += 1
                by_class[pred_class]["low"] += 1

        avg_confidence = total_confidence / len(predictions) if predictions else 0

        return jsonify(
            {
                "success": True,
                "total": len(predictions),
                "distribution": distribution,
                "by_class": by_class,
                "average_confidence": float(avg_confidence),
                "chart_data": {
                    "labels": [
                        "Very High (90-100%)",
                        "High (75-89%)",
                        "Moderate (60-74%)",
                        "Low (0-59%)",
                    ],
                    "values": [
                        distribution["very_high"],
                        distribution["high"],
                        distribution["moderate"],
                        distribution["low"],
                    ],
                    "colors": ["#22c55e", "#06b6d4", "#eab308", "#ef4444"],
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analytics/class-distribution", methods=["GET"])
def class_distribution():
    """
    Get class distribution data for chart visualization.

    Returns: JSON with human vs robot distribution
    """
    try:
        predictions = database.get_all_predictions(limit=None)

        human_count = sum(1 for p in predictions if p["predicted_class"] == "human")
        robot_count = sum(1 for p in predictions if p["predicted_class"] == "robot")
        total = len(predictions)

        human_percent = (human_count / total * 100) if total > 0 else 0
        robot_percent = (robot_count / total * 100) if total > 0 else 0

        return jsonify(
            {
                "success": True,
                "total": total,
                "human": {"count": human_count, "percentage": float(human_percent)},
                "robot": {"count": robot_count, "percentage": float(robot_percent)},
                "chart_data": {
                    "labels": ["Human", "Robot"],
                    "values": [human_count, robot_count],
                    "colors": ["#22c55e", "#ef4444"],
                },
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analytics/evaluate", methods=["POST"])
def evaluate_model():
    """
    Evaluate model on test dataset and return confusion matrix and metrics.

    Request body:
        {
            "test_dir": "data/test"  (optional, defaults to data/test)
        }

    Returns: JSON with confusion matrix and performance metrics
    """
    try:
        data = request.get_json() or {}
        test_dir = data.get("test_dir", "data/test")

        if not os.path.exists(test_dir):
            return jsonify(
                {
                    "error": f"Test directory not found: {test_dir}",
                    "available_paths": ["data/test", "data/val"],
                }
            ), 404

        # Evaluate model
        evaluation_results = predictor.evaluate_on_test_set(test_dir)

        return jsonify({"success": True, "evaluation": evaluation_results})

    except Exception as e:
        return jsonify({"error": f"Evaluation failed: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "healthy",
            "predictor_loaded": predictor is not None,
            "database_connected": database is not None,
        }
    )


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error."""
    return jsonify({"error": "File too large. Maximum size is 16MB"}), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({"error": "Internal server error"}), 500


def main():
    """Main function to run the Flask app."""
    print("=" * 60)
    print("ROBOT VS HUMAN CLASSIFIER - API SERVER")
    print("=" * 60)

    # Initialize the application
    if not initialize_app():
        print("\nERROR: Failed to initialize application")
        print("Make sure you have trained a model first:")
        print("  python src/train.py --train_dir data/train --val_dir data/val")
        return

    print("\n" + "=" * 60)
    print("Server is ready!")
    print("=" * 60)
    print("\nAccess the web interface at: http://localhost:5000")
    print("API endpoints:")
    print("  POST /predict       - Upload image for prediction")
    print("  GET  /history       - View prediction history")
    print("  GET  /statistics    - View statistics")
    print("  GET  /health        - Health check")
    print("\nPress CTRL+C to stop the server")
    print("=" * 60 + "\n")

    # Run the app
    app.run(host="0.0.0.0", port=5000, debug=True)


if __name__ == "__main__":
    main()
