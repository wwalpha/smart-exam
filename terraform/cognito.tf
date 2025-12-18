# ----------------------------------------------------------------------------------------------
# Cognito user pool for authentication.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool" "auth" {
  name = "${var.project_name}_${var.env}_user_pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }
}

# ----------------------------------------------------------------------------------------------
# Cognito user pool client for frontend applications.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "auth" {
  name         = "${var.project_name}_${var.env}_app_client"
  user_pool_id = aws_cognito_user_pool.auth.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"
}
