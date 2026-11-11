# ============================================================
#  variables.tf: los datos que cambian de alumno a alumno
# ============================================================

variable "alumno" {
  description = "Tu nombre en minúsculas y con guiones, ej: juan-perez. Hace únicos los nombres en AWS."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$", var.alumno))
    error_message = "Usa solo minúsculas, números y guiones (3 a 30 caracteres). Ej: juan-perez"
  }
}

variable "region" {
  description = "Región de AWS donde se crean los recursos"
  type        = string
  default     = "us-east-1"
}
