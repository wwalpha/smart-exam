# ----------------------------------------------------------------------------------------------
# DynamoDB tables.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "subjects" {
  name         = "${var.project_name}_subjects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subjectId"

  attribute {
    name = "subjectId"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "tests" {
  name         = "${var.project_name}_tests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "testId"

  attribute {
    name = "testId"
    type = "S"
  }

  attribute {
    name = "subjectId"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_id"
    hash_key        = "subjectId"
    range_key       = "testId"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for questions.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "questions" {
  name         = "${var.project_name}_questions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "questionId"

  attribute {
    name = "questionId"
    type = "S"
  }

  attribute {
    name = "testId"
    type = "S"
  }

  attribute {
    name = "number"
    type = "N"
  }

  global_secondary_index {
    name            = "gsi_test_id_number"
    hash_key        = "testId"
    range_key       = "number"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for attempts.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "attempts" {
  name         = "${var.project_name}_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "attemptId"

  attribute {
    name = "attemptId"
    type = "S"
  }

  attribute {
    name = "testId"
    type = "S"
  }

  attribute {
    name = "startedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_test_id_started_at"
    hash_key        = "testId"
    range_key       = "startedAt"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for graded sheets.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "graded_sheets" {
  name         = "${var.project_name}_graded_sheets"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "gradedSheetId"

  attribute {
    name = "gradedSheetId"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for words.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "words" {
  name         = "${var.project_name}_words"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "wordId"

  attribute {
    name = "wordId"
    type = "S"
  }

  attribute {
    name = "subject"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_word_id"
    hash_key        = "subject"
    range_key       = "wordId"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for last incorrect per word (avoids full scan on attempts).
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_incorrects" {
  name         = "${var.project_name}_word_incorrects"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "wordId"

  attribute {
    name = "wordId"
    type = "S"
  }

  attribute {
    name = "subject"
    type = "S"
  }

  attribute {
    name = "lastIncorrectAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_last_incorrect_at"
    hash_key        = "subject"
    range_key       = "lastIncorrectAt"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word groups (Word Sets).
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_groups" {
  name         = "${var.project_name}_word_groups"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "groupId"

  attribute {
    name = "groupId"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_tests" {
  name         = "${var.project_name}_word_tests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "wordTestId"

  attribute {
    name = "wordTestId"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word test attempts.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_test_attempts" {
  name         = "${var.project_name}_word_test_attempts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "wordTestAttemptId"

  attribute {
    name = "wordTestAttemptId"
    type = "S"
  }

  attribute {
    name = "wordTestId"
    type = "S"
  }

  attribute {
    name = "startedAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_word_test_id_started_at"
    hash_key        = "wordTestId"
    range_key       = "startedAt"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for Exam Papers (PDFs).
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_papers" {
  name         = "${var.project_name}_exam_papers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "paperId"

  attribute {
    name = "paperId"
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
  name         = "${var.project_name}_exam_results"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resultId"

  attribute {
    name = "resultId"
    type = "S"
  }

  attribute {
    name = "testDate"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_test_date"
    hash_key        = "testDate"
    projection_type = "ALL"
  }
}
