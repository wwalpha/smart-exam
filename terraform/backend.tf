terraform {
  backend "s3" {
    bucket = "arms-terraform-0606"
    key    = "stock/terraform.tfstate"
    region = "us-east-1"
  }
}
