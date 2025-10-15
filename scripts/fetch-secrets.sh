#!/bin/bash
#
# Fetches secrets from Google Secret Manager and creates a .env.gcp file.
#
# Prerequisites:
# 1. Google Cloud SDK (gcloud) installed and authenticated.
#    - Run 'gcloud auth login' and 'gcloud config set project [YOUR_PROJECT_ID]'
# 2. jq (https://stedolan.github.io/jq/) installed for JSON parsing.
#    - On macOS: brew install jq
#    - On Windows (with Chocolatey): choco install jq
#    - On Debian/Ubuntu: sudo apt-get install jq

set -e

# --- Configuration ---
# List of secrets to fetch from Google Secret Manager.
# Add or remove secret names as needed.
SECRETS=(
  "AUTH_SECRET"
  "DATABASE_URL"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "SENDGRID_API_KEY"
)

# Output environment file
OUTPUT_FILE=".env.gcp"

# --- Pre-flight Checks ---
# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: Google Cloud SDK (gcloud) is not installed. Please install it to continue."
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed. Please install it to continue."
    exit 1
fi

# Get Project ID from gcloud config
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Google Cloud project is configured. Please run 'gcloud config set project [YOUR_PROJECT_ID]'."
    exit 1
fi

echo "✅ Prerequisites met. Using project: $PROJECT_ID"

# --- Main Logic ---
# Clear the output file if it exists
> "$OUTPUT_FILE"

echo "🔐 Fetching secrets for project '$PROJECT_ID'..."

for SECRET_NAME in "${SECRETS[@]}"; do
  echo "   - Fetching '$SECRET_NAME'..."
  
  # Fetch the latest version of the secret
  SECRET_VALUE=$(gcloud secrets versions access latest --secret="$SECRET_NAME" --project="$PROJECT_ID" 2>/dev/null)
  
  if [ -z "$SECRET_VALUE" ]; then
    echo "   ⚠️  Warning: Secret '$SECRET_NAME' not found or is empty. It will not be added to the .env file."
  else
    # Append to the output file in KEY="VALUE" format
    # This handles multi-line secrets by ensuring the value is properly quoted.
    echo "$SECRET_NAME=\"$SECRET_VALUE\"" >> "$OUTPUT_FILE"
  fi
done

echo ""
echo "✅ Successfully created '$OUTPUT_FILE' with the fetched secrets."
echo "👉 Next steps: You can now source this file or use a tool like 'dotenv' to load it for local development.
","message":"Create fetch-secrets.sh script to fetch secrets from Google Secret Manager","owner":"Shuffle-and-Sync","path":"scripts/fetch-secrets.sh","repo":"reimagined-guacamole"}