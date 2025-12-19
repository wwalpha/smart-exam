# ----------------------------------------------------------------------------------------------
# Fixed names for API Gateway and Lambda.
# ----------------------------------------------------------------------------------------------
locals {
  lambda_function_name  = "${var.project_name}_${var.env}_api"
  bedrock_function_name = "${var.project_name}_${var.env}_bedrock"
  api_name              = "${var.project_name}_${var.env}_http_api"
}
