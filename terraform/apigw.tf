# ----------------------------------------------------------------------------------------------
# API Gateway HTTP API.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http" {
  name          = local.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["authorization", "content-type", "x-amz-date", "x-amz-security-token", "x-api-key", "x-requested-with"]
    max_age       = 3600
  }
}

# ----------------------------------------------------------------------------------------------
# API Gateway -> Lambda integration.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# ----------------------------------------------------------------------------------------------
# API Gateway Cognito JWT authorizer (enabled outside dev workspace).
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_authorizer" "cognito" {
  count = local.enable_api_auth ? 1 : 0

  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  name             = "cognito-jwt-authorizer"
  identity_sources = ["$request.header.Authorization"]

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.auth.id]
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${aws_cognito_user_pool.auth.id}"
  }
}

# ----------------------------------------------------------------------------------------------
# API Gateway default route.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = local.enable_api_auth ? "JWT" : "NONE"
  authorizer_id      = local.enable_api_auth ? aws_apigatewayv2_authorizer.cognito[0].id : null
}

# ----------------------------------------------------------------------------------------------
# API Gateway health check route (no auth).
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "health" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /v1/health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "NONE"
}

# ----------------------------------------------------------------------------------------------
# API Gateway default stage.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

# ----------------------------------------------------------------------------------------------
# API Gateway custom domain (prod only).
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_domain_name" "api" {
  count = local.deploy_environment == "prod" ? 1 : 0

  domain_name = "api.smartexam.aws-handson.com"

  domain_name_configuration {
    certificate_arn = data.aws_acm_certificate.api_custom_domain[0].arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

# ----------------------------------------------------------------------------------------------
# API Gateway API mapping for custom domain (prod only).
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_api_mapping" "api" {
  count = local.deploy_environment == "prod" ? 1 : 0

  api_id      = aws_apigatewayv2_api.http.id
  domain_name = aws_apigatewayv2_domain_name.api[0].domain_name
  stage       = aws_apigatewayv2_stage.default.id
}

# ----------------------------------------------------------------------------------------------
# Lambda invoke permission for API Gateway.
# ----------------------------------------------------------------------------------------------
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
