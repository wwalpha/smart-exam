# ----------------------------------------------------------------------------------------------
# IAM role for Lambda.
# ----------------------------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# ----------------------------------------------------------------------------------------------
# IAM role for Lambda.
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role" "lambda" {
  name               = "${var.project_name}_lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# ----------------------------------------------------------------------------------------------
# IAM policy for Lambda (logs, DynamoDB, S3, optional Bedrock).
# ----------------------------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["*"]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.materials.arn,
      aws_dynamodb_table.questions.arn,
      aws_dynamodb_table.attempts.arn,
      aws_dynamodb_table.graded_sheets.arn,
      aws_dynamodb_table.words.arn,
      aws_dynamodb_table.word_groups.arn,
      aws_dynamodb_table.word_tests.arn,
      aws_dynamodb_table.word_test_attempts.arn,
      aws_dynamodb_table.review_tests.arn,
      aws_dynamodb_table.review_test_items.arn,
      aws_dynamodb_table.review_locks.arn,
      aws_dynamodb_table.review_attempts.arn,
      aws_dynamodb_table.exam_results.arn,
      "${aws_dynamodb_table.materials.arn}/index/*",
      "${aws_dynamodb_table.questions.arn}/index/*",
      "${aws_dynamodb_table.attempts.arn}/index/*",
      "${aws_dynamodb_table.words.arn}/index/*",
      "${aws_dynamodb_table.word_test_attempts.arn}/index/*",
      "${aws_dynamodb_table.review_tests.arn}/index/*",
      "${aws_dynamodb_table.review_test_items.arn}/index/*",
      "${aws_dynamodb_table.review_locks.arn}/index/*",
      "${aws_dynamodb_table.review_attempts.arn}/index/*",
      "${aws_dynamodb_table.exam_results.arn}/index/*",
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.files.arn,
      "${aws_s3_bucket.files.arn}/*",
    ]
  }
}

# ----------------------------------------------------------------------------------------------
# IAM policy document with optional Bedrock permissions.
# ----------------------------------------------------------------------------------------------
data "aws_iam_policy_document" "lambda_with_bedrock" {
  source_policy_documents = [data.aws_iam_policy_document.lambda.json]

  dynamic "statement" {
    for_each = var.enable_bedrock ? [1] : []
    content {
      effect = "Allow"
      actions = [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock-runtime:InvokeModel",
        "bedrock-runtime:InvokeModelWithResponseStream",
      ]
      resources = ["*"]
    }
  }
}

# ----------------------------------------------------------------------------------------------
# IAM inline policy attachment for Lambda.
# ----------------------------------------------------------------------------------------------
resource "aws_iam_role_policy" "lambda" {
  name   = "${var.project_name}_lambda"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_with_bedrock.json
}
