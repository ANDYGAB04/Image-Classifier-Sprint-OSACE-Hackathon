"""
CNN model architectures for Robot vs Human classification.
Supports both transfer learning and custom CNN architectures.
"""

from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import (
    Conv2D, MaxPooling2D, Flatten, Dense, Dropout,
    GlobalAveragePooling2D, BatchNormalization
)
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.optimizers import Adam
from tensorflow.keras import regularizers


def create_custom_cnn(input_shape=(224, 224, 3), num_classes=1):
    """
    Create a custom CNN architecture from scratch.

    Args:
        input_shape: Shape of input images (height, width, channels)
        num_classes: Number of output classes (1 for binary classification)

    Returns:
        Compiled Keras model
    """
    model = Sequential([
        # First convolutional block
        Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Second convolutional block
        Conv2D(64, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Third convolutional block
        Conv2D(128, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Fourth convolutional block
        Conv2D(256, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Flatten and dense layers
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(256, activation='relu'),
        Dropout(0.3),

        # Output layer (sigmoid for binary classification)
        Dense(num_classes, activation='sigmoid')
    ])

    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    return model


def create_transfer_learning_model(input_shape=(224, 224, 3),
                                   num_classes=1,
                                   freeze_base=True):
    """
    Create a model using transfer learning with MobileNetV2.

    Args:
        input_shape: Shape of input images (height, width, channels)
        num_classes: Number of output classes (1 for binary classification)
        freeze_base: Whether to freeze the base model layers

    Returns:
        Compiled Keras model
    """
    # Load pretrained MobileNetV2 without top layers
    base_model = MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights='imagenet'
    )

    # Freeze base model if requested
    if freeze_base:
        base_model.trainable = False

    # Create new model on top with regularization
    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dropout(0.3),  # Add dropout earlier
        Dense(128, activation='relu', kernel_regularizer=regularizers.l2(0.01)),
        Dropout(0.5),
        Dense(64, activation='relu', kernel_regularizer=regularizers.l2(0.01)),
        Dropout(0.4),
        Dense(num_classes, activation='sigmoid')
    ])

    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    return model


def unfreeze_model(model, freeze_until_layer=None):
    """
    Unfreeze layers in a model for fine-tuning.

    Args:
        model: Keras model
        freeze_until_layer: Layer index/name until which to keep frozen
                          (None = unfreeze all)

    Returns:
        Modified model
    """
    if freeze_until_layer is None:
        # Unfreeze all layers
        for layer in model.layers:
            layer.trainable = True
    else:
        # Unfreeze layers after specified layer
        trainable = False
        for layer in model.layers:
            if layer.name == freeze_until_layer or layer == freeze_until_layer:
                trainable = True
            layer.trainable = trainable

    # Recompile with lower learning rate for fine-tuning
    model.compile(
        optimizer=Adam(learning_rate=0.0001),
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    return model


def load_trained_model(model_path):
    """
    Load a saved model from file.

    Args:
        model_path: Path to the saved model file

    Returns:
        Loaded Keras model
    """
    from tensorflow.keras.models import load_model
    return load_model(model_path)


def get_model_summary(model):
    """
    Get a string summary of the model architecture.

    Args:
        model: Keras model

    Returns:
        String summary
    """
    import io
    stream = io.StringIO()
    model.summary(print_fn=lambda x: stream.write(x + '\n'))
    return stream.getvalue()
