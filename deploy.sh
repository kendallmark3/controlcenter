#!/usr/bin/env bash
set -euo pipefail
export AWS_PAGER=""

PROFILE=mkendall
REGION=us-east-2
ACCOUNT=728603839411
FUNCTION_NAME=control-center-api
ROLE_NAME=control-center-lambda-role
API_NAME=control-center-api
BUCKET=control-center-frontend-${ACCOUNT}
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

log()  { echo "   $1"; }
step() { echo ""; echo "── $1"; }

echo "═══════════════════════════════════════════════"
echo "  Enterprise Control Center — AWS Deploy"
echo "═══════════════════════════════════════════════"

# ── BACKEND: build Lambda zip ──────────────────────────────────────────────

step "Building Lambda package"
rm -rf /tmp/cc-lambda-dist
mkdir -p /tmp/cc-lambda-dist

log "Installing Python deps for arm64 Linux..."
pip3 install \
  "fastapi==0.104.1" \
  "pydantic==2.5.0" \
  "python-dotenv==1.0.0" \
  "mangum==0.17.0" \
  --platform manylinux2014_aarch64 \
  --implementation cp \
  --python-version 3.11 \
  --only-binary=:all: \
  -t /tmp/cc-lambda-dist \
  --quiet

cp -r "$PROJECT_ROOT/backend/app" /tmp/cc-lambda-dist/
cp -r "$PROJECT_ROOT/data"        /tmp/cc-lambda-dist/

rm -f /tmp/cc-lambda.zip
cd /tmp/cc-lambda-dist && zip -r /tmp/cc-lambda.zip . -q
log "Package: $(du -sh /tmp/cc-lambda.zip | cut -f1)"
cd "$PROJECT_ROOT"

# ── IAM: Lambda execution role ─────────────────────────────────────────────

step "IAM: Lambda execution role"
ROLE_ARN=$(aws iam get-role \
  --role-name "$ROLE_NAME" \
  --profile "$PROFILE" \
  --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -z "$ROLE_ARN" ]; then
  log "Creating role $ROLE_NAME..."
  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document \
      '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    --profile "$PROFILE" \
    --query 'Role.Arn' --output text)
  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
    --profile "$PROFILE"
  log "Role created. Waiting 12s for IAM propagation..."
  sleep 12
else
  log "Role exists: $ROLE_ARN"
fi

# ── Lambda ─────────────────────────────────────────────────────────────────

step "Lambda: deploy function"
if aws lambda get-function \
     --function-name "$FUNCTION_NAME" \
     --profile "$PROFILE" --region "$REGION" &>/dev/null; then

  log "Updating code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb:///tmp/cc-lambda.zip \
    --architectures arm64 \
    --profile "$PROFILE" --region "$REGION" > /dev/null
  aws lambda wait function-updated \
    --function-name "$FUNCTION_NAME" \
    --profile "$PROFILE" --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --handler app.main.handler \
    --environment "Variables={MOCK_MODE=true,LOG_LEVEL=INFO}" \
    --timeout 30 --memory-size 256 \
    --profile "$PROFILE" --region "$REGION" > /dev/null
else
  log "Creating function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime python3.11 \
    --role "$ROLE_ARN" \
    --handler app.main.handler \
    --zip-file fileb:///tmp/cc-lambda.zip \
    --architectures arm64 \
    --environment "Variables={MOCK_MODE=true,LOG_LEVEL=INFO}" \
    --timeout 30 --memory-size 256 \
    --profile "$PROFILE" --region "$REGION" > /dev/null
  log "Waiting for function to be active..."
  aws lambda wait function-active \
    --function-name "$FUNCTION_NAME" \
    --profile "$PROFILE" --region "$REGION"
fi
LAMBDA_ARN="arn:aws:lambda:${REGION}:${ACCOUNT}:function:${FUNCTION_NAME}"
log "Lambda: $LAMBDA_ARN"

# ── API Gateway: HTTP API ──────────────────────────────────────────────────

step "API Gateway: HTTP API"
API_ID=$(aws apigatewayv2 get-apis \
  --profile "$PROFILE" --region "$REGION" \
  --query "Items[?Name=='${API_NAME}'].ApiId | [0]" \
  --output text 2>/dev/null || true)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
  log "Creating API..."
  API_ID=$(aws apigatewayv2 create-api \
    --name "$API_NAME" \
    --protocol-type HTTP \
    --cors-configuration \
      '{"AllowOrigins":["*"],"AllowMethods":["GET","POST","PUT","DELETE","OPTIONS"],"AllowHeaders":["*"]}' \
    --profile "$PROFILE" --region "$REGION" \
    --query 'ApiId' --output text)

  INT_ID=$(aws apigatewayv2 create-integration \
    --api-id "$API_ID" \
    --integration-type AWS_PROXY \
    --integration-uri "$LAMBDA_ARN" \
    --payload-format-version 2.0 \
    --profile "$PROFILE" --region "$REGION" \
    --query 'IntegrationId' --output text)

  aws apigatewayv2 create-route --api-id "$API_ID" \
    --route-key 'ANY /{proxy+}' --target "integrations/$INT_ID" \
    --profile "$PROFILE" --region "$REGION" > /dev/null

  aws apigatewayv2 create-route --api-id "$API_ID" \
    --route-key 'ANY /' --target "integrations/$INT_ID" \
    --profile "$PROFILE" --region "$REGION" > /dev/null

  aws apigatewayv2 create-stage --api-id "$API_ID" \
    --stage-name '$default' --auto-deploy \
    --profile "$PROFILE" --region "$REGION" > /dev/null

  # Allow API Gateway to invoke the Lambda
  aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "api-gw-invoke" \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT}:${API_ID}/*/*" \
    --profile "$PROFILE" --region "$REGION" > /dev/null

  log "API created: $API_ID"
else
  log "API exists: $API_ID"
fi

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com"
log "API URL: $API_URL"

# Quick health check
log "Health check..."
sleep 3
HEALTH=$(curl -s --max-time 10 "${API_URL}/health" 2>/dev/null || echo '{"error":"not yet reachable"}')
log "  $HEALTH"

# ── Frontend: build ────────────────────────────────────────────────────────

step "Frontend: building"
cd "$PROJECT_ROOT/frontend"
VITE_API_URL="$API_URL" npm run build

# ── S3: static website ─────────────────────────────────────────────────────

step "S3: static website"
if ! aws s3api head-bucket --bucket "$BUCKET" --profile "$PROFILE" 2>/dev/null; then
  log "Creating bucket $BUCKET..."
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" \
    --profile "$PROFILE" > /dev/null

  log "Disabling Block Public Access..."
  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration \
      'BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false' \
    --profile "$PROFILE"

  log "Setting public-read bucket policy..."
  aws s3api put-bucket-policy \
    --bucket "$BUCKET" \
    --profile "$PROFILE" \
    --policy "{
      \"Version\":\"2012-10-17\",
      \"Statement\":[{
        \"Sid\":\"PublicRead\",
        \"Effect\":\"Allow\",
        \"Principal\":\"*\",
        \"Action\":\"s3:GetObject\",
        \"Resource\":\"arn:aws:s3:::${BUCKET}/*\"
      }]
    }"

  log "Enabling static website hosting..."
  aws s3api put-bucket-website \
    --bucket "$BUCKET" \
    --profile "$PROFILE" \
    --website-configuration \
      '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'
else
  log "Bucket exists: $BUCKET"
fi

log "Syncing build files..."
# index.html with no-cache; everything else with long cache
aws s3 sync "$PROJECT_ROOT/frontend/dist/" "s3://$BUCKET/" \
  --profile "$PROFILE" --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"
aws s3 cp "$PROJECT_ROOT/frontend/dist/index.html" "s3://$BUCKET/index.html" \
  --profile "$PROFILE" \
  --cache-control "no-cache,no-store,must-revalidate"

FRONTEND_URL="http://${BUCKET}.s3-website.${REGION}.amazonaws.com"

# ── Done ───────────────────────────────────────────────────────────────────

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║               DEPLOYMENT COMPLETE                     ║"
echo "╠═══════════════════════════════════════════════════════╣"
printf "║  API:      %-45s ║\n" "$API_URL"
printf "║  Frontend: %-45s ║\n" "$FRONTEND_URL"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Opening browser..."
open "$FRONTEND_URL"
