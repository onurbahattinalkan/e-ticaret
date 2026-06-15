# ==============================================================================
# Giriş Değişkenleri
# ==============================================================================

# ── Genel ────────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS bölgesi"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Proje adı — tüm kaynak isim ve etiketlerinde kullanılır"
  type        = string
  default     = "dopamin-shop"
}

variable "environment" {
  description = "Ortam adı (production, staging, dev)"
  type        = string
  default     = "production"
}

# ── VPC ──────────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "VPC CIDR bloğu"
  type        = string
  default     = "10.0.0.0/16"
}

# ── RDS (PostgreSQL) ─────────────────────────────────────────────────────────

variable "db_username" {
  description = "RDS PostgreSQL master kullanıcı adı"
  type        = string
  default     = "dopamin_admin"
  sensitive   = true
}

variable "db_password" {
  description = "RDS PostgreSQL master şifresi (en az 8 karakter, alfanümerik)"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "PostgreSQL veritabanı adı"
  type        = string
  default     = "dopamin_simulator"
}

# ── EC2 / Auto Scaling ──────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance tipi"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_size" {
  description = "ASG minimum instance sayısı"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "ASG maksimum instance sayısı"
  type        = number
  default     = 5
}

variable "asg_desired_capacity" {
  description = "ASG başlangıç (desired) instance sayısı"
  type        = number
  default     = 2
}

variable "cpu_target_value" {
  description = "Auto Scaling CPU hedef yüzdesi — aşılırsa yeni instance eklenir"
  type        = number
  default     = 75.0
}
