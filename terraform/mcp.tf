locals {
  mcp_endpoint = "${local.deploy_environment == "prod" ? "https://api.smartexam.aws-handson.com" : aws_apigatewayv2_api.http.api_endpoint}/mcp/v1"
  mcp_issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.auth.id}"
  mcp_tables = [
    aws_dynamodb_table.materials.arn,
    aws_dynamodb_table.material_questions.arn,
    aws_dynamodb_table.kanji.arn,
    aws_dynamodb_table.exam.arn,
    aws_dynamodb_table.exam_details.arn,
    aws_dynamodb_table.exam_candidates.arn,
    aws_dynamodb_table.exam_histories.arn,
  ]
}

# ----------------------------------------------------------------------------------------------
# MCP mcp_reference.
# ----------------------------------------------------------------------------------------------
resource "random_password" "mcp_reference" {
  length  = 48
  special = false
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_resource_server" "mcp" {
  identifier   = "smart-exam-mcp"
  name         = "Smart Exam read-only MCP"
  user_pool_id = aws_cognito_user_pool.auth.id
  scope {
    scope_name        = "read"
    scope_description = "Read existing learning records and PDFs"
  }
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "mcp" {
  name                                 = "${var.project_name}_mcp_client"
  user_pool_id                         = aws_cognito_user_pool.auth.id
  generate_secret                      = false
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "${aws_cognito_resource_server.mcp.identifier}/read"]
  callback_urls                        = var.mcp_callback_urls
  supported_identity_providers         = ["COGNITO"]
  explicit_auth_flows                   = ["ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors         = "ENABLED"
  access_token_validity                 = 15
  id_token_validity                     = 15
  refresh_token_validity                = 7
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }
}

# ----------------------------------------------------------------------------------------------
# MCP mcp_readers.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_group" "mcp_readers" {
  name         = "MCP_READERS"
  user_pool_id = aws_cognito_user_pool.auth.id
  description  = "Explicit permission to read Smart Exam through MCP"
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role" "mcp" {
  name = "${var.project_name}_mcp"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy" "mcp" {
  role = aws_iam_role.mcp.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = concat(local.mcp_tables, [for arn in local.mcp_tables : "${arn}/index/*"])
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:GetObjectVersion"]
        Resource = ["${aws_s3_bucket.files.arn}/materials/*", "${aws_s3_bucket.files.arn}/exams/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [aws_s3_bucket.files.arn]
        Condition = { StringLike = { "s3:prefix" = ["materials/*", "exams/*"] } }
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = ["${aws_cloudwatch_log_group.mcp.arn}:*"]
      },
      {
        Effect   = "Deny"
        Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:BatchWriteItem", "dynamodb:TransactWriteItems", "s3:PutObject", "s3:DeleteObject", "s3:DeleteObjectVersion", "bedrock:*", "lambda:InvokeFunction"]
        Resource = ["*"]
      }
    ]
  })
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "mcp" {
  name              = "/aws/lambda/${var.project_name}_mcp"
  retention_in_days = 30
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_lambda_function" "mcp" {
  function_name = "${var.project_name}_mcp"
  role          = aws_iam_role.mcp.arn
  runtime       = "nodejs22.x"
  handler       = "mcp.handler"
  filename      = "${path.module}/../backend/mcp.zip"
  timeout       = 25
  memory_size   = 512
  reserved_concurrent_executions = 2
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
  environment {
    variables = {
      MCP_ENVIRONMENT          = local.deploy_environment
      MCP_BUILD_ID             = var.mcp_build_id
      MCP_ENDPOINT             = local.mcp_endpoint
      MCP_ISSUER               = local.mcp_issuer
      MCP_CLIENT_ID            = aws_cognito_user_pool_client.mcp.id
      MCP_REFERENCE_SECRET     = random_password.mcp_reference.result
      MCP_ALLOWED_SUBJECTS     = jsonencode(var.mcp_allowed_subjects)
      MCP_ALLOWED_ORIGINS      = jsonencode(var.mcp_allowed_origins)
      FILES_BUCKET_NAME        = aws_s3_bucket.files.bucket
      TABLE_MATERIALS          = aws_dynamodb_table.materials.name
      TABLE_MATERIAL_QUESTIONS = aws_dynamodb_table.material_questions.name
      TABLE_KANJI              = aws_dynamodb_table.kanji.name
      TABLE_EXAM_CANDIDATES    = aws_dynamodb_table.exam_candidates.name
      TABLE_EXAM_HISTORIES     = aws_dynamodb_table.exam_histories.name
      TABLE_EXAMS              = aws_dynamodb_table.exam.name
      TABLE_EXAM_DETAILS       = aws_dynamodb_table.exam_details.name
    }
  }
  depends_on = [aws_cloudwatch_log_group.mcp, aws_iam_role_policy.mcp]
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_authorizer" "mcp" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  name             = "mcp-jwt-authorizer"
  identity_sources = ["$request.header.Authorization"]
  jwt_configuration {
    audience = [local.mcp_endpoint]
    issuer   = local.mcp_issuer
  }
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "mcp" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.mcp.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = 29000
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "mcp" {
  api_id               = aws_apigatewayv2_api.http.id
  route_key            = "POST /mcp/v1"
  target               = "integrations/${aws_apigatewayv2_integration.mcp.id}"
  authorization_type   = "JWT"
  authorizer_id        = aws_apigatewayv2_authorizer.mcp.id
  authorization_scopes = ["smart-exam-mcp/read"]
}

# ----------------------------------------------------------------------------------------------
# MCP mcp_public.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "mcp_public" {
  for_each = toset(["GET /.well-known/oauth-protected-resource/mcp/v1", "GET /mcp/v1", "DELETE /mcp/v1"])
  api_id             = aws_apigatewayv2_api.http.id
  route_key          = each.value
  target             = "integrations/${aws_apigatewayv2_integration.mcp.id}"
  authorization_type = "NONE"
}

# ----------------------------------------------------------------------------------------------
# MCP mcp.
# ----------------------------------------------------------------------------------------------
resource "aws_lambda_permission" "mcp" {
  statement_id  = "AllowMcpApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.mcp.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

# ----------------------------------------------------------------------------------------------
# MCP mcp_errors.
# ----------------------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "mcp_errors" {
  alarm_name          = "${var.project_name}_mcp_errors"
  namespace           = "AWS/Lambda"
  metric_name         = "Errors"
  dimensions          = { FunctionName = aws_lambda_function.mcp.function_name }
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.lambda_alarms.arn]
}
