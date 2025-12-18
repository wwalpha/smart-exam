# ----------------------------------------------------------------------------------------------
# S3 bucket for app files (question PDFs, answer sheet PDFs, graded sheet images).
# ----------------------------------------------------------------------------------------------
resource "aws_s3_bucket" "files" {
  bucket = "${var.project_name}-${var.environment}-files"
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
