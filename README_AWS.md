# Dopamin Shop — AWS Deploy Rehberi

Bu rehber, Terraform ile oluşturulan AWS altyapısına projeyi deploy etme adımlarını
anlatır. Yerel makinenizde (Windows) gerekli araçların kurulumundan canlı ortama
erişime kadar tüm süreci kapsar.

---

## Mimari Özet

```
İnternet
   │
   ▼
[ ALB — Port 80 ]          (Public Subnet × 2 AZ)
   │
   ▼
[ EC2 Auto Scaling ]       (Private Subnet × 2 AZ)
   │  t3.medium, min 2 / max 5
   │  CPU %75 target tracking
   │
   ├──▶ [ RDS PostgreSQL 16 ]   (Private Subnet, db.t3.micro)
   └──▶ [ ElastiCache Redis 7 ] (Private Subnet, cache.t3.micro)

[ ECR ]  ◀── Docker image push (yerel makineden)
```

Her EC2 instance başlatıldığında `user_data.sh` scripti:
1. Docker ve Docker Compose v2 kurar
2. ECR'den backend imajını çeker
3. FastAPI + Celery container'larını başlatır

---

## 1. Ön Gereksinimler

### 1.1 Terraform CLI Kurulumu (Windows)

**Seçenek A — Chocolatey ile:**
```powershell
choco install terraform
```

**Seçenek B — Manuel kurulum:**
1. https://developer.hashicorp.com/terraform/install adresinden Windows AMD64
   zip dosyasını indirin
2. Zip'i açın (örn. `C:\terraform\`)
3. `C:\terraform` dizinini **PATH** ortam değişkenine ekleyin
4. Doğrulama:
   ```powershell
   terraform -version
   # Terraform v1.5+ çıktısı görmelisiniz
   ```

### 1.2 AWS CLI Kurulumu

1. https://aws.amazon.com/cli/ adresinden MSI yükleyicisini indirip kurun
2. IAM kullanıcınızın Access Key bilgilerini yapılandırın:
   ```bash
   aws configure
   # AWS Access Key ID:     AKIA...
   # AWS Secret Access Key: ...
   # Default region name:   eu-central-1
   # Default output format: json
   ```
3. Doğrulama:
   ```bash
   aws sts get-caller-identity
   ```

> **Gerekli IAM İzinleri:** Terraform'un kullanacağı IAM kullanıcısı/rolü
> şu servislere erişim gerektirir: VPC, EC2, RDS, ElastiCache, ECR, ELB,
> Auto Scaling, IAM, CloudWatch. Geliştirme aşamasında `AdministratorAccess`
> kullanılabilir; üretimde en az yetki ilkesi uygulanmalıdır.

### 1.3 Docker Desktop

ECR'ye imaj push etmek için Docker Desktop kurulu ve çalışır olmalıdır.

---

## 2. Terraform Değişkenlerini Hazırlama

```bash
cd terraform

# Örnek dosyayı kopyalayın
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` dosyasını düzenleyin — özellikle **db_password** alanına
güçlü bir şifre yazın (en az 8 karakter, alfanümerik):

```hcl
aws_region    = "eu-central-1"
project_name  = "dopamin-shop"
environment   = "production"

db_username = "dopamin_admin"
db_password = "BurayaGucluBirSifreYazin123"
db_name     = "dopamin_simulator"

ec2_instance_type    = "t3.medium"
asg_min_size         = 2
asg_max_size         = 5
asg_desired_capacity = 2
cpu_target_value     = 75.0
```

> **DİKKAT:** `terraform.tfvars` dosyası şifre içerir — Git'e **asla**
> commit etmeyin. `.gitignore`'da zaten hariç tutulmuştur.

---

## 3. Altyapıyı Oluşturma

### 3.1 Terraform Init

Terraform provider'larını ve modüllerini indirir:

```bash
cd terraform
terraform init
```

Başarılı çıktı:
```
Terraform has been successfully initialized!
```

### 3.2 Terraform Plan

Oluşturulacak kaynakları gözden geçirin:

```bash
terraform plan
```

Plan çıktısı yaklaşık 25-30 kaynak gösterecektir:
- VPC, Subnet, IGW, NAT Gateway, Route Table
- Security Groups (ALB, EC2, RDS, Redis)
- RDS PostgreSQL, ElastiCache Redis
- ECR Repository
- IAM Role + Instance Profile
- ALB, Target Group, Listener
- Launch Template, ASG, Scaling Policy

### 3.3 Terraform Apply

Onay verdikten sonra kaynakları oluşturur (yaklaşık 10-15 dakika sürer,
RDS ve ElastiCache en uzun süren kaynaklardır):

```bash
terraform apply
```

`Do you want to perform these actions?` sorusuna `yes` yazın.

Başarılı apply sonrası şu çıktılar görünür:

| Çıktı               | Açıklama                          |
|----------------------|-----------------------------------|
| `alb_dns_name`       | Tarayıcıdan erişim URL'i         |
| `ecr_repository_url` | Docker push hedef adresi          |
| `ecr_push_commands`  | İmaj gönderme komutları           |
| `vpc_id`             | Oluşturulan VPC ID'si            |

Hassas çıktıları görmek için:
```bash
terraform output rds_endpoint
terraform output redis_endpoint
```

---

## 4. Docker İmajını ECR'ye Gönderme

Terraform altyapıyı oluşturduktan sonra, backend imajını ECR'ye push edin.

### 4.1 ECR'ye Giriş

```bash
# Bölge ve hesap ID'nizi terraform çıktısından alın
aws ecr get-login-password --region eu-central-1 \
  | docker login --username AWS --password-stdin \
    <HESAP_ID>.dkr.ecr.eu-central-1.amazonaws.com
```

> **İpucu:** `terraform output ecr_push_commands` komutu size tam komutları verir.

### 4.2 İmajı Build Et ve Push Et

```bash
# Proje kök dizinine dönün
cd ..

# Backend imajını build edin
docker build -t <ECR_REPO_URL>:latest ./backend

# ECR'ye push edin
docker push <ECR_REPO_URL>:latest
```

`<ECR_REPO_URL>` değerini `terraform output ecr_repository_url` çıktısıyla
değiştirin. Örnek:
```
123456789012.dkr.ecr.eu-central-1.amazonaws.com/dopamin-shop/backend
```

### 4.3 ASG Instance'larını Yenileme

İlk push'tan sonra veya imaj güncellemelerinde, mevcut EC2 instance'larının
yeni imajı çekmesi için instance refresh başlatın:

```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name $(terraform -chdir=terraform output -raw asg_name 2>/dev/null || echo "dopamin-shop-asg-xxx") \
  --strategy Rolling \
  --preferences '{"MinHealthyPercentage": 50}'
```

Veya daha basit yöntem — ASG desired capacity'yi kısa süreliğine 0'a düşürüp
tekrar artırarak tüm instance'ları yenileyin (yalnızca ilk deploy için önerilir).

---

## 5. Uygulamaya Erişim

Deploy tamamlandıktan ve EC2 instance'ları sağlıklı hale geldikten sonra
(health check grace period: 180 saniye):

```bash
# ALB DNS adresini alın
terraform -chdir=terraform output alb_dns_name
```

Tarayıcınızda bu URL'i açın:
```
http://dopamin-shop-alb-xxxxxxxxx.eu-central-1.elb.amazonaws.com
```

> **Not:** İlk erişimde yalnızca backend API çalışır (port 8000 üzerinden
> FastAPI). Frontend şu an Docker Compose ile yerel geliştirme ortamında
> çalışmaktadır. Üretim frontend deploy'u için S3 + CloudFront veya
> Amplify kullanılması önerilir.

---

## 6. Sorun Giderme

### EC2 Instance'a Bağlanma (SSM)

SSH key gerektirmez — IAM instance profile üzerinden SSM Session Manager
kullanılır:

```bash
# Instance ID'yi bulun
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=dopamin-shop-backend" \
            "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[].InstanceId" \
  --output text

# Session başlatın
aws ssm start-session --target i-0123456789abcdef0
```

### User Data Loglarını İnceleme

Instance'a SSM ile bağlandıktan sonra:
```bash
cat /var/log/user-data.log
```

### Container Durumunu Kontrol Etme

```bash
cd /opt/dopamin-shop
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50
```

### Yaygın Sorunlar

| Sorun | Olası Neden | Çözüm |
|-------|-------------|-------|
| ALB health check failing | ECR'ye imaj push edilmemiş | Adım 4'ü tamamlayın |
| Docker pull başarısız | IAM role eksik/hatalı | `iam.tf`'de ECR read policy kontrol edin |
| RDS bağlantı hatası | Security group kuralları | EC2 SG → RDS SG (5432) zincirini kontrol edin |
| Terraform apply hata | Yetersiz IAM izni | Kullanıcıya gerekli servislerin iznini verin |

---

## 7. Altyapıyı Silme

Tüm AWS kaynaklarını kaldırmak için:

```bash
cd terraform
terraform destroy
```

`Do you want to destroy all resources?` sorusuna `yes` yazın.

> **Uyarı:** Bu işlem geri alınamaz. RDS veritabanı (skip_final_snapshot=true
> yapılandırması nedeniyle) son yedek alınmadan silinir. Üretim ortamında
> `skip_final_snapshot = false` olarak değiştirin.

---

## 8. Maliyet Tahmini (Aylık, eu-central-1)

| Kaynak | Tip | Tahmini Maliyet |
|--------|-----|-----------------|
| EC2 × 2 | t3.medium | ~$60 |
| RDS | db.t3.micro | ~$15 |
| ElastiCache | cache.t3.micro | ~$12 |
| NAT Gateway | — | ~$32 + veri transfer |
| ALB | — | ~$16 + LCU |
| **Toplam** | | **~$135/ay** |

> Bu tahminler minimum yapılandırma içindir. Auto Scaling ile instance sayısı
> artarsa EC2 maliyeti de artar. Geliştirme/test ortamı için `asg_min_size=1`,
> `ec2_instance_type=t3.micro` kullanarak maliyeti düşürebilirsiniz.

---

## Dosya Yapısı

```
terraform/
├── main.tf                  # Provider, backend, data sources
├── variables.tf             # Giriş değişkenleri
├── outputs.tf               # Çıktılar (ALB DNS, ECR URL, vb.)
├── vpc.tf                   # VPC, Subnet, IGW, NAT, Route Table
├── security_groups.tf       # ALB, EC2, RDS, Redis SG'leri
├── rds.tf                   # PostgreSQL RDS instance
├── elasticache.tf           # Redis ElastiCache
├── ecr.tf                   # Container Registry + lifecycle policy
├── iam.tf                   # EC2 Role + Instance Profile
├── alb.tf                   # ALB, Target Group, HTTP Listener
├── asg.tf                   # Launch Template, ASG, Scaling Policy
├── templates/
│   └── user_data.sh         # EC2 bootstrap script
├── terraform.tfvars.example # Örnek değişken dosyası
└── terraform.tfvars         # Gerçek değerler (GİT'E EKLENMEMELİ)
```
