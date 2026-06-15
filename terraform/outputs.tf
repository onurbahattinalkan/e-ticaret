# ==============================================================================
# Çıktılar — terraform apply sonrası gösterilir
# ==============================================================================

output "alb_dns_name" {
  description = "ALB DNS adresi — tarayıcıdan erişim URL'i"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "ECR repository URL'i — docker push hedefi"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "PostgreSQL RDS endpoint'i"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint'i"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}

output "vpc_id" {
  description = "Oluşturulan VPC'nin ID'si"
  value       = aws_vpc.main.id
}

output "ecr_push_commands" {
  description = "İmajı ECR'ye göndermek için çalıştırılacak komutlar"
  value       = <<-EOT
    # 1. ECR giriş
    aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.backend.repository_url}

    # 2. İmaj build (backend dizininden)
    cd backend && docker build -t ${aws_ecr_repository.backend.repository_url}:latest .

    # 3. Push
    docker push ${aws_ecr_repository.backend.repository_url}:latest
  EOT
}
