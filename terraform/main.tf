# ==============================================================================
# Alışveriş Dopamin Simülatörü — Terraform Ana Konfigürasyon
# ==============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # ── Uzak State Backend (üretim için önerilir) ──────────────────────────────
  # Aşağıdaki bloğu aktifleştirmeden önce S3 bucket ve DynamoDB tablosunu
  # elle veya ayrı bir bootstrap Terraform ile oluşturun.
  #
  # backend "s3" {
  #   bucket         = "dopamin-shop-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "eu-central-1"
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Ortak Data Sources ───────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
