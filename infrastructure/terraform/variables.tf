# Variable definitions for Shuffle & Sync Terraform configuration

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region for resources"
  type        = string
  default     = "us-central1"
}

# Backend Service Configuration
variable "backend_service_name" {
  description = "Name of the backend Cloud Run service"
  type        = string
  default     = "shuffle-and-sync-backend"
}

variable "backend_image" {
  description = "Container image for backend service"
  type        = string
}

variable "backend_cpu" {
  description = "CPU allocation for backend service"
  type        = string
  default     = "1"
}

variable "backend_memory" {
  description = "Memory allocation for backend service"
  type        = string
  default     = "1Gi"
}

variable "backend_concurrency" {
  description = "Maximum concurrent requests per container instance"
  type        = number
  default     = 80
}

variable "backend_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 300
}

variable "backend_min_instances" {
  description = "Minimum number of instances (0 for scale-to-zero)"
  type        = string
  default     = "0"
}

variable "backend_max_instances" {
  description = "Maximum number of instances for autoscaling"
  type        = string
  default     = "10"
}

# Frontend Service Configuration
variable "frontend_service_name" {
  description = "Name of the frontend Cloud Run service"
  type        = string
  default     = "shuffle-and-sync-frontend"
}

variable "frontend_image" {
  description = "Container image for frontend service"
  type        = string
}

variable "frontend_cpu" {
  description = "CPU allocation for frontend service"
  type        = string
  default     = "1"
}

variable "frontend_memory" {
  description = "Memory allocation for frontend service"
  type        = string
  default     = "512Mi"
}

variable "frontend_concurrency" {
  description = "Maximum concurrent requests per container instance"
  type        = number
  default     = 100
}

variable "frontend_min_instances" {
  description = "Minimum number of instances (0 for scale-to-zero)"
  type        = string
  default     = "0"
}

variable "frontend_max_instances" {
  description = "Maximum number of instances for autoscaling"
  type        = string
  default     = "5"
}

# Monitoring Configuration
variable "notification_channels" {
  description = "List of notification channel IDs for alerts"
  type        = list(string)
  default     = []
}
