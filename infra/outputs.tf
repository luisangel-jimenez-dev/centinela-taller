# ============================================================
#  outputs.tf: lo que Terraform nos "responde" al terminar.
#  El pipeline usa estos valores para subir datos y el tablero.
# ============================================================

output "bucket_datos" {
  description = "Bucket S3 donde se guarda sismos.json"
  value       = aws_s3_bucket.datos.bucket
}

output "cdn_id" {
  description = "ID de CloudFront (para limpiar la caché)"
  value       = aws_cloudfront_distribution.cdn.id
}

output "url_datos" {
  description = "URL pública de los datos"
  value       = "https://${aws_cloudfront_distribution.cdn.domain_name}/sismos.json"
}

output "amplify_app_id" {
  description = "ID de la app de Amplify"
  value       = aws_amplify_app.tablero.id
}

output "url_tablero" {
  description = "🌎 Abre esta URL para ver tu tablero"
  value       = "https://main.${aws_amplify_app.tablero.default_domain}"
}
