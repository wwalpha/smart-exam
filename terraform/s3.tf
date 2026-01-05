# ----------------------------------------------------------------------------------------------
# S3 bucket for app files (question PDFs, answer sheet PDFs, graded sheet images).
# ----------------------------------------------------------------------------------------------
resource "random_string" "files_bucket_suffix" {
  length  = 6
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# ----------------------------------------------------------------------------------------------
# S3 bucket for app files (question PDFs, answer sheet PDFs, graded sheet images).
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "files" {
  bucket        = "${var.project_name}-files-${random_string.files_bucket_suffix.result}"
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
    allowed_origins = ["http://127.0.0.1:5173", "http://localhost:5173"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
