# ============================================================
#  BOOTSTRAP: se corre UNA SOLA VEZ desde tu computadora.
#
#  Crea lo que el pipeline necesita ANTES de poder trabajar solo:
#   1. Un bucket S3 para guardar el estado de Terraform
#   2. La "confianza" entre AWS y GitHub (OIDC): sin contraseñas
#   3. Un rol con permisos LIMITADOS que GitHub Actions puede usar
#
#  Su propio estado se queda en tu compu (terraform.tfstate). ¡No lo borres!
# ============================================================

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Proyecto   = "centinela-sismos"
      Alumno     = var.alumno
      Gestionado = "terraform-bootstrap"
    }
  }
}

data "aws_caller_identity" "yo" {}

locals {
  nombre       = "centinela-${var.alumno}"
  bucket_datos = "arn:aws:s3:::${local.nombre}-datos"
  github_oidc  = "token.actions.githubusercontent.com"
  cuenta       = data.aws_caller_identity.yo.account_id

  # "usuario/repo" separado en sus dos partes
  github_usuario = split("/", var.github_repo)[0]
  github_nombre  = split("/", var.github_repo)[1]
}

# ------------------------------------------------------------
# 1. Bucket para el estado de Terraform
# ------------------------------------------------------------
resource "aws_s3_bucket" "estado" {
  bucket        = "${local.nombre}-tfstate"
  force_destroy = true # práctica escolar: deja borrarlo al final
}

resource "aws_s3_bucket_versioning" "estado" {
  bucket = aws_s3_bucket.estado.id
  versioning_configuration {
    status = "Enabled" # guarda versiones anteriores del estado, por si acaso
  }
}

resource "aws_s3_bucket_public_access_block" "estado" {
  bucket                  = aws_s3_bucket.estado.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------
# 2. OIDC: AWS confía en los tokens que firma GitHub
#    (solo existe UNO por cuenta de AWS; si ya lo tienes,
#     pon crear_proveedor_oidc = false en terraform.tfvars)
# ------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github" {
  count          = var.crear_proveedor_oidc ? 1 : 0
  url            = "https://${local.github_oidc}"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.crear_proveedor_oidc ? 0 : 1
  url   = "https://${local.github_oidc}"
}

locals {
  oidc_arn = var.crear_proveedor_oidc ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
}

# ------------------------------------------------------------
# 3. El rol que usa GitHub Actions
# ------------------------------------------------------------

# ¿QUIÉN puede usar el rol? Solo TU repositorio, y solo desde:
#  - la rama main
#  - un Pull Request (para el "plan")
#  - el ambiente "produccion"
data "aws_iam_policy_document" "confianza" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "${local.github_oidc}:sub"
      # GitHub manda el repo en uno de dos formatos:
      #   viejo: repo:usuario/repo:...
      #   nuevo: repo:usuario@12345/repo@67890:...  (con números que no cambian)
      # Aceptamos los dos, pero SOLO para tu usuario y tu repo.
      values = flatten([
        for prefijo in [
          "repo:${local.github_usuario}/${local.github_nombre}",
          "repo:${local.github_usuario}@*/${local.github_nombre}@*",
          ] : [
          "${prefijo}:ref:refs/heads/main",
          "${prefijo}:pull_request",
          "${prefijo}:environment:produccion",
        ]
      ])
    }
  }
}

resource "aws_iam_role" "github" {
  name                 = "${local.nombre}-github"
  assume_role_policy   = data.aws_iam_policy_document.confianza.json
  max_session_duration = 3600 # las credenciales duran máximo 1 hora
}

# ¿QUÉ puede hacer el rol? Solo lo necesario (mínimo privilegio):
data "aws_iam_policy_document" "permisos" {
  # Leer y escribir el estado de Terraform
  statement {
    sid       = "EstadoTerraform"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.estado.arn]
  }
  statement {
    sid       = "EstadoTerraformArchivos"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.estado.arn}/*"]
  }

  # Administrar SOLO su bucket de datos (no otros buckets de la cuenta)
  statement {
    sid       = "BucketDeDatos"
    actions   = ["s3:*"]
    resources = [local.bucket_datos, "${local.bucket_datos}/*"]
  }

  # CloudFront (distribución, OAC, invalidaciones, políticas de caché)
  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  # Amplify (crear la app y publicar el tablero), solo en esta cuenta y región
  statement {
    sid       = "Amplify"
    actions   = ["amplify:*"]
    resources = ["arn:aws:amplify:${var.region}:${local.cuenta}:apps/*"]
  }
  statement {
    sid       = "AmplifyCrearYListar"
    actions   = ["amplify:CreateApp", "amplify:ListApps", "amplify:TagResource"]
    resources = ["*"]
  }

  # Nota: este rol NO puede crear usuarios, ni otros roles, ni servidores,
  # ni tocar otros buckets. Si alguien lo robara, el daño sería muy limitado.
}

resource "aws_iam_role_policy" "github" {
  name   = "${local.nombre}-permisos"
  role   = aws_iam_role.github.id
  policy = data.aws_iam_policy_document.permisos.json
}
