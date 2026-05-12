#!/bin/bash
# generate-anon-key.sh - Generate a new Supabase anon key for local development
#
# Usage: ./scripts/generate-anon-key.sh
#        ./scripts/generate-anon-key.sh [--env]   # Also update .env file
#
# Note: The generated key expires in 1 hour. Re-run this script to regenerate.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"

CURRENT_IAT=$(date +%s)
CURRENT_EXP=$((CURRENT_IAT + 3600))  # 1 hour expiry

PAYLOAD="{\"iss\":\"supabase\",\"ref\":\"test\",\"role\":\"anon\",\"iat\":${CURRENT_IAT},\"exp\":${CURRENT_EXP}}"

HEADER=$(echo -n '{"alg":"HS256","typ":"JWT"}' | base64 | tr '+/' '-_' | tr -d '=')
PAYLOAD_B64=$(echo -n "$PAYLOAD" | base64 | tr '+/' '-_' | tr -d '=')
SIGNATURE=$(echo -n "${HEADER}.${PAYLOAD_B64}" | openssl dgst -sha256 -hmac "$JWT_SECRET" -binary | base64 | tr '+/' '-_' | tr -d '=')

NEW_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${PAYLOAD_B64}.${SIGNATURE}"

echo "Generated anon key (expires: $(date -r $CURRENT_EXP '+%Y-%m-%d %H:%M:%S'))"
echo "$NEW_KEY"

if [ "$1" = "--env" ]; then
  echo "Updating .env and supabaseClient.ts..."
  # Update .env
  sed -i '' "s/VITE_SUPABASE_ANON_KEY=.*/VITE_SUPABASE_ANON_KEY=$NEW_KEY/" "$SCRIPT_DIR/../.env"
  # Update fallback key in supabaseClient.ts
  ESCAPED_KEY=$(echo "$NEW_KEY" | sed 's/[/&]/\\&/g')
  sed -i '' "s/|| 'eyJ[^']*'/|| '$ESCAPED_KEY'/" "$SCRIPT_DIR/../src/services/supabaseClient.ts"
  echo "Done. Restart the Vite dev server to pick up the new key."
fi
