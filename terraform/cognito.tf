# ----------------------------------------------------------------------------------------------
# Cognito user pool for authentication.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool" "auth" {
  name = "${var.project_name}_user_pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

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
  name         = "${var.project_name}_app_client"
  user_pool_id = aws_cognito_user_pool.auth.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  callback_urls                        = [local.cognito_redirect_uri]
  logout_urls                          = [local.frontend_base_url]
  supported_identity_providers         = ["COGNITO"]

  prevent_user_existence_errors = "ENABLED"
}

# ----------------------------------------------------------------------------------------------
# Cognito user pool client for the mobile application.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "mobile" {
  name         = "${var.project_name}_mobile_client"
  user_pool_id = aws_cognito_user_pool.auth.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 365

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "phone", "profile"]
  callback_urls                        = ["myapp://"]
  logout_urls                          = ["myapp://"]
  supported_identity_providers         = ["COGNITO"]

  prevent_user_existence_errors = "ENABLED"
}

# ----------------------------------------------------------------------------------------------
# Cognito managed login domain for frontend.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_pool_domain" "auth" {
  domain                = local.cognito_domain_prefix
  user_pool_id          = aws_cognito_user_pool.auth.id
  managed_login_version = 2
}

# ----------------------------------------------------------------------------------------------
# Cognito user group for administrators.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_group" "admin" {
  name         = "ADMIN"
  user_pool_id = aws_cognito_user_pool.auth.id
  precedence   = 1
}

# ----------------------------------------------------------------------------------------------
# Cognito user group for standard users.
# ----------------------------------------------------------------------------------------------
resource "aws_cognito_user_group" "user" {
  name         = "USER"
  user_pool_id = aws_cognito_user_pool.auth.id
  precedence   = 10
}
