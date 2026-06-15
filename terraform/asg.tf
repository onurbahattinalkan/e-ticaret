# ==============================================================================
# Launch Template + Auto Scaling Group + CPU Scaling Policy
#
# - Launch Template: AMI, instance type, security group, IAM profile, user data
# - ASG: min 2, max 5 instance; 2 AZ'ya yayılır
# - Scaling Policy: ortalama CPU %75'i aşarsa yeni instance eklenir
# ==============================================================================

# ── Launch Template ──────────────────────────────────────────────────────────

resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project_name}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.ec2_instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  # User Data: Docker + Docker Compose kurulumu, ECR pull, container başlatma
  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    region         = var.aws_region
    ecr_registry   = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    ecr_image      = aws_ecr_repository.backend.repository_url
    rds_endpoint   = aws_db_instance.postgres.address
    db_username    = var.db_username
    db_password    = var.db_password
    db_name        = var.db_name
    redis_endpoint = aws_elasticache_replication_group.redis.primary_endpoint_address
  }))

  # IMDSv2 zorunluluğu (güvenlik en iyi uygulaması)
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-backend"
    }
  }

  lifecycle { create_before_destroy = true }
}

# ── Auto Scaling Group ───────────────────────────────────────────────────────

resource "aws_autoscaling_group" "backend" {
  name_prefix      = "${var.project_name}-asg-"
  desired_capacity = var.asg_desired_capacity # 2
  min_size         = var.asg_min_size         # 2
  max_size         = var.asg_max_size         # 5

  vpc_zone_identifier = aws_subnet.private[*].id          # 2 AZ'ya yayıl
  target_group_arns   = [aws_lb_target_group.backend.arn] # ALB ile bağlantı

  # ALB health check kullan (EC2 health check yerine)
  health_check_type         = "ELB"
  health_check_grace_period = 180 # Docker imaj çekme + başlatma süresi

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-backend"
    propagate_at_launch = true
  }

  lifecycle { create_before_destroy = true }
}

# ── Auto Scaling Policy: CPU %75 Hedefi ─────────────────────────────────────

resource "aws_autoscaling_policy" "cpu_target" {
  name                   = "${var.project_name}-cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target_value # 75.0
  }
}
