# ==============================================================================
# AWS ECR — Docker İmaj Deposu
#
# Backend imajı burada saklanır.
# EC2 instance'ları IAM role ile bu repo'dan pull yapar.
# ==============================================================================

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}/backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-ecr-backend" }
}

# Son 10 imajı sakla; eski untagged imajları otomatik temizle
resource "aws_ecr_lifecycle_policy" "backend" {
  repository = aws_ecr_repository.backend.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Son 10 imaji sakla"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}
