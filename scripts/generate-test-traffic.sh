#!/bin/bash
# Generates test traffic to api.cooler.dev using the provided API key

# Generate random product data
PRODUCT_PRICE=$((RANDOM % 1000 + 10))
TIMESTAMP=$(date +%s)
UUID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)-$(shuf -i 1000-9999 -n 1)")
PRODUCT_NAME="Test Product $TIMESTAMP"

# Array of sample product descriptions
DESCRIPTIONS=(
    "Automated test traffic - Electronics"
    "Test product for monitoring - Clothing"
    "Sample item for API testing - Home & Garden"
    "Mock product data - Sports & Outdoors"
    "Test traffic generation - Books"
    "Monitoring test item - Automotive"
    "API test product - Health & Beauty"
)

# Array of sample postal codes
POSTAL_CODES=("02062" "10001" "90210" "60601" "30309" "98101" "02101")

# Select random description and postal code
DESCRIPTION=${DESCRIPTIONS[$RANDOM % ${#DESCRIPTIONS[@]}]}
POSTAL_CODE=${POSTAL_CODES[$RANDOM % ${#POSTAL_CODES[@]}]}

# Log the request
echo "$(date): Generating test traffic - Product: $PRODUCT_NAME, Price: $PRODUCT_PRICE" >> /Users/charlescrystle/Projects/cooler-admin/logs/test-traffic.log

# Make the API request
curl -X 'POST' \
  'https://api.cooler.dev/v2/footprint/products' \
  -H 'accept: application/json' \
  -H 'COOLER-API-KEY: cooler_live_3205eb58-3905-4941-8278-521b912abc8e' \
  -H 'Content-Type: application/json' \
  -d "{
  \"items\": [
    {
      \"productPrice\": $PRODUCT_PRICE,
      \"productName\": \"$PRODUCT_NAME\",
      \"productDescription\": \"$DESCRIPTION\",
      \"postalCode\": \"$POSTAL_CODE\",
      \"newProduct\": true,
      \"externalId\": \"$UUID\"
    }
  ]
}" \
  -w "\nResponse Time: %{time_total}s\nHTTP Status: %{http_code}\n" \
  -s >> /Users/charlescrystle/Projects/cooler-admin/logs/test-traffic.log 2>&1

echo "---" >> /Users/charlescrystle/Projects/cooler-admin/logs/test-traffic.log
