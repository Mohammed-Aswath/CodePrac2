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
    if not firebase_admin._apps:
        # Try to use base64 encoded credentials (Render/Production)
        firebase_key_base64 = os.getenv('FIREBASE_KEY_BASE64')
        if firebase_key_base64:
            key_data = base64.b64decode(firebase_key_base64)
            creds = credentials.Certificate(json.loads(key_data))
            logger.info("Using base64 encoded Firebase credentials")
        else:
            # Fall back to file path (local development)
            creds = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            logger.info("Using Firebase credentials file")
        
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
