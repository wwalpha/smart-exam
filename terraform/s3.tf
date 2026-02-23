# ----------------------------------------------------------------------------------------------
# S3 bucket for app files (question PDFs, answer sheet PDFs, graded sheet images).
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "files" {
  bucket        = "${var.project_name}-files-${local.suffix}"
  force_destroy = true
}

# ----------------------------------------------------------------------------------------------
# Block all public access to S3 bucket.
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket_public_access_block" "files" {
  bucket = aws_s3_bucket.files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------------------------------------------------------------
# Enable bucket encryption.
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket_server_side_encryption_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ----------------------------------------------------------------------------------------------
# CORS configuration for browser access (presigned PUT uploads, reads).
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket_cors_configuration" "files" {
  bucket = aws_s3_bucket.files.id

  cors_rule {
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = [
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "https://*.cloudfront.net",
      "https://${aws_cloudfront_distribution.frontend.domain_name}",
      "https://smartexam.aws-handson.com",
      "https://www.smartexam.aws-handson.com",
    ]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# ----------------------------------------------------------------------------------------------
# frontend S3 bucket for static hosting (CloudFront distribution).
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-${local.suffix}"
  force_destroy = true
}

# ----------------------------------------------------------------------------------------------
# Block all public access to S3 bucket.
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ----------------------------------------------------------------------------------------------
# Bucket policy to allow CloudFront access to frontend S3 bucket.
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_s3_policy.json
}

data "aws_iam_policy_document" "frontend_s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}
