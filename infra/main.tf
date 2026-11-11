# ============================================================
#  main.tf: la infraestructura de Centinela
#
#   [S3 privado]  ──▶  [CloudFront]  ──▶  sismos.json (datos)
#   [Amplify]     ──────────────────────▶ el tablero (React)
# ============================================================

provider "aws" {
  region = var.region

  # Etiquetas que se ponen solas a todo lo que creamos
  default_tags {
    tags = {
      Proyecto   = "centinela-sismos"
      Alumno     = var.alumno
      Gestionado = "terraform"
    }
  }
}

locals {
  nombre = "centinela-${var.alumno}"
}

# ------------------------------------------------------------
# 1. Bucket S3 donde se guardan los datos (sismos.json)
# ------------------------------------------------------------
resource "aws_s3_bucket" "datos" {
  bucket        = "${local.nombre}-datos"
  force_destroy = true # deja borrarlo con "terraform destroy" aunque tenga archivos
}

# Nadie puede entrar directo al bucket: es PRIVADO.
resource "aws_s3_bucket_public_access_block" "datos" {
  bucket                  = aws_s3_bucket.datos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------
# 2. CloudFront: reparte los datos rápido, con HTTPS y caché
# ------------------------------------------------------------

# OAC = la "credencial" con la que CloudFront entra al bucket privado
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "${local.nombre}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Política de caché ya hecha por AWS (no hay que inventarla):
# CachingOptimized guarda copias en caché.
data "aws_cloudfront_cache_policy" "optimizada" {
  name = "Managed-CachingOptimized"
}

# CORS: permiso para que el tablero (que vive en otro dominio, Amplify)
# pueda leer sismos.json. Los datos son públicos, así que cualquier
# página puede leerlos (*).
resource "aws_cloudfront_response_headers_policy" "cors" {
  name    = "${local.nombre}-cors"
  comment = "Permite que el tablero lea los datos"

  cors_config {
    access_control_allow_credentials = false
    origin_override                  = true
    access_control_max_age_sec       = 600

    access_control_allow_origins {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_headers {
      items = ["*"]
    }
  }
}

resource "aws_cloudfront_distribution" "cdn" {
  enabled     = true
  comment     = "Datos de ${local.nombre}"
  price_class = "PriceClass_100" # solo Norteamérica y Europa: lo más barato

  origin {
    domain_name              = aws_s3_bucket.datos.bucket_regional_domain_name
    origin_id                = "s3-datos"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  default_cache_behavior {
    target_origin_id           = "s3-datos"
    viewer_protocol_policy     = "redirect-to-https" # siempre HTTPS
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimizada.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.cors.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado gratis de *.cloudfront.net (¡no hace falta comprar dominio!)
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Regla del bucket: SOLO esta distribución de CloudFront puede leer archivos.
data "aws_iam_policy_document" "solo_cloudfront" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.datos.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.cdn.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "datos" {
  bucket     = aws_s3_bucket.datos.id
  policy     = data.aws_iam_policy_document.solo_cloudfront.json
  depends_on = [aws_s3_bucket_public_access_block.datos]
}

# ------------------------------------------------------------
# 3. Amplify: aquí vive el tablero (la página en React)
# ------------------------------------------------------------
# No lo conectamos directo a GitHub: GitHub Actions compila el tablero
# y se lo sube a Amplify ya listo. Así todo pasa por nuestro pipeline.
resource "aws_amplify_app" "tablero" {
  name     = local.nombre
  platform = "WEB"
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.tablero.id
  branch_name = "main"
  stage       = "PRODUCTION"
}
