from app.core.security import get_password_hash
import sys

try:
    p = "test_password_123"
    h = get_password_hash(p)
    print(f"Hash successful: {h[:20]}...")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
