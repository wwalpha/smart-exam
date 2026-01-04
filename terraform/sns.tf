# ----------------------------------------------------------------------------------------------
# SNS topic for Lambda error notifications.
# ----------------------------------------------------------------------------------------------
resource "aws_sns_topic" "lambda_alarms" {
  name = "${var.project_name}_lambda_alarms"
}

# ----------------------------------------------------------------------------------------------
# SNS topic policy to allow CloudWatch Alarms to publish.
# ----------------------------------------------------------------------------------------------
data "aws_iam_policy_document" "sns_lambda_alarms" {
  statement {
    sid    = "AllowCloudWatchAlarmsPublish"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }

    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.lambda_alarms.arn]
  }
}

# ----------------------------------------------------------------------------------------------
# SNS topic policy attachment for Lambda alarm notifications.
# ----------------------------------------------------------------------------------------------
resource "aws_sns_topic_policy" "lambda_alarms" {
  arn    = aws_sns_topic.lambda_alarms.arn
  policy = data.aws_iam_policy_document.sns_lambda_alarms.json
}

# ----------------------------------------------------------------------------------------------
# SNS email subscriptions for Lambda alarm notifications.
# ----------------------------------------------------------------------------------------------
resource "aws_sns_topic_subscription" "lambda_alarm_email" {
  for_each  = toset(var.alarm_notification_emails)
  topic_arn = aws_sns_topic.lambda_alarms.arn
  protocol  = "email"
  endpoint  = each.value
}
