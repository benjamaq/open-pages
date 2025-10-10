#!/bin/bash

# Script to seed demo account for Emma (Chronic Pain)
# This creates a realistic demo account with 90 days of data

echo "🌱 Seeding demo account: Emma (Chronic Pain Management)"
echo "================================================"
echo ""
echo "This will create:"
echo "  ✓ Profile: emma-chronic-pain-journey"
echo "  ✓ 13 stack items (supplements, meds, protocols, movement)"
echo "  ✓ 90 days of realistic daily entries"
echo "  ✓ 4 followers with profiles"
echo "  ✓ Recent completed items"
echo ""
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

# Get Supabase credentials from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check if we have the necessary credentials
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "📡 Connecting to Supabase..."
echo "URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Extract project ref from URL (format: https://xxxxx.supabase.co)
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')

echo "🚀 Running SQL script..."
echo ""

# Use psql if available, otherwise provide instructions
if command -v psql &> /dev/null; then
  # Extract database connection details
  DB_HOST="${PROJECT_REF}.supabase.co"
  DB_NAME="postgres"
  DB_USER="postgres"
  
  # Run the SQL file
  PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
    -h "$DB_HOST" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f seed-demo-chronic-pain.sql
  
  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Demo account created successfully!"
    echo ""
    echo "🔗 View the profile at:"
    echo "   https://www.biostackr.io/u/emma-chronic-pain-journey"
    echo ""
    echo "📊 Account includes:"
    echo "   • 90 days of realistic pain tracking data"
    echo "   • Authentic journal entries"
    echo "   • Complete supplement & protocol stack"
    echo "   • 4 followers"
    echo ""
  else
    echo ""
    echo "❌ Error running SQL script"
    exit 1
  fi
else
  echo "⚠️  psql not found. Please run the SQL manually:"
  echo ""
  echo "1. Go to your Supabase dashboard"
  echo "2. Navigate to SQL Editor"
  echo "3. Copy and paste the contents of: seed-demo-chronic-pain.sql"
  echo "4. Run the query"
  echo ""
  echo "Or install psql and run this script again."
fi
