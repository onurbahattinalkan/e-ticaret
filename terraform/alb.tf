# ==============================================================================
# AWS Application Load Balancer
#
# - Public subnet'lere konuşlanır; dış dünyaya açık tek giriş noktasıdır.
# - Port 80 (HTTP) → backend target group (port 8000) yönlendirmesi.
# - Health check: FastAPI'nin GET / endpoint'i (200 beklenir).
# - HTTPS listener yorum satırında; ACM sertifikası ile aktifleştirilebilir.
# ==============================================================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false # Üretimde true yapılmalı

  tags = { Name = "${var.project_name}-alb" }
}

# ── Target Group: Backend (port 8000) ────────────────────────────────────────

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    enabled             = true
    path                = "/"        # FastAPI health check endpoint
    port                = "8000"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-backend-tg" }
}

# ── Listener: HTTP (80) ─────────────────────────────────────────────────────

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ── Listener: HTTPS (443) — ACM sertifikası gerektirir ──────────────────────
#
# Aktifleştirmek için:
#   1. variables.tf'ye  variable "acm_certificate_arn" {} ekleyin
#   2. Aşağıdaki bloğun yorum satırlarını kaldırın
#
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = var.acm_certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.backend.arn
#   }
# }
