"""
Database module for storing prediction results.
Uses SQLite to persist all predictions made by the model.
"""

import sqlite3
import os
from datetime import datetime
from contextlib import contextmanager


class PredictionDatabase:
    """Handles all database operations for prediction storage."""

    def __init__(self, db_path='database/predictions.db'):
        """
        Initialize database connection.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = db_path

        # Create database directory if it doesn't exist
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)

        # Initialize database
        self._initialize_database()

    @contextmanager
    def _get_connection(self):
        """
        Context manager for database connections.

        Yields:
            SQLite connection object
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    def _initialize_database(self):
        """Create the predictions table if it doesn't exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    predicted_class TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    timestamp TEXT NOT NULL
                )
            ''')

            # Create index on timestamp for faster queries
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp
                ON predictions(timestamp)
            ''')

    def save_prediction(self, filename, predicted_class, confidence):
        """
        Save a prediction to the database.

        Args:
            filename: Name of the image file
            predicted_class: Predicted class (e.g., 'robot' or 'human')
            confidence: Confidence score (0-1)

        Returns:
            ID of the inserted record
        """
        timestamp = datetime.now().isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO predictions (filename, predicted_class, confidence, timestamp)
                VALUES (?, ?, ?, ?)
            ''', (filename, predicted_class, confidence, timestamp))

            return cursor.lastrowid

    def save_batch_predictions(self, predictions):
        """
        Save multiple predictions at once.

        Args:
            predictions: List of tuples (filename, predicted_class, confidence)

        Returns:
            Number of records inserted
        """
        timestamp = datetime.now().isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()

            data = [(filename, predicted_class, confidence, timestamp)
                   for filename, predicted_class, confidence in predictions]

            cursor.executemany('''
                INSERT INTO predictions (filename, predicted_class, confidence, timestamp)
                VALUES (?, ?, ?, ?)
            ''', data)

            return cursor.rowcount

    def get_all_predictions(self, limit=None):
        """
        Retrieve all predictions from the database.

        Args:
            limit: Maximum number of records to return (None for all)

        Returns:
            List of prediction records as dictionaries
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()

            query = 'SELECT * FROM predictions ORDER BY timestamp DESC'
            if limit:
                query += f' LIMIT {limit}'

            cursor.execute(query)
            rows = cursor.fetchall()

            return [dict(row) for row in rows]

    def get_predictions_by_class(self, predicted_class):
        """
        Get all predictions for a specific class.

        Args:
            predicted_class: Class to filter by (e.g., 'robot' or 'human')

        Returns:
            List of prediction records
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM predictions
                WHERE predicted_class = ?
                ORDER BY timestamp DESC
            ''', (predicted_class,))

            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_predictions_by_date_range(self, start_date, end_date):
        """
        Get predictions within a date range.

        Args:
            start_date: Start date (ISO format string)
            end_date: End date (ISO format string)

        Returns:
            List of prediction records
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT * FROM predictions
                WHERE timestamp BETWEEN ? AND ?
                ORDER BY timestamp DESC
            ''', (start_date, end_date))

            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def get_predictions_by_confidence(self, min_confidence=0.0, max_confidence=1.0, limit=None):
        """
        Get predictions filtered by confidence threshold.

        Args:
            min_confidence: Minimum confidence score (0.0-1.0)
            max_confidence: Maximum confidence score (0.0-1.0)
            limit: Maximum number of records to return (None for all)

        Returns:
            List of prediction records
        """
        # Clamp values to valid range
        min_confidence = max(0.0, min(1.0, min_confidence))
        max_confidence = max(0.0, min(1.0, max_confidence))

        with self._get_connection() as conn:
            cursor = conn.cursor()

            query = '''
                SELECT * FROM predictions
                WHERE confidence BETWEEN ? AND ?
                ORDER BY timestamp DESC
            '''
            
            if limit:
                query += f' LIMIT {limit}'

            cursor.execute(query, (min_confidence, max_confidence))
            rows = cursor.fetchall()

            return [dict(row) for row in rows]

    def get_statistics(self):
        """
        Get summary statistics of all predictions.

        Returns:
            Dictionary with statistics
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Total predictions
            cursor.execute('SELECT COUNT(*) as total FROM predictions')
            total = cursor.fetchone()['total']

            # Predictions by class
            cursor.execute('''
                SELECT predicted_class, COUNT(*) as count
                FROM predictions
                GROUP BY predicted_class
            ''')
            by_class = {row['predicted_class']: row['count']
                       for row in cursor.fetchall()}

            # Average confidence
            cursor.execute('''
                SELECT AVG(confidence) as avg_confidence
                FROM predictions
            ''')
            avg_confidence = cursor.fetchone()['avg_confidence']

            # Recent predictions
            cursor.execute('''
                SELECT COUNT(*) as recent_count
                FROM predictions
                WHERE timestamp > datetime('now', '-1 day')
            ''')
            recent_count = cursor.fetchone()['recent_count']

            return {
                'total_predictions': total,
                'predictions_by_class': by_class,
                'average_confidence': avg_confidence,
                'recent_predictions_24h': recent_count
            }

    def delete_prediction(self, prediction_id):
        """
        Delete a prediction by ID.

        Args:
            prediction_id: ID of the prediction to delete

        Returns:
            True if deleted, False if not found
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM predictions WHERE id = ?', (prediction_id,))
            return cursor.rowcount > 0

    def clear_all_predictions(self):
        """
        Delete all predictions from the database.

        Returns:
            Number of records deleted
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('DELETE FROM predictions')
            return cursor.rowcount
