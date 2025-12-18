# ----------------------------------------------------------------------------------------------
# Project name used for tagging and naming.
# ----------------------------------------------------------------------------------------------
variable "project_name" {
  description = "Project name used for tagging and naming."
  type        = string
}

# ----------------------------------------------------------------------------------------------
# Environment name (e.g. dev, stg, prod).
# ----------------------------------------------------------------------------------------------
variable "environment" {
  description = "Environment name (e.g. dev, stg, prod)."
  type        = string
}

# ----------------------------------------------------------------------------------------------
# AWS region.
# ----------------------------------------------------------------------------------------------
variable "region" {
  description = "AWS region."
  type        = string
  default     = "ap-northeast-1"
}

# ----------------------------------------------------------------------------------------------
# Lambda function name for backend API.
# ----------------------------------------------------------------------------------------------
variable "lambda_function_name" {
  description = "Lambda function name for backend API."
  type        = string
}

# ----------------------------------------------------------------------------------------------
# API Gateway HTTP API name.
# ----------------------------------------------------------------------------------------------
variable "api_name" {
  description = "API Gateway HTTP API name."
  type        = string
}

# ----------------------------------------------------------------------------------------------
# Whether to allow Lambda to call Bedrock runtime APIs.
# ----------------------------------------------------------------------------------------------
variable "enable_bedrock" {
  description = "Whether to allow Lambda to call Bedrock runtime APIs."
  type        = bool
  default     = true
}
