"""
Prediction script for the Robot vs Human classifier.
Handles single image and batch predictions.
"""

import os
import argparse
import numpy as np
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score

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

    def get_prediction_with_probabilities(self, image_path):
        """
        Get prediction with both class probabilities.

        Args:
            image_path: Path to the image file

        Returns:
            Dictionary with predicted class, confidence, and probabilities for both classes
        """
        if not validate_image_format(image_path):
            raise ValueError(f"Invalid image format: {image_path}")

        img = self.preprocessor.load_and_preprocess_image(image_path)
        img_batch = np.expand_dims(img, axis=0)

        # Get raw prediction (0-1, where 0=human, 1=robot)
        raw_prediction = self.model.predict(img_batch, verbose=0)[0][0]

        # Class probabilities
        prob_robot = float(raw_prediction)
        prob_human = float(1 - raw_prediction)

        # Get class prediction
        class_idx = int(raw_prediction > 0.5)
        predicted_class = self.class_names[class_idx]

        # Get confidence (how sure about the prediction)
        confidence = prob_robot if class_idx == 1 else prob_human

        return {
            'predicted_class': predicted_class,
            'confidence': confidence,
            'probabilities': {
                'human': prob_human,
                'robot': prob_robot
            }
        }

    def evaluate_on_test_set(self, test_dir):
        """
        Evaluate model on a test dataset directory.

        Args:
            test_dir: Root directory containing 'human' and 'robot' subdirectories

        Returns:
            Dictionary with evaluation metrics including confusion matrix
        """
        all_true_labels = []
        all_predictions = []
        all_probabilities = []
        results = []

        # Process human images
        human_dir = os.path.join(test_dir, 'human')
        if os.path.exists(human_dir):
            for filename in os.listdir(human_dir):
                filepath = os.path.join(human_dir, filename)
                if os.path.isfile(filepath) and validate_image_format(filepath):
                    try:
                        pred_data = self.get_prediction_with_probabilities(filepath)
                        all_true_labels.append('human')
                        all_predictions.append(pred_data['predicted_class'])
                        all_probabilities.append(pred_data['probabilities'])
                        results.append({
                            'filename': filename,
                            'true_class': 'human',
                            'predicted_class': pred_data['predicted_class'],
                            'confidence': pred_data['confidence'],
                            'probabilities': pred_data['probabilities']
                        })
                    except Exception as e:
                        print(f"Error processing {filepath}: {str(e)}")

        # Process robot images
        robot_dir = os.path.join(test_dir, 'robot')
        if os.path.exists(robot_dir):
            for filename in os.listdir(robot_dir):
                filepath = os.path.join(robot_dir, filename)
                if os.path.isfile(filepath) and validate_image_format(filepath):
                    try:
                        pred_data = self.get_prediction_with_probabilities(filepath)
                        all_true_labels.append('robot')
                        all_predictions.append(pred_data['predicted_class'])
                        all_probabilities.append(pred_data['probabilities'])
                        results.append({
                            'filename': filename,
                            'true_class': 'robot',
                            'predicted_class': pred_data['predicted_class'],
                            'confidence': pred_data['confidence'],
                            'probabilities': pred_data['probabilities']
                        })
                    except Exception as e:
                        print(f"Error processing {filepath}: {str(e)}")

        if not all_true_labels:
            raise ValueError(f"No valid test images found in {test_dir}")

        # Calculate metrics
        accuracy = accuracy_score(all_true_labels, all_predictions)

        # Create confusion matrix
        classes = ['human', 'robot']
        cm = confusion_matrix(all_true_labels, all_predictions, labels=classes)

        # Calculate per-class metrics
        report = classification_report(
            all_true_labels,
            all_predictions,
            labels=classes,
            output_dict=True,
            zero_division=0
        )

        # Average probabilities by true class
        avg_probs_by_true_class = {'human': {'human': 0.0, 'robot': 0.0}, 'robot': {'human': 0.0, 'robot': 0.0}}
        human_count = sum(1 for label in all_true_labels if label == 'human')
        robot_count = sum(1 for label in all_true_labels if label == 'robot')

        for i, true_label in enumerate(all_true_labels):
            avg_probs_by_true_class[true_label]['human'] += all_probabilities[i]['human']
            avg_probs_by_true_class[true_label]['robot'] += all_probabilities[i]['robot']

        if human_count > 0:
            avg_probs_by_true_class['human']['human'] /= human_count
            avg_probs_by_true_class['human']['robot'] /= human_count

        if robot_count > 0:
            avg_probs_by_true_class['robot']['human'] /= robot_count
            avg_probs_by_true_class['robot']['robot'] /= robot_count

        return {
            'accuracy': float(accuracy),
            'total_samples': len(all_true_labels),
            'human_samples': human_count,
            'robot_samples': robot_count,
            'confusion_matrix': {
                'labels': classes,
                'matrix': cm.tolist(),
                'true_human_predicted_human': int(cm[0, 0]),
                'true_human_predicted_robot': int(cm[0, 1]),
                'true_robot_predicted_human': int(cm[1, 0]),
                'true_robot_predicted_robot': int(cm[1, 1])
            },
            'per_class_metrics': {
                'human': {
                    'precision': float(report['human']['precision']),
                    'recall': float(report['human']['recall']),
                    'f1_score': float(report['human']['f1-score']),
                    'support': int(report['human']['support'])
                },
                'robot': {
                    'precision': float(report['robot']['precision']),
                    'recall': float(report['robot']['recall']),
                    'f1_score': float(report['robot']['f1-score']),
                    'support': int(report['robot']['support'])
                }
            },
            'average_probabilities': avg_probs_by_true_class,
            'detailed_results': results
        }


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
