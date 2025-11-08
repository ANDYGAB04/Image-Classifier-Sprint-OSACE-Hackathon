"""
Training script for the Robot vs Human classifier.
Handles model training, validation, and saving.
"""

import os
import argparse
import matplotlib.pyplot as plt
from datetime import datetime
from model import create_custom_cnn, create_transfer_learning_model
from preprocess import ImagePreprocessor


def plot_training_history(history, save_path='training_history.png'):
    """
    Plot training and validation accuracy/loss.

    Args:
        history: Keras training history object
        save_path: Path to save the plot
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

    # Plot accuracy
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)

    # Plot loss
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Val Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)

    plt.tight_layout()
    plt.savefig(save_path)
    print(f"Training history plot saved to {save_path}")


def train_model(train_dir, val_dir, model_type='transfer', epochs=10,
                batch_size=32, image_size=224, augment=True):
    """
    Train the image classifier.

    Args:
        train_dir: Directory containing training data
        val_dir: Directory containing validation data
        model_type: 'transfer' or 'custom'
        epochs: Number of training epochs
        batch_size: Batch size for training
        image_size: Size to resize images to
        augment: Whether to apply data augmentation

    Returns:
        Trained model and training history
    """
    print("="*60)
    print("ROBOT VS HUMAN CLASSIFIER - TRAINING")
    print("="*60)

    # Create data generators
    print("\n[1/5] Creating data generators...")
    target_size = (image_size, image_size)

    train_generator, val_generator = ImagePreprocessor.create_data_generators(
        train_dir=train_dir,
        val_dir=val_dir,
        target_size=target_size,
        batch_size=batch_size,
        augment=augment
    )

    print(f"Training samples: {train_generator.samples}")
    print(f"Validation samples: {val_generator.samples}")
    print(f"Classes: {train_generator.class_indices}")

    # Create model
    print(f"\n[2/5] Creating {model_type} model...")
    input_shape = (image_size, image_size, 3)

    if model_type == 'transfer':
        model = create_transfer_learning_model(input_shape=input_shape)
        print("Using MobileNetV2 with transfer learning")
    else:
        model = create_custom_cnn(input_shape=input_shape)
        print("Using custom CNN architecture")

    print(f"\nModel parameters: {model.count_params():,}")

    # Train model
    print(f"\n[3/5] Training model for {epochs} epochs...")
    print("-" * 60)

    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=val_generator,
        verbose=1
    )

    # Evaluate on validation set
    print("\n[4/5] Evaluating on validation set...")
    val_loss, val_accuracy = model.evaluate(val_generator, verbose=0)
    print(f"Validation Loss: {val_loss:.4f}")
    print(f"Validation Accuracy: {val_accuracy:.4f} ({val_accuracy*100:.2f}%)")

    # Save model
    print("\n[5/5] Saving model and training plots...")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = f"robot_human_classifier_{model_type}_{timestamp}.h5"
    model_path = os.path.join('models', model_filename)

    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)

    model.save(model_path)
    print(f"Model saved to: {model_path}")

    # Save training history plot
    plot_path = os.path.join('models', f'training_history_{timestamp}.png')
    plot_training_history(history, plot_path)

    print("\n" + "="*60)
    print("TRAINING COMPLETED SUCCESSFULLY!")
    print("="*60)
    print(f"\nFinal Accuracy: {val_accuracy*100:.2f}%")
    print(f"Model saved as: {model_filename}")

    return model, history


def main():
    """Main training function with command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Train Robot vs Human Image Classifier'
    )
    parser.add_argument(
        '--train_dir',
        type=str,
        default='data/train',
        help='Directory containing training data'
    )
    parser.add_argument(
        '--val_dir',
        type=str,
        default='data/val',
        help='Directory containing validation data'
    )
    parser.add_argument(
        '--model_type',
        type=str,
        choices=['transfer', 'custom'],
        default='transfer',
        help='Model architecture to use'
    )
    parser.add_argument(
        '--epochs',
        type=int,
        default=10,
        help='Number of training epochs'
    )
    parser.add_argument(
        '--batch_size',
        type=int,
        default=32,
        help='Batch size for training'
    )
    parser.add_argument(
        '--image_size',
        type=int,
        default=224,
        help='Image size (width and height)'
    )
    parser.add_argument(
        '--no_augment',
        action='store_true',
        help='Disable data augmentation'
    )

    args = parser.parse_args()

    # Verify data directories exist
    if not os.path.exists(args.train_dir):
        print(f"Error: Training directory not found: {args.train_dir}")
        print("Please organize your data as:")
        print("  data/train/human/  <- images of humans")
        print("  data/train/robot/  <- images of robots")
        return

    if not os.path.exists(args.val_dir):
        print(f"Error: Validation directory not found: {args.val_dir}")
        print("Please organize your data as:")
        print("  data/val/human/  <- images of humans")
        print("  data/val/robot/  <- images of robots")
        return

    # Train model
    model, history = train_model(
        train_dir=args.train_dir,
        val_dir=args.val_dir,
        model_type=args.model_type,
        epochs=args.epochs,
        batch_size=args.batch_size,
        image_size=args.image_size,
        augment=not args.no_augment
    )


if __name__ == '__main__':
    main()
