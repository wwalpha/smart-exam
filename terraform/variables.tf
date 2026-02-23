# ----------------------------------------------------------------------------------------------
# Project name used for tagging and naming.
# ----------------------------------------------------------------------------------------------
variable "project_name" {
  description = "Project name used for tagging and naming."
  type        = string
  default     = "smartexam"
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
# Deployment environment decided by CI template.
# ----------------------------------------------------------------------------------------------
variable "deploy_environment" {
  description = "Deployment environment (dev or prod), provided by CI template."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["", "dev", "prod"], trimspace(var.deploy_environment))
    error_message = "deploy_environment must be one of: dev, prod."
  }
}

# ----------------------------------------------------------------------------------------------
# Optional custom prefix for Cognito managed login domain.
# ----------------------------------------------------------------------------------------------
variable "cognito_domain_prefix" {
  description = "Optional custom prefix for Cognito managed login domain. If empty, uses <project_name>-<deploy_environment>."
  type        = string
  default     = ""
}

# ----------------------------------------------------------------------------------------------
# Whether to allow Lambda to call Bedrock runtime APIs.
# ----------------------------------------------------------------------------------------------
variable "enable_bedrock" {
  description = "Whether to allow Lambda to call Bedrock runtime APIs."
  type        = bool
  default     = true
}

# ----------------------------------------------------------------------------------------------
# SNS email endpoints for Lambda error alarms.
# ----------------------------------------------------------------------------------------------
variable "alarm_notification_emails" {
  description = "Email addresses to subscribe to the SNS topic used by Lambda error CloudWatch alarms. Each subscription requires manual confirmation."
  type        = list(string)
  default     = []
}
