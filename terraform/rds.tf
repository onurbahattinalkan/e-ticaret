# ==============================================================================
# AWS RDS — PostgreSQL 16 (Yönetilen Veritabanı)
#
# - Private subnet'lerde konuşlanır; yalnızca EC2 SG'den erişilebilir.
# - Otomatik yedekleme (7 gün), gp3 storage, şifreli.
# ==============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

resource "aws_db_instance" "postgres" {
  identifier = "${var.project_name}-postgres"

  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.micro" # Başlangıç; üretimde db.t3.medium+ önerilir

  allocated_storage     = 20
  max_allocated_storage = 100 # Storage auto-scaling üst limiti (GB)
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  multi_az               = false # Üretimde true yapılarak yüksek erişilebilirlik sağlanır
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Yedekleme ve bakım
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # Geliştirme kolaylığı; üretimde skip_final_snapshot = false yapılmalı
  skip_final_snapshot       = true
  final_snapshot_identifier = "${var.project_name}-final-snapshot"

  tags = { Name = "${var.project_name}-postgres" }
}
