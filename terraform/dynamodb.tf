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
  name         = "${var.project_name}_kanji"
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
# DynamoDB table for exam candidates.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_candidates" {
  name         = "${var.project_name}_exam_candidates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject"
  range_key    = "candidateKey"

  attribute {
    name = "subject"
    type = "S"
  }

  attribute {
    name = "candidateKey"
    type = "S"
  }

  attribute {
    name = "questionId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_subject_next_time"
    hash_key        = "subject"
    range_key       = "candidateKey"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "gsi_question_id_created_at"
    hash_key        = "questionId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for exam tests.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam" {
  name         = "${var.project_name}_exams"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "examId"

  attribute {
    name = "examId"
    type = "S"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for exam details.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_details" {
  name         = "${var.project_name}_exam_details"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "examId"
  range_key    = "seq"

  attribute {
    name = "examId"
    type = "S"
  }

  attribute {
    name = "seq"
    type = "N"
  }

  attribute {
    name = "targetId"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_target_id_exam_id"
    hash_key        = "targetId"
    range_key       = "examId"
    projection_type = "ALL"
  }
}

# ----------------------------------------------------------------------------------------------
# DynamoDB table for exam histories.
# ----------------------------------------------------------------------------------------------
resource "aws_dynamodb_table" "exam_histories" {
  name         = "${var.project_name}_exam_histories"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subject"
  range_key    = "candidateKey"

  attribute {
    name = "subject"
    type = "S"
  }

  attribute {
    name = "candidateKey"
    type = "S"
  }

  attribute {
    name = "questionId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "gsi_question_id_created_at"
    hash_key        = "questionId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
}
