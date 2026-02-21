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
      "dynamodb:BatchWriteItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      aws_dynamodb_table.materials.arn,
      aws_dynamodb_table.material_questions.arn,
      aws_dynamodb_table.kanji.arn,
      aws_dynamodb_table.exam_candidates.arn,
      aws_dynamodb_table.exam_histories.arn,
      aws_dynamodb_table.exam.arn,
      aws_dynamodb_table.exam_details.arn,
      "${aws_dynamodb_table.materials.arn}/index/*",
      "${aws_dynamodb_table.material_questions.arn}/index/*",
      "${aws_dynamodb_table.kanji.arn}/index/*",
      "${aws_dynamodb_table.exam_candidates.arn}/index/*",
      "${aws_dynamodb_table.exam_histories.arn}/index/*",
      "${aws_dynamodb_table.exam.arn}/index/*",
      "${aws_dynamodb_table.exam_details.arn}/index/*",
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

  dynamic "statement" {
    for_each = var.enable_bedrock ? [1] : []
    content {
      effect = "Allow"
      actions = [
        "aws-marketplace:ViewSubscriptions",
        "aws-marketplace:Subscribe",
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
