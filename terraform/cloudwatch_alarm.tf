# ----------------------------------------------------------------------------------------------
# CloudWatch alarm for API Lambda function errors.
# ----------------------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_api_errors" {
  alarm_name          = "${var.project_name}_lambda_api_errors"
  alarm_description   = "Triggers when the API Lambda reports errors."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api.function_name
  }

  alarm_actions = [aws_sns_topic.lambda_alarms.arn]
}

# ----------------------------------------------------------------------------------------------
# CloudWatch alarm for Bedrock Lambda function errors.
# ----------------------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "lambda_bedrock_errors" {
  alarm_name          = "${var.project_name}_lambda_bedrock_errors"
  alarm_description   = "Triggers when the Bedrock Lambda reports errors."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.bedrock.function_name
  }

  alarm_actions = [aws_sns_topic.lambda_alarms.arn]
}
