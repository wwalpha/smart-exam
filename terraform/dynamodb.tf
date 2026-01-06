# ----------------------------------------------------------------------------------------------
# DynamoDB tables.
# ----------------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------------
# DynamoDB table for materials.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "materials" {
  name         = "${var.project_name}_materials"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "materialId"

  attribute {
    name = "materialId"
    type = "S"
  }

  attribute {
    name = "subjectId"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_id"
    hash_key        = "subjectId"
    range_key       = "materialId"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for material questions.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "material_questions" {
  name         = "${var.project_name}_material_questions"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "questionId"

  attribute {
    name = "questionId"
    type = "S"
  }

  attribute {
    name = "materialId"
    type = "S"
  }

  attribute {
    name = "number"
    type = "N"
  }

  global_secondary_index {
    name            = "gsi_material_id_number"
    hash_key        = "materialId"
    range_key       = "number"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for word master.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "word_master" {
  name         = "${var.project_name}_word_master"
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
# DynamoDB table for review test candidates.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "review_test_candidates" {
  name         = "${var.project_name}_review_test_candidates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject"
  range_key    = "questionId"

  attribute {
    name = "subject"
    type = "S"
  }

  attribute {
    name = "questionId"
    type = "S"
  }

  attribute {
    name = "nextTime"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_next_time"
    hash_key        = "subject"
    range_key       = "nextTime"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for review tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "review_tests" {
  name         = "${var.project_name}_review_tests"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "testId"

  attribute {
    name = "testId"
    type = "S"
  }
}
