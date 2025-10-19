# Terraform configuration for Shuffle & Sync infrastructure on Google Cloud Platform
# This creates all required GCP resources for production deployment

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  # Configure backend for state storage
  # Uncomment and configure when using remote state
  # backend "gcs" {
  #   bucket = "your-terraform-state-bucket"
  #   prefix = "shuffle-sync/production"
  # }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required Google Cloud APIs
resource "google_project_service" "cloud_run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloud_build" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "container_registry" {
  service            = "containerregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secret_manager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloud_monitoring" {
  service            = "monitoring.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloud_logging" {
  service            = "logging.googleapis.com"
  disable_on_destroy = false
}

# Cloud Run Backend Service
resource "google_cloud_run_service" "backend" {
  name     = var.backend_service_name
  location = var.region
  
  depends_on = [google_project_service.cloud_run]

  template {
    spec {
      containers {
        image = var.backend_image
        
        ports {
          container_port = 8080
        }
        
        # Resource limits
        resources {
          limits = {
            cpu    = var.backend_cpu
            memory = var.backend_memory
          }
        }
        
        # Environment variables
        env {
          name  = "NODE_ENV"
          value = "production"
        }
        
        env {
          name  = "AUTH_TRUST_HOST"
          value = "true"
        }
        
        env {
          name  = "PORT"
          value = "8080"
        }
        
        # Secrets from Secret Manager
        env {
          name = "DATABASE_URL"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.database_url.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "AUTH_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.auth_secret.secret_id
              key  = "latest"
            }
          }
        }
        
        env {
          name = "GOOGLE_CLIENT_SECRET"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.google_client_secret.secret_id
              key  = "latest"
            }
          }
        }
      }
      
      # Scaling configuration
      container_concurrency = var.backend_concurrency
      timeout_seconds       = var.backend_timeout
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.backend_min_instances
        "autoscaling.knative.dev/maxScale" = var.backend_max_instances
        "run.googleapis.com/cpu-throttling" = "false"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

# Cloud Run Frontend Service
resource "google_cloud_run_service" "frontend" {
  name     = var.frontend_service_name
  location = var.region
  
  depends_on = [google_project_service.cloud_run]

  template {
    spec {
      containers {
        image = var.frontend_image
        
        ports {
          container_port = 80
        }
        
        # Resource limits
        resources {
          limits = {
            cpu    = var.frontend_cpu
            memory = var.frontend_memory
          }
        }
        
        # Backend URL for NGINX proxy
        env {
          name  = "BACKEND_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
      }
      
      container_concurrency = var.frontend_concurrency
    }
    
    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.frontend_min_instances
        "autoscaling.knative.dev/maxScale" = var.frontend_max_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  autogenerate_revision_name = true
}

# IAM policy to allow unauthenticated access to services
resource "google_cloud_run_service_iam_member" "backend_noauth" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_noauth" {
  service  = google_cloud_run_service.frontend.name
  location = google_cloud_run_service.frontend.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager Secrets
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret" "auth_secret" {
  secret_id = "auth-secret"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.secret_manager]
}

resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "google-client-secret"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.secret_manager]
}

# Grant Cloud Run service account access to secrets
data "google_project" "project" {
  project_id = var.project_id
}

resource "google_secret_manager_secret_iam_member" "database_url_access" {
  secret_id = google_secret_manager_secret.database_url.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "auth_secret_access" {
  secret_id = google_secret_manager_secret.auth_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

resource "google_secret_manager_secret_iam_member" "google_client_secret_access" {
  secret_id = google_secret_manager_secret.google_client_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_project.project.number}-compute@developer.gserviceaccount.com"
}

# Cloud Monitoring Alert Policies
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High Error Rate - Backend"
  combiner     = "OR"
  
  conditions {
    display_name = "Error rate > 5%"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.backend_service_name}\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class!=\"2xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  depends_on = [google_project_service.cloud_monitoring]
}

resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "High Response Latency - Backend"
  combiner     = "OR"
  
  conditions {
    display_name = "P95 latency > 2 seconds"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.backend_service_name}\" AND metric.type=\"run.googleapis.com/request_latencies\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 2000
      
      aggregations {
        alignment_period     = "300s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_95"
      }
    }
  }
  
  notification_channels = var.notification_channels
  
  depends_on = [google_project_service.cloud_monitoring]
}

# Outputs
output "backend_url" {
  description = "URL of the backend Cloud Run service"
  value       = google_cloud_run_service.backend.status[0].url
}

output "frontend_url" {
  description = "URL of the frontend Cloud Run service"
  value       = google_cloud_run_service.frontend.status[0].url
}

output "secret_ids" {
  description = "IDs of created secrets in Secret Manager"
  value = {
    database_url          = google_secret_manager_secret.database_url.secret_id
    auth_secret          = google_secret_manager_secret.auth_secret.secret_id
    google_client_secret = google_secret_manager_secret.google_client_secret.secret_id
  }
}
