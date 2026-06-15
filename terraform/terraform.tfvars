
aws_region    = "eu-central-1"
project_name  = "dopamin-shop"
environment   = "production"

# RDS PostgreSQL
db_username = "dopamin_admin"
db_password = "E_ticaret14!"   # en az 8 karakter, alfanümerik
db_name     = "dopamin_simulator"

# EC2 / Auto Scaling
ec2_instance_type = "t3.medium"
asg_min_size      = 2
asg_max_size      = 5
asg_desired_capacity = 2
cpu_target_value  = 75.0
