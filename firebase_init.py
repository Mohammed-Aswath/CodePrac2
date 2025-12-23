"""Firebase and Firestore initialization."""
import firebase_admin
from firebase_admin import credentials, auth, firestore
from config import FIREBASE_CREDENTIALS_PATH, FIRESTORE_PROJECT_ID
import os
import base64
import json
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase App
try:
    creds = None
    
    # Priority 1: Use base64 encoded credentials (Render production)
    firebase_key_base64 = os.getenv('FIREBASE_KEY_BASE64')
    if firebase_key_base64:
        logger.info("Using base64 encoded Firebase credentials from environment")
        try:
            key_data = base64.b64decode(firebase_key_base64)
            creds = credentials.Certificate(json.loads(key_data))
        except Exception as e:
            logger.error(f"Failed to decode base64 Firebase key: {e}")
            raise
    
    # Priority 2: Use file path (local development)
    if not creds:
        if os.path.exists(FIREBASE_CREDENTIALS_PATH):
            logger.info(f"Using Firebase credentials from file: {FIREBASE_CREDENTIALS_PATH}")
            creds = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        else:
            raise FileNotFoundError(
                f"Firebase credentials not found. "
                f"Set FIREBASE_KEY_BASE64 env var or place file at {FIREBASE_CREDENTIALS_PATH}"
            )
    
    firebase_admin.initialize_app(creds, {
        "projectId": FIRESTORE_PROJECT_ID
    })
    logger.info("✓ Firebase initialized successfully")
except Exception as e:
    logger.error(f"✗ Firebase initialization failed: {e}")
    raise

# Get Firestore client
db = firestore.client()

# Get Auth reference
auth_ref = auth


def get_db():
    """Get Firestore database instance."""
    return db


def get_auth():
    """Get Firebase Auth reference."""
    return auth_ref
