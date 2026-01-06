# ----------------------------------------------------------------------------------------------
# S3 bucket name for application files.
# ----------------------------------------------------------------------------------------------
output "files_bucket_name" {
  description = "S3 bucket name for application files."
  value       = aws_s3_bucket.files.bucket
}

# ----------------------------------------------------------------------------------------------
# API Gateway HTTP API endpoint.
# ----------------------------------------------------------------------------------------------
output "http_api_endpoint" {
  description = "API Gateway HTTP API endpoint."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

# ----------------------------------------------------------------------------------------------
# All DynamoDB table names created for the app.
# ----------------------------------------------------------------------------------------------
output "dynamodb_table_names" {
  description = "All DynamoDB table names created for the app."
  value = {
    materials          = aws_dynamodb_table.materials.name
    questions          = aws_dynamodb_table.questions.name
    attempts           = aws_dynamodb_table.attempts.name
    graded_sheets      = aws_dynamodb_table.graded_sheets.name
    words              = aws_dynamodb_table.words.name
    word_tests         = aws_dynamodb_table.word_tests.name
    word_test_attempts = aws_dynamodb_table.word_test_attempts.name
    review_tests       = aws_dynamodb_table.review_tests.name
    review_test_items  = aws_dynamodb_table.review_test_items.name
    review_locks       = aws_dynamodb_table.review_locks.name
    review_attempts    = aws_dynamodb_table.review_attempts.name
  }
}

# ----------------------------------------------------------------------------------------------
# Cognito user pool id.
# ----------------------------------------------------------------------------------------------
output "cognito_user_pool_id" {
  description = "Cognito user pool id."
  value       = aws_cognito_user_pool.auth.id
}

# ----------------------------------------------------------------------------------------------
# Cognito user pool app client id.
# ----------------------------------------------------------------------------------------------
output "cognito_user_pool_client_id" {
  description = "Cognito user pool app client id."
  value       = aws_cognito_user_pool_client.auth.id
}

# ----------------------------------------------------------------------------------------------
# Frontend S3 bucket name.
# ----------------------------------------------------------------------------------------------
output "frontend_bucket_name" {
  description = "Frontend S3 bucket name."
  value       = aws_s3_bucket.frontend.bucket
}

# ----------------------------------------------------------------------------------------------
# CloudFront Distribution ID.
# ----------------------------------------------------------------------------------------------
output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID."
  value       = aws_cloudfront_distribution.frontend.id
}

# ----------------------------------------------------------------------------------------------
# Lambda function name for API.
# ----------------------------------------------------------------------------------------------
output "lambda_function_name" {
  description = "Lambda function name for API."
  value       = aws_lambda_function.api.function_name
}

# ----------------------------------------------------------------------------------------------
# Lambda function name for Bedrock.
# ----------------------------------------------------------------------------------------------
output "bedrock_function_name" {
  description = "Lambda function name for Bedrock."
  value       = aws_lambda_function.bedrock.function_name
}

# ----------------------------------------------------------------------------------------------
# SNS topic ARN for Lambda error alarms.
# ----------------------------------------------------------------------------------------------
output "lambda_alarm_sns_topic_arn" {
  description = "SNS topic ARN used by Lambda error CloudWatch alarms."
  value       = aws_sns_topic.lambda_alarms.arn
}
