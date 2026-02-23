provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project     = var.project_name
      environment = var.deploy_environment
    }
  }
}
