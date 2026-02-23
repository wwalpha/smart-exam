# ----------------------------------------------------------------------------------------------
# Fixed names for API Gateway and Lambda.
# ----------------------------------------------------------------------------------------------
locals {
  lambda_function_name  = "${var.project_name}_api"
  api_name              = "${var.project_name}_http_api"
  suffix                = random_string.files_bucket_suffix.result
  is_dev_environment    = var.deploy_environment == "dev"
  enable_api_auth       = var.deploy_environment == "prod"
  frontend_base_url     = var.deploy_environment == "prod" ? "https://www.smartexam.aws-handson.com" : "http://localhost:5173"
  cognito_domain_prefix = "${var.project_name}-${var.deploy_environment}"
  cognito_redirect_uri  = "${local.frontend_base_url}/auth/callback"
}

# ----------------------------------------------------------------------------------------------
# S3 bucket for app files (question PDFs, answer sheet PDFs, graded sheet images).
# ----------------------------------------------------------------------------------------------
resource "random_string" "files_bucket_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}
