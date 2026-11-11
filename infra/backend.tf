# ============================================================
#  backend.tf: versiones y DÓNDE se guarda el estado
# ============================================================
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # El estado (la "memoria" de Terraform) vive en un bucket S3.
  # El nombre del bucket NO va aquí porque cada alumno tiene el suyo;
  # se pasa al hacer init:
  #   terraform init -backend-config="bucket=centinela-TUNOMBRE-tfstate"
  backend "s3" {
    key          = "centinela/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true # candado: evita que dos personas apliquen al mismo tiempo
  }
}
