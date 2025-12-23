"""Firebase and Firestore initialization."""
import firebase_admin
from firebase_admin import credentials, auth, firestore
from config import FIREBASE_CREDENTIALS_PATH, FIRESTORE_PROJECT_ID
import os

# Initialize Firebase App
if not firebase_admin.get_app() if firebase_admin._apps else True:
    try:
        creds = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(creds, {
            "projectId": FIRESTORE_PROJECT_ID
        })
    except Exception as e:
        print(f"Firebase initialization error: {e}")
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
