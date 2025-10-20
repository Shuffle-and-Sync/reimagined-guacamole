# Security Policy

## Reporting Security Vulnerabilities

We take the security of Shuffle & Sync seriously. If you believe you have found a security vulnerability, please follow the responsible disclosure process outlined below.

### ⚠️ Important: Do NOT Report Security Issues Publicly

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please report security vulnerabilities by:

1. **Email**: Contact the development team directly through the security contact information provided in our [detailed security documentation](./docs/security/SECURITY_IMPROVEMENTS.md)
2. **Private disclosure**: Use GitHub's private vulnerability reporting feature if available
3. **Secure channels**: Contact us through the secure communication channels listed in our [contact page](./client/src/pages/contact.tsx)

### What to Include in Your Report

Please provide as much information as possible:

- **Type of vulnerability** and how it could be exploited
- **Step-by-step instructions** to reproduce the issue
- **Affected versions** or components
- **Potential impact** of the vulnerability
- **Suggested fixes** if you have any recommendations

### Response Timeline

- **Initial response**: Within 48 hours of receiving your report
- **Status updates**: Regular updates on our investigation progress
- **Resolution timeline**: Varies based on complexity and severity
- **Public disclosure**: Coordinated with reporter after fix is deployed

### Security Features

Shuffle & Sync implements comprehensive security measures:

- **Authentication**: Secure Google OAuth 2.0 with Auth.js
- **Session Management**: HTTP-only secure cookies with CSRF protection
- **Input Validation**: Comprehensive validation and sanitization
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Security Headers**: Implemented security middleware

For detailed information about our security improvements and measures, see [SECURITY_IMPROVEMENTS.md](./docs/security/SECURITY_IMPROVEMENTS.md).

### Security Remediation

If sensitive data (such as `.env.production` files or commits with credentials) is discovered in Git history, follow our comprehensive remediation guide: [SECURITY_REMEDIATION.md](./docs/security/SECURITY_REMEDIATION.md).

This guide provides step-by-step instructions for safely removing sensitive data from Git history using `git-filter-repo`.

### Supported Versions

We provide security updates for the following versions:

| Version              | Supported |
| -------------------- | --------- |
| Latest (main branch) | ✅        |
| Previous release     | ✅        |
| Older versions       | ❌        |

### Security Contact

For security-related questions or to report security issues, please contact the development team through the appropriate secure channels listed in our documentation.

---

**Thank you for helping keep Shuffle & Sync secure!**
