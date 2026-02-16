#!/usr/bin/env bash
# SEC-M1: CI check to detect service_role key usage in src/ outside admin-designated files.
# Exits non-zero if any violations are found.

set -euo pipefail

# Admin-designated files that are allowed to reference service_role
ALLOWED_FILES=(
  "src/lib/supabase/admin.ts"
)

# Build a grep exclude pattern for allowed files
EXCLUDE_ARGS=()
for f in "${ALLOWED_FILES[@]}"; do
  EXCLUDE_ARGS+=(--exclude="$(basename "$f")")
done

# Search for service_role references in src/
MATCHES=$(grep -rn "service_role" src/ "${EXCLUDE_ARGS[@]}" 2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "ERROR: service_role key usage detected outside admin-designated files:"
  echo ""
  echo "$MATCHES"
  echo ""
  echo "Allowed files: ${ALLOWED_FILES[*]}"
  echo "Move service_role usage to an admin-designated file or remove it."
  exit 1
fi

echo "OK: No service_role usage found outside admin-designated files."
exit 0
