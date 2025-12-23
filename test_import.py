"""Test if app.py can be imported."""
import traceback

try:
    print("Attempting to import app...")
    from app import app
    print("✓ Success! App imported")
except Exception as e:
    print(f"✗ Error: {e}")
    print("\nFull traceback:")
    traceback.print_exc()