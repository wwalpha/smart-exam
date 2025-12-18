# ----------------------------------------------------------------------------------------------
# Project name used for tagging and naming.
# ----------------------------------------------------------------------------------------------
variable "project_name" {
  description = "Project name used for tagging and naming."
  type        = string
  default     = "smartexam"
}

# ----------------------------------------------------------------------------------------------
# Environment name (e.g. dev, stg, prod).
# ----------------------------------------------------------------------------------------------
variable "env" {
  description = "Environment name (e.g. dev, stg, prod)."
  type        = string
  default     = "dev"
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
# Whether to allow Lambda to call Bedrock runtime APIs.
# ----------------------------------------------------------------------------------------------
variable "enable_bedrock" {
  description = "Whether to allow Lambda to call Bedrock runtime APIs."
  type        = bool
  default     = true
}
