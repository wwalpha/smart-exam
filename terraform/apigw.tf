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
# API Gateway default route.
# ----------------------------------------------------------------------------------------------
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"

  authorization_type = "NONE"
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
# Lambda invoke permission for API Gateway.
# ----------------------------------------------------------------------------------------------
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
