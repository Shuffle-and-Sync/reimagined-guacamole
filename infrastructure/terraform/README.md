# Infrastructure as Code - Terraform

This directory contains Terraform configuration for provisioning and managing Shuffle & Sync infrastructure on Google Cloud Platform.

## Prerequisites

1. **Terraform** installed (version 1.0 or later)
2. **Google Cloud SDK** (gcloud CLI) installed and authenticated
3. **GCP Project** with billing enabled
4. **Appropriate IAM permissions** to create Cloud Run services, Secret Manager secrets, and monitoring resources

## Quick Start

### 1. Configure Variables

Copy the example variables file:
```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your configuration:
- Set `project_id` to your GCP project ID
- Update container image references
- Adjust resource limits and scaling parameters as needed

### 2. Initialize Terraform

```bash
terraform init
```

This downloads the required provider plugins.

### 3. Plan Deployment

Preview the resources that will be created:
```bash
terraform plan
```

Review the output carefully to ensure correctness.

### 4. Apply Configuration

Create the infrastructure:
```bash
terraform apply
```

Type `yes` when prompted to confirm.

## What Gets Created

This Terraform configuration provisions:

### Google Cloud Services
- Cloud Run API
- Cloud Build API
- Container Registry API
- Secret Manager API
- Cloud Monitoring API
- Cloud Logging API

### Cloud Run Services
- **Backend Service**: Node.js Express application
  - Auto-scaling configuration
  - Resource limits (CPU, memory)
  - Environment variables and secrets
  
- **Frontend Service**: NGINX serving React SPA
  - Auto-scaling configuration
  - Proxies API requests to backend

### Secret Manager
- `database-url`: SQLite Cloud connection string
- `auth-secret`: Authentication secret for Auth.js
- `google-client-secret`: Google OAuth client secret

### IAM Permissions
- Service account access to secrets
- Public access to Cloud Run services (allUsers)

### Monitoring
- Alert policy for high error rates (>5%)
- Alert policy for high latency (>2 seconds)

## Configuration Options

### Scaling Configuration

Adjust autoscaling in `terraform.tfvars`:

```hcl
# Backend scaling
backend_min_instances = "1"   # Set to 1+ to avoid cold starts
backend_max_instances = "10"  # Maximum instances for traffic spikes

# Frontend scaling
frontend_min_instances = "0"  # Can be 0 for cost savings
frontend_max_instances = "5"
```

### Resource Limits

Adjust CPU and memory:

```hcl
# Backend resources
backend_cpu    = "2"      # CPU cores
backend_memory = "2Gi"    # Memory allocation

# Frontend resources
frontend_cpu    = "1"
frontend_memory = "512Mi"
```

### Concurrency

Control request concurrency per instance:

```hcl
backend_concurrency  = 80   # Requests per backend instance
frontend_concurrency = 100  # Requests per frontend instance
```

## Managing Secrets

Secrets are created in Secret Manager but **not populated** by Terraform for security.

### Populate Secrets Manually

After running `terraform apply`, add secret values:

```bash
# Database URL
echo -n "sqlitecloud://host:port/db?apikey=KEY" | \
  gcloud secrets versions add database-url --data-file=-

# Auth Secret
openssl rand -base64 64 | \
  gcloud secrets versions add auth-secret --data-file=-

# Google OAuth Secret
echo -n "your-google-client-secret" | \
  gcloud secrets versions add google-client-secret --data-file=-
```

## Updating Infrastructure

### Modify Configuration

1. Edit `terraform.tfvars` or `.tf` files
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### Deploy New Container Images

Update the image variables in `terraform.tfvars`:
```hcl
backend_image  = "gcr.io/project/backend:v1.2.0"
frontend_image = "gcr.io/project/frontend:v1.2.0"
```

Then apply:
```bash
terraform apply
```

## State Management

### Local State (Default)

By default, Terraform stores state in `terraform.tfstate` locally.

**Important**: 
- Do NOT commit `terraform.tfstate` to version control
- `.tfstate` files are in `.gitignore`

### Remote State (Recommended for Teams)

For team collaboration, use Google Cloud Storage:

1. Create a GCS bucket for state:
```bash
gcloud storage buckets create gs://your-terraform-state-bucket \
  --project=your-project \
  --location=us-central1
```

2. Uncomment the backend configuration in `main.tf`:
```hcl
terraform {
  backend "gcs" {
    bucket = "your-terraform-state-bucket"
    prefix = "shuffle-sync/production"
  }
}
```

3. Re-initialize:
```bash
terraform init -migrate-state
```

## Monitoring and Alerts

### View Alert Policies

```bash
gcloud alpha monitoring policies list
```

### Configure Notification Channels

1. Create an email notification channel:
```bash
gcloud alpha monitoring channels create \
  --display-name="Production Team" \
  --type=email \
  --channel-labels=email_address=team@example.com
```

2. Get the channel ID and add to `terraform.tfvars`:
```hcl
notification_channels = ["projects/PROJECT/notificationChannels/CHANNEL_ID"]
```

3. Apply the changes:
```bash
terraform apply
```

## Destroy Infrastructure

To remove all created resources:

```bash
terraform destroy
```

**Warning**: This will delete all resources including services and data. Use with caution.

## Troubleshooting

### Permission Errors

Ensure your GCP user has the following roles:
- Cloud Run Admin
- Secret Manager Admin
- Monitoring Admin
- Service Usage Admin

Grant roles:
```bash
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:your-email@example.com" \
  --role="roles/run.admin"
```

### API Not Enabled

If you get "API not enabled" errors:
```bash
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### State Lock Errors

If using remote state and encountering lock errors:
```bash
terraform force-unlock LOCK_ID
```

## Best Practices

1. **Always run `terraform plan`** before applying changes
2. **Use remote state** for team collaboration
3. **Never commit secrets** to version control
4. **Tag infrastructure resources** for cost tracking
5. **Review state changes** carefully in pull requests
6. **Document manual changes** made outside Terraform

## Additional Resources

- [Terraform Google Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
- [Cloud Run Terraform Examples](https://cloud.google.com/run/docs/configuring/services)
- [Secret Manager Best Practices](https://cloud.google.com/secret-manager/docs/best-practices)
- [Main Deployment Guide](../../DEPLOYMENT.md)
