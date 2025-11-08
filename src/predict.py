"""
Prediction script for the Robot vs Human classifier.
Handles single image and batch predictions.
"""

import os
import argparse
import numpy as np

# Handle imports for both direct execution and module imports
try:
    from .model import load_trained_model
    from .preprocess import ImagePreprocessor, validate_image_format
except ImportError:
    from model import load_trained_model
    from preprocess import ImagePreprocessor, validate_image_format


class RobotHumanPredictor:
    """Predictor class for robot vs human classification."""

    def __init__(self, model_path, class_names=None):
        """
        Initialize the predictor.

        Args:
            model_path: Path to the trained model file
            class_names: Dictionary mapping class indices to names
                        Default: {0: 'human', 1: 'robot'}
        """
        self.model = load_trained_model(model_path)
        self.preprocessor = ImagePreprocessor(target_size=(224, 224))

        # Default class names (binary classification)
        if class_names is None:
            self.class_names = {0: 'human', 1: 'robot'}
        else:
            self.class_names = class_names

    def predict_single(self, image_path, return_confidence=True):
        """
        Predict class for a single image.

        Args:
            image_path: Path to the image file
            return_confidence: Whether to return confidence scores

        Returns:
            If return_confidence is True: (predicted_class, confidence)
            Otherwise: predicted_class
        """
        # Validate image format
        if not validate_image_format(image_path):
            raise ValueError(f"Invalid image format: {image_path}")

        # Preprocess image
        img = self.preprocessor.load_and_preprocess_image(image_path)
        img_batch = np.expand_dims(img, axis=0)

        # Make prediction
        prediction = self.model.predict(img_batch, verbose=0)[0][0]

        # Convert to class label
        class_idx = int(prediction > 0.5)
        predicted_class = self.class_names[class_idx]

        # Calculate confidence
        confidence = prediction if class_idx == 1 else (1 - prediction)

        if return_confidence:
            return predicted_class, confidence
        else:
            return predicted_class

    def predict_batch(self, image_paths):
        """
        Predict classes for multiple images.

        Args:
            image_paths: List of image file paths

        Returns:
            List of tuples (image_path, predicted_class, confidence)
        """
        results = []

        for image_path in image_paths:
            try:
                predicted_class, confidence = self.predict_single(image_path)
                results.append((image_path, predicted_class, confidence))
            except Exception as e:
                print(f"Error processing {image_path}: {str(e)}")
                results.append((image_path, 'error', 0.0))

        return results

    def predict_from_array(self, image_array):
        """
        Predict from a preprocessed numpy array.

        Args:
            image_array: Preprocessed image as numpy array (already normalized)

        Returns:
            (predicted_class, confidence)
        """
        # Ensure correct shape
        if len(image_array.shape) == 3:
            image_array = np.expand_dims(image_array, axis=0)

        # Make prediction
        prediction = self.model.predict(image_array, verbose=0)[0][0]

        # Convert to class label
        class_idx = int(prediction > 0.5)
        predicted_class = self.class_names[class_idx]

        # Calculate confidence
        confidence = prediction if class_idx == 1 else (1 - prediction)

        return predicted_class, confidence


def main():
    """Main prediction function with command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Predict Robot vs Human for images'
    )
    parser.add_argument(
        '--image',
        type=str,
        required=True,
        help='Path to image file or directory of images'
    )
    parser.add_argument(
        '--model',
        type=str,
        required=True,
        help='Path to trained model file (.h5)'
    )

    args = parser.parse_args()

    # Verify model exists
    if not os.path.exists(args.model):
        print(f"Error: Model file not found: {args.model}")
        return

    # Initialize predictor
    print("Loading model...")
    predictor = RobotHumanPredictor(args.model)
    print("Model loaded successfully!\n")

    # Check if input is file or directory
    if os.path.isfile(args.image):
        # Single image prediction
        print(f"Predicting for: {args.image}")
        print("-" * 50)

        try:
            predicted_class, confidence = predictor.predict_single(args.image)

            print(f"Predicted Class: {predicted_class.upper()}")
            print(f"Confidence: {confidence*100:.2f}%")

            if confidence > 0.9:
                print("Prediction strength: Very High")
            elif confidence > 0.7:
                print("Prediction strength: High")
            elif confidence > 0.5:
                print("Prediction strength: Moderate")
            else:
                print("Prediction strength: Low")

        except Exception as e:
            print(f"Error: {str(e)}")

    elif os.path.isdir(args.image):
        # Batch prediction
        image_files = []
        for file in os.listdir(args.image):
            file_path = os.path.join(args.image, file)
            if os.path.isfile(file_path) and validate_image_format(file_path):
                image_files.append(file_path)

        if not image_files:
            print(f"No valid images found in {args.image}")
            return

        print(f"Found {len(image_files)} images. Processing...\n")
        print("-" * 70)

        results = predictor.predict_batch(image_files)

        for image_path, predicted_class, confidence in results:
            filename = os.path.basename(image_path)
            print(f"{filename:30s} -> {predicted_class:6s} ({confidence*100:5.2f}%)")

        print("-" * 70)

        # Summary
        robot_count = sum(1 for _, cls, _ in results if cls == 'robot')
        human_count = sum(1 for _, cls, _ in results if cls == 'human')

        print(f"\nSummary:")
        print(f"  Robots: {robot_count}")
        print(f"  Humans: {human_count}")
        print(f"  Total: {len(results)}")

    else:
        print(f"Error: {args.image} is not a valid file or directory")


if __name__ == '__main__':
    main()
