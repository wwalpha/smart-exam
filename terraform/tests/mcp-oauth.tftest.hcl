mock_provider "aws" {}
mock_provider "archive" {}
mock_provider "random" {}

variables {
  mcp_build_id = "0000000000000000000000000000000000000000"
}

run "bootstrap_without_callback" {
  command = plan
  plan_options {
    target = [aws_cognito_user_pool_client.mcp]
  }
  assert {
    condition = (
      !aws_cognito_user_pool_client.mcp.allowed_oauth_flows_user_pool_client &&
      length(aws_cognito_user_pool_client.mcp.callback_urls) == 0 &&
      length(aws_cognito_user_pool_client.mcp.allowed_oauth_flows) == 0 &&
      length(aws_cognito_user_pool_client.mcp.allowed_oauth_scopes) == 0 &&
      aws_cognito_user_pool_client.mcp.explicit_auth_flows == toset(["ALLOW_REFRESH_TOKEN_AUTH"])
    )
    error_message = "Initial deployment must disable OAuth without enabling password authentication."
  }
}

run "production_bootstrap_without_callback" {
  command = plan
  variables {
    deploy_environment = "prod"
    region             = "us-east-1"
  }
  plan_options {
    target = [aws_cognito_user_pool_client.mcp]
  }
  assert {
    condition = (
      !aws_cognito_user_pool_client.mcp.allowed_oauth_flows_user_pool_client &&
      length(aws_cognito_user_pool_client.mcp.callback_urls) == 0 &&
      length(aws_cognito_user_pool_client.mcp.allowed_oauth_flows) == 0 &&
      length(aws_cognito_user_pool_client.mcp.allowed_oauth_scopes) == 0 &&
      aws_cognito_user_pool_client.mcp.explicit_auth_flows == toset(["ALLOW_REFRESH_TOKEN_AUTH"])
    )
    error_message = "Initial deployment must disable OAuth without enabling password authentication."
  }
}

run "enable_with_exact_callback" {
  command = plan
  plan_options {
    target = [aws_cognito_user_pool_client.mcp]
  }
  variables {
    mcp_callback_urls = ["http://localhost:5555/callback/test-client"]
  }
  assert {
    condition = (
      aws_cognito_user_pool_client.mcp.allowed_oauth_flows_user_pool_client &&
      aws_cognito_user_pool_client.mcp.callback_urls == toset(var.mcp_callback_urls) &&
      aws_cognito_user_pool_client.mcp.allowed_oauth_flows == toset(["code"]) &&
      aws_cognito_user_pool_client.mcp.allowed_oauth_scopes == toset(["openid", "smart-exam-mcp/read"])
    )
    error_message = "Registered callbacks must enable only the existing authorization code flow and read scope."
  }
}

run "reject_wildcard_callback" {
  command = plan
  plan_options {
    target = [aws_cognito_user_pool_client.mcp]
  }
  variables {
    mcp_callback_urls = ["http://localhost:5555/callback/*"]
  }
  expect_failures = [var.mcp_callback_urls]
}
