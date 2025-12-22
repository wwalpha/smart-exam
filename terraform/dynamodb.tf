# ----------------------------------------------------------------------------------------------
# DynamoDB tables.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "subjects" {
  name         = "${var.project_name}_${var.env}_subjects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject_id"

  attribute {
    name = "subject_id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "tests" {
  name         = "${var.project_name}_${var.env}_tests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "test_id"

  attribute {
    name = "test_id"
    type = "S"
  }

  attribute {
    name = "subject_id"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_id"
    hash_key        = "subject_id"
    range_key       = "test_id"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for questions.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "questions" {
  name         = "${var.project_name}_${var.env}_questions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "question_id"

  attribute {
    name = "question_id"
    type = "S"
  }

  attribute {
    name = "test_id"
    type = "S"
  }

  attribute {
    name = "number"
    type = "N"
  }

  global_secondary_index {
    name            = "gsi_test_id_number"
    hash_key        = "test_id"
    range_key       = "number"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for attempts.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "attempts" {
  name         = "${var.project_name}_${var.env}_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "attempt_id"

  attribute {
    name = "attempt_id"
    type = "S"
  }

  attribute {
    name = "test_id"
    type = "S"
  }

  attribute {
    name = "started_at"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_test_id_started_at"
    hash_key        = "test_id"
    range_key       = "started_at"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for answer sheets.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "answer_sheets" {
  name         = "${var.project_name}_${var.env}_answer_sheets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "answer_sheet_id"

  attribute {
    name = "answer_sheet_id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for graded sheets.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "graded_sheets" {
  name         = "${var.project_name}_${var.env}_graded_sheets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "graded_sheet_id"

  attribute {
    name = "graded_sheet_id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for words.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "words" {
  name         = "${var.project_name}_${var.env}_words"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "word_id"

  attribute {
    name = "word_id"
    type = "S"
  }

  attribute {
    name = "word_type"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_word_type"
    hash_key        = "word_type"
    range_key       = "word_id"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word groups (Word Sets).
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_groups" {
  name         = "${var.project_name}_${var.env}_word_groups"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "group_id"

  attribute {
    name = "group_id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_tests" {
  name         = "${var.project_name}_${var.env}_word_tests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "word_test_id"

  attribute {
    name = "word_test_id"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word test attempts.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_test_attempts" {
  name         = "${var.project_name}_${var.env}_word_test_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "word_test_attempt_id"

  attribute {
    name = "word_test_attempt_id"
    type = "S"
  }

  attribute {
    name = "word_test_id"
    type = "S"
  }

  attribute {
    name = "started_at"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_word_test_id_started_at"
    hash_key        = "word_test_id"
    range_key       = "started_at"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for Exam Papers (PDFs).
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_papers" {
  name         = "${var.project_name}_${var.env}_exam_papers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paper_id"

  attribute {
    name = "paper_id"
    type = "S"
  }

  attribute {
    name = "grade"
    type = "S"
  }

  attribute {
    name = "subject"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_grade_subject"
    hash_key        = "grade"
    range_key       = "subject"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for Exam Results.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_results" {
  name         = "${var.project_name}_${var.env}_exam_results"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "result_id"

  attribute {
    name = "result_id"
    type = "S"
  }

  attribute {
    name = "test_date"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_test_date"
    hash_key        = "test_date"
    projection_type = "ALL"
  }
}
