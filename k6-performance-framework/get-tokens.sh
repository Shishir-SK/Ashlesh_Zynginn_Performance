#!/bin/bash

# TOKEN REFRESH SCRIPT
# Gets new authentication tokens for performance testing

echo "🔐 GETTING NEW AUTHENTICATION TOKENS..."
echo "=================================="

# Set environment variables
export USER_EMAIL="shishir+dhoni@codezyng.com"
export USER_PASSWORD="Test1234"
export ADMIN_EMAIL="adityashekhar@codezyng.com"
export ADMIN_PASSWORD="test1234"

echo "📧 User Email: $USER_EMAIL"
echo "👤 Admin Email: $ADMIN_EMAIL"
echo ""

# Get user token
echo "🔑 Getting USER token..."
USER_RESPONSE=$(curl -s -X POST "https://staging.authapi.hotelashleshmanipal.com/api/authorize/v2/signin" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USER_EMAIL&password=$USER_PASSWORD&organization_id=a9395930-21bb-4a28-8e48-8bdf71294f62")

USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.access_token // empty')

if [ -n "$USER_TOKEN" ] && [ "$USER_TOKEN" != "null" ]; then
    echo "✅ User token obtained successfully"
    echo "🔑 USER_TOKEN=$USER_TOKEN"
else
    echo "❌ Failed to get user token"
    echo "Response: $USER_RESPONSE"
fi

echo ""

# Get admin token
echo "🔑 Getting ADMIN token..."
ADMIN_RESPONSE=$(curl -s -X POST "https://staging.authapi.hotelashleshmanipal.com/api/authorize/v2/signin" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&organization_id=a9395930-21bb-4a28-8e48-8bdf71294f62")

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.access_token // empty')

if [ -n "$ADMIN_TOKEN" ] && [ "$ADMIN_TOKEN" != "null" ]; then
    echo "✅ Admin token obtained successfully"
    echo "🔑 ADMIN_TOKEN=$ADMIN_TOKEN"
else
    echo "❌ Failed to get admin token"
    echo "Response: $ADMIN_RESPONSE"
fi

echo ""
echo "📋 HOW TO USE THESE TOKENS:"
echo "=================================="
echo ""
echo "Option 1: Export as environment variables"
echo "export USER_TOKEN=\"$USER_TOKEN\""
echo "export ADMIN_TOKEN=\"$ADMIN_TOKEN\""
echo ""
echo "Option 2: Update your test files directly"
echo "Replace the old token in your test files with:"
echo "User Token: $USER_TOKEN"
echo "Admin Token: $ADMIN_TOKEN"
echo ""
echo "Option 3: Run tests with tokens"
echo "USER_TOKEN=\"$USER_TOKEN\" ADMIN_TOKEN=\"$ADMIN_TOKEN\" k6 run your-test.js"
echo ""
echo "🎯 QUICK TEST COMMANDS:"
echo "=================================="
echo ""
echo "# Test payment API with new token:"
echo "USER_TOKEN=\"$USER_TOKEN\" k6 run - << 'EOF'
import http from \"k6/http\";
import { check } from \"k6\";

export let options = { vus: 1, iterations: 5 };

export default function() {
  const response = http.post(\"https://staging.api.hotelashleshmanipal.com/payments/process\", 
    { amount: 1000, currency: \"USD\", paymentMethod: \"credit_card\" }, 
    { headers: { \"Authorization\": \"Bearer $USER_TOKEN\", \"Content-Type\": \"application/json\" } });
  
  check(response, { \"payment works\": r => r.status === 200 });
  console.log(\"Payment Status: \" + response.status);
}
EOF"
echo ""
echo "🎉 TOKENS READY TO USE!"
