"""
Image preprocessing module for the Robot vs Human classifier.
Handles image loading, resizing, normalization, and augmentation.
"""

import numpy as np
from PIL import Image
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import os


class ImagePreprocessor:
    """Handles all image preprocessing operations."""

    def __init__(self, target_size=(224, 224), normalize=True):
        """
        Initialize the preprocessor.

        Args:
            target_size: Tuple of (height, width) for image resizing
            normalize: Whether to normalize pixel values to [0, 1]
        """
        self.target_size = target_size
        self.normalize = normalize

    def load_and_preprocess_image(self, image_path):
        """
        Load and preprocess a single image.

        Args:
            image_path: Path to the image file

        Returns:
            Preprocessed image as numpy array
        """
        try:
            # Load image
            img = Image.open(image_path)

            # Convert to RGB if necessary
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Resize
            img = img.resize(self.target_size)

            # Convert to array
            img_array = np.array(img)

            # Normalize if requested
            if self.normalize:
                img_array = img_array.astype('float32') / 255.0

            return img_array

        except Exception as e:
            raise ValueError(f"Error processing image {image_path}: {str(e)}")

    def preprocess_batch(self, image_paths):
        """
        Preprocess a batch of images.

        Args:
            image_paths: List of image file paths

        Returns:
            Numpy array of preprocessed images
        """
        images = []
        for path in image_paths:
            img = self.load_and_preprocess_image(path)
            images.append(img)

        return np.array(images)

    @staticmethod
    def create_data_generators(train_dir, val_dir, target_size=(224, 224),
                               batch_size=32, augment=True):
        """
        Create data generators for training and validation.

        Args:
            train_dir: Directory containing training data
            val_dir: Directory containing validation data
            target_size: Target image size
            batch_size: Batch size for training
            augment: Whether to apply data augmentation

        Returns:
            train_generator, val_generator
        """
        if augment:
            # Training data generator with augmentation
            train_datagen = ImageDataGenerator(
                rescale=1./255,
                rotation_range=20,
                width_shift_range=0.2,
                height_shift_range=0.2,
                horizontal_flip=True,
                zoom_range=0.2,
                fill_mode='nearest'
            )
        else:
            train_datagen = ImageDataGenerator(rescale=1./255)

        # Validation data generator (no augmentation)
        val_datagen = ImageDataGenerator(rescale=1./255)

        # Create generators
        train_generator = train_datagen.flow_from_directory(
            train_dir,
            target_size=target_size,
            batch_size=batch_size,
            class_mode='binary',
            shuffle=True
        )

        val_generator = val_datagen.flow_from_directory(
            val_dir,
            target_size=target_size,
            batch_size=batch_size,
            class_mode='binary',
            shuffle=False
        )

        return train_generator, val_generator


def validate_image_format(file_path):
    """
    Validate if the file is a valid image format.

    Args:
        file_path: Path to the file

    Returns:
        Boolean indicating if file is valid
    """
    valid_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    _, ext = os.path.splitext(file_path.lower())

    if ext not in valid_extensions:
        return False

    try:
        with Image.open(file_path) as img:
            img.verify()
        return True
    except:
        return False
