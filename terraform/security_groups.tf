# ==============================================================================
# Security Groups
#
# Trafik akışı:
#   İnternet → [ALB SG :80/:443] → [EC2 SG :8000] → [RDS SG :5432]
#                                                   → [Redis SG :6379]
#
# Kritik kural: RDS ve Redis YALNIZCA EC2 SG'den erişime açıktır.
# Dış dünyaya açık tek nokta ALB'dir.
# ==============================================================================

# ── ALB Security Group: Dış dünyaya açık ─────────────────────────────────────

resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.main.id
  description = "ALB - HTTP/HTTPS dis dunyadan kabul eder"

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }

  lifecycle { create_before_destroy = true }
}

# ── EC2 Security Group: Yalnızca ALB'den trafik alır ────────────────────────

resource "aws_security_group" "ec2" {
  name_prefix = "${var.project_name}-ec2-"
  vpc_id      = aws_vpc.main.id
  description = "EC2 - Yalnizca ALB uzerinden FastAPI (8000) erisimi"

  ingress {
    description     = "FastAPI (ALB uzerinden)"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-ec2-sg" }

  lifecycle { create_before_destroy = true }
}

# ── RDS Security Group: Yalnızca EC2'lerden erişim ──────────────────────────

resource "aws_security_group" "rds" {
  name_prefix = "${var.project_name}-rds-"
  vpc_id      = aws_vpc.main.id
  description = "RDS - Yalnizca EC2 backend PostgreSQL (5432) erisimi"

  ingress {
    description     = "PostgreSQL (EC2 backend)"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }

  lifecycle { create_before_destroy = true }
}

# ── Redis Security Group: Yalnızca EC2'lerden erişim ────────────────────────

resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-redis-"
  vpc_id      = aws_vpc.main.id
  description = "ElastiCache Redis - Yalnizca EC2 backend (6379) erisimi"

  ingress {
    description     = "Redis (EC2 backend)"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-redis-sg" }

  lifecycle { create_before_destroy = true }
}
