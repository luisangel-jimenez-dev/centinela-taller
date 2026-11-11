variable "alumno" {
  description = "Tu nombre en minúsculas y con guiones, ej: juan-perez (el MISMO que usarás en GitHub)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$", var.alumno))
    error_message = "Usa solo minúsculas, números y guiones (3 a 30 caracteres). Ej: juan-perez"
  }
}

variable "github_repo" {
  description = "Tu repositorio en formato usuario/repositorio, ej: juanperez/centinela-sismos"
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+/[A-Za-z0-9._-]+$", var.github_repo))
    error_message = "Debe verse así: usuario/repositorio"
  }
}

variable "region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "crear_proveedor_oidc" {
  description = "true si tu cuenta de AWS aún no tiene el proveedor OIDC de GitHub (lo normal)"
  type        = bool
  default     = true
}
