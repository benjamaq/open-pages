#!/bin/bash

# Emma Heatmap Fix - Quick Run Script
# This script runs all the fixes in the correct order

echo "🔧 Emma Heatmap Fix - Starting..."
echo ""

# Check if Supabase connection string is set
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "⚠️  Warning: SUPABASE_DB_URL environment variable not set"
    echo "Please run this script in Supabase SQL Editor instead"
    echo ""
    echo "Steps:"
    echo "1. Go to your Supabase project → SQL Editor"
    echo "2. Copy and paste seed-emma-complete-fixed.sql"
    echo "3. Run the query"
    echo "4. Copy and paste verify-emma-complete.sql"
    echo "5. Run the query to verify"
    echo ""
    echo "Then restart your dev server:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "📊 Step 1: Running Emma data seed script..."
psql "$SUPABASE_DB_URL" -f seed-emma-complete-fixed.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed Emma data"
    exit 1
fi

echo ""
echo "✅ Step 1 complete"
echo ""

echo "🔍 Step 2: Verifying Emma data..."
psql "$SUPABASE_DB_URL" -f verify-emma-complete.sql

if [ $? -ne 0 ]; then
    echo "❌ Failed to verify Emma data"
    exit 1
fi

echo ""
echo "✅ Step 2 complete"
echo ""

echo "=========================================="
echo "✅ Database fixes complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Restart your development server:"
echo "   npm run dev"
echo ""
echo "2. Visit Emma's profile:"
echo "   http://localhost:3000/biostackr/emma-chronic-pain-journey"
echo ""
echo "3. Click the Heatmap button (calendar icon)"
echo ""
echo "4. Verify you see:"
echo "   - September 1-24: Red/Orange colors"
echo "   - September 25-29: Yellow colors"  
echo "   - September 30 - October 9: Green colors"
echo ""
echo "=========================================="

