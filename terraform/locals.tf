# ----------------------------------------------------------------------------------------------
# Fixed names for API Gateway and Lambda.
# ----------------------------------------------------------------------------------------------
locals {
  lambda_function_name = "${var.project_name}_api"
  api_name             = "${var.project_name}_http_api"
  suffix               = random_string.files_bucket_suffix.result
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
