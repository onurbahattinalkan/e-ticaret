# ==============================================================================
# AWS ElastiCache — Redis 7 (Celery Broker + WebSocket Pub/Sub)
#
# - Private subnet'lerde konuşlanır; yalnızca EC2 SG'den erişilebilir.
# - Tek düğüm; üretimde num_cache_clusters=2+ ile replica eklenebilir.
# - TLS kapalı (uygulama Redis client'ı TLS yapılandırması gerektirmez).
# ==============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.project_name}-redis-subnet-group" }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project_name}-redis"
  description          = "Dopamin Shop - Celery broker ve WebSocket Pub/Sub"

  engine         = "redis"
  engine_version = "7.1"
  node_type      = "cache.t3.micro" # Başlangıç; üretimde cache.t3.medium+ önerilir
  num_cache_clusters = 1            # Tek düğüm; üretimde 2+ replica

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = false # TLS kapalı — client yapılandırması basit kalır

  port = 6379

  tags = { Name = "${var.project_name}-redis" }
}
