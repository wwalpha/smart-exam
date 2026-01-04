# ----------------------------------------------------------------------------------------------
# Fixed names for API Gateway and Lambda.
# ----------------------------------------------------------------------------------------------
locals {
  lambda_function_name  = "${var.project_name}_api"
  bedrock_function_name = "${var.project_name}_bedrock"
  api_name              = "${var.project_name}_http_api"
}
