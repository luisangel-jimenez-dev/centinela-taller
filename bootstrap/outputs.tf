# Copia estos valores a GitHub: Settings → Secrets and variables → Actions → Variables

output "AWS_ROLE_ARN" {
  description = "Variable AWS_ROLE_ARN para GitHub"
  value       = aws_iam_role.github.arn
}

output "TF_STATE_BUCKET" {
  description = "Variable TF_STATE_BUCKET para GitHub"
  value       = aws_s3_bucket.estado.bucket
}

output "ALUMNO" {
  description = "Variable ALUMNO para GitHub"
  value       = var.alumno
}
