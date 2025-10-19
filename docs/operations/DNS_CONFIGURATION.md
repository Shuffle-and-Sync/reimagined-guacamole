# DNS Configuration Guide

This guide covers DNS configuration requirements for deploying Shuffle & Sync to production.

## Overview

Proper DNS configuration is essential for:
- Making your application accessible via custom domain
- Enabling HTTPS/SSL certificates
- Configuring subdomains for split frontend/backend deployment
- Setting up email delivery (SPF, DKIM)

## Prerequisites

- Custom domain name registered with a domain registrar
- Access to domain's DNS management console
- Cloud Run services deployed and running
- Service URLs from Cloud Run deployment

## DNS Configuration Options

### Option 1: Single Domain (Unified Deployment)

Use one domain for both frontend and backend:

**Example**: `shufflesync.com`
- Frontend: `shufflesync.com`
- Backend API: `shufflesync.com/api/*`

**Pros**: Simpler configuration, no CORS issues
**Cons**: Cannot scale frontend/backend independently

### Option 2: Subdomain Architecture (Split Deployment)

Use subdomains to separate frontend and backend:

**Example**:
- Frontend: `shufflesync.com` or `app.shufflesync.com`
- Backend API: `api.shufflesync.com`

**Pros**: Independent scaling, better separation of concerns
**Cons**: Requires CORS configuration, more complex setup

## Cloud Run Domain Mapping

### Step 1: Get Cloud Run Service URLs

After deploying to Cloud Run, get your service URLs:

```bash
# Backend service URL
gcloud run services describe shuffle-and-sync-backend \
  --region us-central1 \
  --format="value(status.url)"

# Frontend service URL  
gcloud run services describe shuffle-and-sync-frontend \
  --region us-central1 \
  --format="value(status.url)"
```

Example output:
- Backend: `https://shuffle-and-sync-backend-abc123-uc.a.run.app`
- Frontend: `https://shuffle-and-sync-frontend-xyz789-uc.a.run.app`

### Step 2: Map Custom Domain to Cloud Run

#### For Frontend

```bash
# Map your domain to the frontend service
gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain app.shufflesync.com \
  --region us-central1
```

#### For Backend

```bash
# Map API subdomain to backend service
gcloud run domain-mappings create \
  --service shuffle-and-sync-backend \
  --domain api.shufflesync.com \
  --region us-central1
```

### Step 3: Get DNS Records from Cloud Run

After creating the domain mapping, Cloud Run provides DNS records:

```bash
# Get DNS configuration for frontend
gcloud run domain-mappings describe \
  --domain app.shufflesync.com \
  --region us-central1
```

Output will include:
```
DNS records that must be configured:
  Type: A
  Name: app.shufflesync.com
  Value: 216.239.32.21

  Type: AAAA
  Name: app.shufflesync.com
  Value: 2001:4860:4802:32::15

  Type: A
  Name: app.shufflesync.com
  Value: 216.239.34.21
  ...
```

## DNS Record Configuration

### Required DNS Records

Configure the following records in your DNS provider:

#### A Records (IPv4)

```
Type: A
Name: app (or @)
Value: 216.239.32.21
TTL: 3600

Type: A
Name: app (or @)
Value: 216.239.34.21
TTL: 3600

Type: A
Name: app (or @)
Value: 216.239.36.21
TTL: 3600

Type: A
Name: app (or @)
Value: 216.239.38.21
TTL: 3600
```

#### AAAA Records (IPv6)

```
Type: AAAA
Name: app (or @)
Value: 2001:4860:4802:32::15
TTL: 3600

Type: AAAA
Name: app (or @)
Value: 2001:4860:4802:34::15
TTL: 3600

Type: AAAA
Name: app (or @)
Value: 2001:4860:4802:36::15
TTL: 3600

Type: AAAA
Name: app (or @)
Value: 2001:4860:4802:38::15
TTL: 3600
```

**Note**: Use `@` for root domain or subdomain name (e.g., `app`, `api`)

### Example Configuration by DNS Provider

#### Cloudflare

1. Log in to Cloudflare Dashboard
2. Select your domain
3. Navigate to DNS → Records
4. Click "Add record"
5. Add each A and AAAA record as shown above
6. Set Proxy status: DNS only (grey cloud) initially
7. After verification, enable Cloudflare Proxy (orange cloud) for DDoS protection

#### Google Domains

1. Log in to Google Domains
2. Select your domain
3. Navigate to DNS
4. Custom records → Manage custom records
5. Add each A and AAAA record
6. Save changes

#### Namecheap

1. Log in to Namecheap
2. Domain List → Manage
3. Advanced DNS
4. Add New Record for each A and AAAA record
5. Save all changes

#### Route 53 (AWS)

1. Log in to AWS Console
2. Navigate to Route 53
3. Hosted zones → Select your domain
4. Create Record Set
5. Add each A and AAAA record
6. Create records

## Subdomain Configuration

### WWW Redirect

To redirect `www.shufflesync.com` to `shufflesync.com`:

```
Type: CNAME
Name: www
Value: shufflesync.com
TTL: 3600
```

Or configure HTTP redirect in your DNS provider's dashboard.

### API Subdomain

For backend API:

```
Type: A
Name: api
Value: [Cloud Run IP addresses]
TTL: 3600
```

Repeat for all A and AAAA records with `Name: api`

### Admin Subdomain (Optional)

For admin panel if separate:

```
Type: A
Name: admin
Value: [Cloud Run IP addresses]
TTL: 3600
```

## Email Configuration (Optional)

If using custom domain for email (SendGrid, etc.):

### SPF Record

```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
TTL: 3600
```

### DKIM Records

Add DKIM records provided by SendGrid:

```
Type: CNAME
Name: em1234._domainkey
Value: em1234.sendgrid.net
TTL: 3600
```

### DMARC Record

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@shufflesync.com
TTL: 3600
```

## DNS Propagation

After configuring DNS records:

1. **Propagation Time**: 
   - Typically: 5-30 minutes
   - Maximum: 24-48 hours
   - TTL dependent

2. **Check Propagation**:
   ```bash
   # Check A records
   dig app.shufflesync.com A
   
   # Check AAAA records
   dig app.shufflesync.com AAAA
   
   # Check from multiple locations
   # Use: https://dnschecker.org
   ```

3. **Verify Cloud Run Mapping**:
   ```bash
   # Check domain mapping status
   gcloud run domain-mappings describe \
     --domain app.shufflesync.com \
     --region us-central1
   ```

## SSL Certificate Provisioning

### Automatic Provisioning (Cloud Run)

Cloud Run automatically provisions SSL certificates:

1. **Add Domain Mapping** (as shown above)
2. **Configure DNS Records** properly
3. **Wait for Validation** (5-30 minutes)
4. **Certificate Auto-Provision** via Let's Encrypt

### Check Certificate Status

```bash
# Check certificate status
gcloud run domain-mappings describe \
  --domain app.shufflesync.com \
  --region us-central1 \
  --format="value(status.conditions)"
```

Status progression:
- `CertificatePending`: DNS validation in progress
- `Ready`: Certificate provisioned, domain ready

### Certificate Details

- **Provider**: Let's Encrypt (via Google Cloud)
- **Type**: Domain Validated (DV)
- **Validity**: 90 days (auto-renewed)
- **Protocol**: TLS 1.2, TLS 1.3
- **Wildcard**: Not supported (need separate mapping per subdomain)

## Troubleshooting

### Domain Not Resolving

**Issue**: Domain doesn't resolve to Cloud Run service

**Solutions**:
1. Verify DNS records are correctly configured
2. Wait for DNS propagation (up to 48 hours)
3. Check with multiple DNS checkers
4. Verify TTL hasn't cached old records

```bash
# Clear local DNS cache (macOS)
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Clear local DNS cache (Linux)
sudo systemd-resolve --flush-caches

# Clear local DNS cache (Windows)
ipconfig /flushdns
```

### SSL Certificate Not Provisioning

**Issue**: Certificate stuck in "Pending" status

**Solutions**:
1. Verify DNS records are correct
2. Ensure domain ownership is verified
3. Check for CAA records blocking Let's Encrypt
4. Wait up to 24 hours for initial provisioning

```bash
# Check CAA records
dig shufflesync.com CAA

# If blocking, add Let's Encrypt CAA record
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
```

### CNAME Flattening Required

**Issue**: DNS provider doesn't support CNAME at root

**Solutions**:
1. Use ALIAS or ANAME records (if supported)
2. Use A/AAAA records provided by Cloud Run
3. Switch to DNS provider with CNAME flattening (Cloudflare, Route 53)

### Mixed Content Warnings

**Issue**: HTTPS site loading HTTP resources

**Solutions**:
1. Update all resource URLs to HTTPS
2. Use relative URLs or protocol-relative URLs
3. Set Content Security Policy headers

## Best Practices

1. **Use Subdomains**: Separate frontend and backend for flexibility
2. **Enable DNSSEC**: Additional security layer (if provider supports)
3. **Set Appropriate TTLs**: 
   - Development: 300 seconds (5 minutes)
   - Production: 3600 seconds (1 hour)
4. **Monitor DNS**: Set up uptime monitoring
5. **Document Changes**: Keep record of all DNS changes
6. **Use Infrastructure as Code**: Manage DNS via Terraform
7. **Enable CAA Records**: Restrict which CAs can issue certificates
8. **Regular Audits**: Review DNS configuration quarterly

## DNS as Code (Optional)

Manage DNS with Terraform:

```hcl
# Example for Cloudflare
resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  type    = "A"
  value   = "216.239.32.21"
  ttl     = 3600
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  type    = "A"
  value   = "216.239.32.21"
  ttl     = 3600
  proxied = true
}
```

## Monitoring and Maintenance

### Setup Monitoring

1. **Uptime Monitoring**: Use Uptime Robot, Pingdom, or Cloud Monitoring
2. **DNS Monitoring**: Monitor DNS resolution times
3. **SSL Monitoring**: Alert on certificate expiration

```bash
# Check SSL certificate expiration
echo | openssl s_client -servername app.shufflesync.com \
  -connect app.shufflesync.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

### Regular Maintenance

- **Monthly**: Review DNS records for accuracy
- **Quarterly**: Audit DNS provider security settings  
- **Annually**: Review DNS provider contract/pricing
- **As Needed**: Update records for infrastructure changes

## Emergency DNS Changes

For urgent DNS changes:

1. **Lower TTL** (1 hour before change):
   - Change TTL to 300 seconds
   - Wait for old TTL to expire

2. **Make Changes**:
   - Update DNS records
   - Verify changes with `dig`

3. **Monitor**:
   - Watch application metrics
   - Check error rates
   - Verify user access

4. **Restore TTL**:
   - After verification, restore normal TTL (3600)

## Additional Resources

- [Google Cloud Run Domain Mapping](https://cloud.google.com/run/docs/mapping-custom-domains)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [DNS Propagation Checker](https://dnschecker.org)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
- [Cloudflare DNS](https://www.cloudflare.com/dns/)
- [Main Deployment Guide](../../DEPLOYMENT.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
