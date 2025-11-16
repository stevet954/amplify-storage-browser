#!/bin/bash
# Post-deployment script to configure S3 notifications and Lambda permissions
# Run this after `npx ampx sandbox` or `npx ampx deploy`

set -e

echo "Setting up Lambda triggers and permissions..."

# Get values from amplify_outputs.json
BUCKET_NAME=$(jq -r '.storage.bucket_name' amplify_outputs.json)
REGION=$(jq -r '.storage.aws_region' amplify_outputs.json)

# Get Lambda function name from CloudFormation outputs
STACK_NAME=$(aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'amplify') && contains(StackName, 'sandbox')].StackName" --output text | head -1)

if [ -z "$STACK_NAME" ]; then
  echo "Error: Could not find Amplify sandbox stack"
  exit 1
fi

echo "Found stack: $STACK_NAME"

# Get Lambda function ARN from stack outputs
LAMBDA_ARN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?contains(OutputKey, 'definedFunctions')].OutputValue" --output text | jq -r '.[0]' 2>/dev/null)

if [ -z "$LAMBDA_ARN" ] || [ "$LAMBDA_ARN" == "null" ]; then
  # Try to find it directly
  LAMBDA_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'applymetadatags')].FunctionName" --output text)
  LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.FunctionArn' --output text)
fi

echo "Bucket: $BUCKET_NAME"
echo "Lambda: $LAMBDA_ARN"

# Extract Lambda function name from ARN
LAMBDA_NAME=$(echo "$LAMBDA_ARN" | awk -F: '{print $NF}')

# 1. Add Lambda permission for S3 to invoke it (ignore if already exists)
echo "Adding Lambda invoke permission..."
aws lambda add-permission \
  --function-name "$LAMBDA_NAME" \
  --statement-id AllowS3Invocation \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$BUCKET_NAME" \
  2>/dev/null || echo "Permission already exists (this is OK)"

# 2. Configure S3 bucket notification
echo "Configuring S3 bucket notification..."
aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET_NAME" \
  --notification-configuration "{
    \"LambdaFunctionConfigurations\": [
      {
        \"Id\": \"MetadataTaggingTrigger\",
        \"LambdaFunctionArn\": \"$LAMBDA_ARN\",
        \"Events\": [\"s3:ObjectCreated:*\"]
      }
    ]
  }"

# 3. Get Lambda execution role and add S3 permissions
echo "Adding S3 permissions to Lambda role..."
LAMBDA_ROLE_ARN=$(aws lambda get-function-configuration --function-name "$LAMBDA_NAME" --query 'Role' --output text)
LAMBDA_ROLE_NAME=$(echo "$LAMBDA_ROLE_ARN" | awk -F/ '{print $NF}')

aws iam put-role-policy \
  --role-name "$LAMBDA_ROLE_NAME" \
  --policy-name S3TaggingPolicy \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Effect\": \"Allow\",
        \"Action\": [
          \"s3:GetObject\",
          \"s3:GetObjectTagging\",
          \"s3:PutObjectTagging\",
          \"s3:GetObjectAttributes\"
        ],
        \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
      }
    ]
  }"

echo "✅ Lambda triggers and permissions configured successfully!"
