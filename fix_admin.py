#!/usr/bin/env python
"""Fix admin.py by adding @require_auth decorators and replacing admin_id with uid."""

import re

# Read the file
with open('routes/admin.py', 'r') as f:
    content = f.read()

# Replace all admin_id references with uid
content = content.replace('request.user.get("admin_id")', 'request.user.get("uid")')

# Fix all route functions - add @require_auth and OPTIONS handling
# Pattern: @admin_bp.route(...) followed by def function_name():
pattern = r'(@admin_bp\.route\([^)]+\))\ndef (\w+)\(\):'
replacement = r'\1\n@require_auth(allowed_roles=["admin"])\ndef \2():'

content = re.sub(pattern, replacement, content)

# Add OPTIONS check at start of each function
# Find all function bodies and add OPTIONS check after opening
pattern = r'(def \w+\(\):\n    """[^"]*""")\n'
replacement = r'\1\n    if request.method == "OPTIONS":\n        return "", 200\n'

content = re.sub(pattern, replacement, content)

# Write back
with open('routes/admin.py', 'w') as f:
    f.write(content)

print("✓ admin.py fixed!")
print("✓ Added @require_auth decorators to all endpoints")
print("✓ Replaced admin_id with uid")
print("✓ Added OPTIONS method handling")
