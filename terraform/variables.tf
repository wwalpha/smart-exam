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

# ----------------------------------------------------------------------------------------------
# Exact pre-registered OAuth callbacks; no guessed URLs or wildcards.
# ----------------------------------------------------------------------------------------------
variable "mcp_callback_urls" {
  description = "Exact pre-registered OAuth callbacks; no guessed URLs or wildcards."
  type        = list(string)
  validation {
    condition     = length(var.mcp_callback_urls) > 0 && alltrue([for url in var.mcp_callback_urls : can(regex("^(https://[^/]+/|http://localhost:[0-9]+/)", url)) && length(regexall("[*#]", url)) == 0])
    error_message = "Provide exact HTTPS or localhost OAuth callback URLs."
  }
}

# ----------------------------------------------------------------------------------------------
# Commit SHA of the MCP artifact built in this Actions run.
# ----------------------------------------------------------------------------------------------
variable "mcp_build_id" {
  description = "Commit SHA of the MCP artifact built in this Actions run."
  type        = string
  validation {
    condition     = can(regex("^[a-f0-9]{40}$", var.mcp_build_id))
    error_message = "mcp_build_id must be the full commit SHA."
  }
}

# ----------------------------------------------------------------------------------------------
# Optional approved Cognito subs; MCP_READERS membership also grants access.
# ----------------------------------------------------------------------------------------------
variable "mcp_allowed_subjects" {
  description = "Optional approved Cognito subs; MCP_READERS membership also grants access."
  type        = list(string)
  default = []
}

# ----------------------------------------------------------------------------------------------
# Explicit browser Origin allowlist. Empty allows authenticated clients without Origin only.
# ----------------------------------------------------------------------------------------------
variable "mcp_allowed_origins" {
  description = "Explicit browser Origin allowlist. Empty allows authenticated clients without Origin only."
  type        = list(string)
  default = []
}
