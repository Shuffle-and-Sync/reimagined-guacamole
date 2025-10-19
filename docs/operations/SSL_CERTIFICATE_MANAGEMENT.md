# SSL/TLS Certificate Management Guide

This guide covers SSL/TLS certificate management for Shuffle & Sync, including automatic provisioning, monitoring, and troubleshooting.

## Overview

Shuffle & Sync uses automatic SSL/TLS certificates provisioned by Google Cloud Run through Let's Encrypt. This provides:

- Automatic certificate provisioning
- Auto-renewal (no manual intervention)
- Modern TLS protocols (TLS 1.2, TLS 1.3)
- Strong cipher suites
- Free certificates

## Certificate Provisioning Process

### Automatic Provisioning (Recommended)

When you map a custom domain to Cloud Run, SSL certificates are automatically provisioned:

**Prerequisites**:

1. Domain ownership verified
2. DNS records correctly configured
3. Domain mapping created in Cloud Run

**Process**:

```bash
# 1. Create domain mapping
gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain app.shufflesync.com \
  --region us-central1

# 2. Configure DNS (see DNS_CONFIGURATION.md)

# 3. Wait for certificate provisioning (5-30 minutes)

# 4. Verify certificate status
gcloud run domain-mappings describe \
  --domain app.shufflesync.com \
  --region us-central1
```

### Certificate Provisioning Stages

1. **DNS Validation** (5-15 minutes)
   - Let's Encrypt validates domain ownership
   - Checks DNS records are correctly configured
   - Status: `CertificatePending`

2. **Certificate Issuance** (1-5 minutes)
   - Let's Encrypt issues the certificate
   - Certificate installed on Cloud Run
   - Status: `Ready`

3. **Activation** (< 1 minute)
   - HTTPS enabled for your domain
   - HTTP automatically redirects to HTTPS
   - Service accessible via custom domain

## Certificate Details

### Certificate Information

- **Certificate Authority**: Let's Encrypt
- **Type**: Domain Validated (DV)
- **Validity Period**: 90 days
- **Renewal**: Automatic (60 days before expiration)
- **Key Type**: RSA 2048-bit or ECDSA P-256
- **Signature Algorithm**: SHA-256

### Supported Protocols

- **TLS 1.3**: Preferred, modern protocol
- **TLS 1.2**: Fallback for older clients
- **TLS 1.1**: Not supported (deprecated)
- **TLS 1.0**: Not supported (deprecated)
- **SSL 3.0**: Not supported (insecure)

### Cipher Suites

Cloud Run supports modern, secure cipher suites:

**TLS 1.3** (Recommended):

- `TLS_AES_128_GCM_SHA256`
- `TLS_AES_256_GCM_SHA384`
- `TLS_CHACHA20_POLY1305_SHA256`

**TLS 1.2** (Compatibility):

- `ECDHE-RSA-AES128-GCM-SHA256`
- `ECDHE-RSA-AES256-GCM-SHA384`
- `ECDHE-RSA-CHACHA20-POLY1305`

## Certificate Monitoring

### Check Certificate Status

#### Using gcloud

```bash
# Check domain mapping status
gcloud run domain-mappings describe \
  --domain app.shufflesync.com \
  --region us-central1 \
  --format="value(status.conditions)"
```

Expected output when ready:

```
Ready
```

#### Using OpenSSL

```bash
# Check certificate details
echo | openssl s_client -servername app.shufflesync.com \
  -connect app.shufflesync.com:443 2>/dev/null | \
  openssl x509 -noout -text

# Check expiration date
echo | openssl s_client -servername app.shufflesync.com \
  -connect app.shufflesync.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

#### Using curl

```bash
# Verify HTTPS is working
curl -I https://app.shufflesync.com

# Check TLS version
curl -v --tlsv1.3 https://app.shufflesync.com 2>&1 | grep "TLSv"
```

### Automated Monitoring

Set up automated certificate monitoring:

```bash
# Create a monitoring script
cat > scripts/check-ssl.sh << 'EOF'
#!/bin/bash
DOMAIN="app.shufflesync.com"
DAYS_WARN=30

# Get expiration date
EXPIRY=$(echo | openssl s_client -servername $DOMAIN \
  -connect $DOMAIN:443 2>/dev/null | \
  openssl x509 -noout -enddate | cut -d= -f2)

# Convert to Unix timestamp
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "Certificate for $DOMAIN expires in $DAYS_LEFT days"

if [ $DAYS_LEFT -lt $DAYS_WARN ]; then
  echo "⚠️  WARNING: Certificate expiring soon!"
  # Send alert (e.g., via email, Slack, PagerDuty)
fi
EOF

chmod +x scripts/check-ssl.sh
```

### SSL Labs Testing

Test certificate configuration quality:

```bash
# Visit SSL Labs for comprehensive analysis
# https://www.ssllabs.com/ssltest/analyze.html?d=app.shufflesync.com
```

Target rating: **A+**

## Certificate Renewal

### Automatic Renewal

Cloud Run handles renewal automatically:

- Renewal starts 60 days before expiration
- New certificate provisioned in background
- Zero-downtime certificate replacement
- No action required from administrators

### Manual Certificate Check

Verify auto-renewal is working:

```bash
# Schedule monthly check (cron example)
# Add to crontab: 0 9 1 * * /path/to/check-ssl.sh

# Check renewal logs
gcloud logging read "resource.type=cloud_run_revision AND
  textPayload=~certificate" \
  --limit 50 \
  --format json
```

## Troubleshooting

### Certificate Not Provisioning

**Symptom**: Domain mapping stuck in `CertificatePending` status

**Common Causes**:

1. DNS not configured correctly
2. DNS not yet propagated
3. CAA records blocking Let's Encrypt
4. Previous certificate still cached

**Solutions**:

1. **Verify DNS Configuration**:

   ```bash
   # Check A records
   dig app.shufflesync.com A +short

   # Check AAAA records
   dig app.shufflesync.com AAAA +short

   # Ensure they match Cloud Run IPs
   ```

2. **Wait for DNS Propagation**:
   - Allow up to 24 hours
   - Check multiple DNS servers
   - Use https://dnschecker.org

3. **Check CAA Records**:

   ```bash
   dig shufflesync.com CAA +short
   ```

   If CAA records exist but don't include Let's Encrypt:

   ```bash
   # Add Let's Encrypt CAA record in DNS
   Type: CAA
   Name: @
   Value: 0 issue "letsencrypt.org"
   ```

4. **Delete and Recreate Mapping**:

   ```bash
   # Delete existing mapping
   gcloud run domain-mappings delete \
     --domain app.shufflesync.com \
     --region us-central1

   # Wait 5 minutes

   # Recreate mapping
   gcloud run domain-mappings create \
     --service shuffle-and-sync-frontend \
     --domain app.shufflesync.com \
     --region us-central1
   ```

### Certificate Warnings in Browser

**Symptom**: Browser shows certificate warning/error

**Possible Issues**:

1. **Certificate Not Yet Provisioned**:
   - Wait for provisioning to complete
   - Check status with `gcloud run domain-mappings describe`

2. **Wrong Certificate Being Served**:
   - Clear browser cache
   - Test in incognito/private mode
   - Verify domain mapping is correct

3. **Mixed Content**:
   - Application loading HTTP resources on HTTPS page
   - Update all resource URLs to HTTPS
   - Set Content Security Policy headers

### Certificate Renewal Failed

**Symptom**: Certificate expired or renewal failed

**This should never happen** with Cloud Run's automatic renewal, but if it does:

1. **Check Domain Mapping Status**:

   ```bash
   gcloud run domain-mappings describe \
     --domain app.shufflesync.com \
     --region us-central1
   ```

2. **Recreate Domain Mapping**:

   ```bash
   # This forces new certificate provisioning
   gcloud run domain-mappings delete \
     --domain app.shufflesync.com \
     --region us-central1

   gcloud run domain-mappings create \
     --service shuffle-and-sync-frontend \
     --domain app.shufflesync.com \
     --region us-central1
   ```

3. **Contact Support**:
   If renewal continues to fail, contact Google Cloud Support

## Security Best Practices

### HSTS (HTTP Strict Transport Security)

Configure HSTS headers in your application:

```typescript
// In Express middleware
app.use((req, res, next) => {
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );
  next();
});
```

HSTS configuration:

- `max-age=31536000`: 1 year
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for HSTS preload list

### HSTS Preloading

Submit domain to HSTS preload list:

1. Configure HSTS header (as above)
2. Visit https://hstspreload.org
3. Submit your domain
4. Wait for inclusion in browser preload lists

### Content Security Policy

Implement CSP headers:

```typescript
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://trusted-cdn.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.shufflesync.com; " +
      "upgrade-insecure-requests;",
  );
  next();
});
```

### Additional Security Headers

```typescript
// Security headers middleware
app.use((req, res, next) => {
  // HSTS
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  next();
});
```

## Certificate Monitoring Automation

### Create Monitoring Alert

Set up Cloud Monitoring alert for certificate expiration:

```bash
# Create alert policy
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="SSL Certificate Expiring Soon" \
  --condition-display-name="Certificate expires in < 7 days" \
  --condition-threshold-value=7 \
  --condition-threshold-duration=3600s
```

### Monitoring Dashboard

Add certificate metrics to monitoring dashboard:

```json
{
  "displayName": "SSL Certificate Status",
  "mosaicLayout": {
    "tiles": [
      {
        "widget": {
          "title": "Certificate Expiration",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/certificate/expiration_time\""
              }
            }
          }
        }
      }
    ]
  }
}
```

## Advanced Configuration

### Custom Certificate (Not Recommended)

While Cloud Run supports custom certificates via load balancer, automatic Let's Encrypt certificates are recommended. Only use custom certificates if you have specific requirements (e.g., EV certificates).

**Note**: Custom certificates require additional setup with Google Cloud Load Balancer and come with additional costs and management overhead.

### Multiple Domains

For multiple domains on the same service:

```bash
# Add each domain separately
gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain shufflesync.com \
  --region us-central1

gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain www.shufflesync.com \
  --region us-central1

gcloud run domain-mappings create \
  --service shuffle-and-sync-frontend \
  --domain app.shufflesync.com \
  --region us-central1
```

Each domain gets its own certificate automatically.

## Compliance and Auditing

### PCI DSS Requirements

For PCI DSS compliance:

- ✅ TLS 1.2+ required (supported)
- ✅ Strong cipher suites (supported)
- ✅ Current certificates (auto-renewed)
- ✅ Regular security scanning (use SSL Labs)

### Certificate Logging

Log all certificate-related events:

```bash
# View certificate provisioning logs
gcloud logging read "resource.type=cloud_run_revision AND
  (textPayload=~certificate OR jsonPayload.message=~certificate)" \
  --limit 100 \
  --format json
```

### Audit Schedule

- **Weekly**: Automated certificate expiration check
- **Monthly**: Manual SSL Labs security test
- **Quarterly**: Review security headers configuration
- **Annually**: Full security audit including certificates

## Emergency Procedures

### Certificate Compromise

If a private key is compromised:

1. **Immediately revoke** the certificate:
   - Contact Let's Encrypt
   - Use certificate revocation API

2. **Delete domain mapping**:

   ```bash
   gcloud run domain-mappings delete \
     --domain app.shufflesync.com \
     --region us-central1
   ```

3. **Recreate mapping** (new certificate):

   ```bash
   gcloud run domain-mappings create \
     --service shuffle-and-sync-frontend \
     --domain app.shufflesync.com \
     --region us-central1
   ```

4. **Investigate** how compromise occurred

5. **Document** incident and response

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)
- [HSTS Preload List](https://hstspreload.org/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [DNS Configuration Guide](DNS_CONFIGURATION.md)
- [Main Deployment Guide](../../DEPLOYMENT.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
