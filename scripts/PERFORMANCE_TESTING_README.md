# Performance Testing Scripts

This directory contains comprehensive performance testing tools for Shuffle & Sync.

## Available Scripts

### Load Testing (`load-test.ts`)

Tests application performance under expected normal load conditions.

**Purpose**: Validate that the application can handle typical production traffic levels.

**Usage**:

```bash
npm run test:load
```

**Configuration** (via environment variables):

```bash
TEST_URL=http://localhost:3000        # Target URL
CONCURRENT_USERS=50                   # Number of concurrent users (default: 50)
REQUESTS_PER_USER=100                 # Requests each user makes (default: 100)
LOAD_TEST_DURATION=60                 # Test duration in seconds (default: 60)
```

**Example**:

```bash
TEST_URL=http://localhost:3000 CONCURRENT_USERS=100 npm run test:load
```

**Metrics Collected**:

- Total requests and success/failure counts
- Average response time
- Min/Max response times
- P95 and P99 response time percentiles
- Requests per second (throughput)
- Error details and types

**Success Criteria**:

- Success rate ≥95%
- Average response time <500ms
- P95 response time <1000ms

---

### Stress Testing (`stress-test.ts`)

Tests application performance beyond expected load to identify breaking points.

**Purpose**: Determine system capacity limits and identify performance degradation thresholds.

**Usage**:

```bash
npm run test:stress
```

**Configuration** (via environment variables):

```bash
TEST_URL=http://localhost:3000        # Target URL
START_USERS=10                        # Initial concurrent users (default: 10)
MAX_USERS=200                         # Maximum concurrent users (default: 200)
USER_INCREMENT=10                     # Users to add per phase (default: 10)
INCREMENT_INTERVAL=30                 # Seconds between increments (default: 30)
STRESS_TEST_DURATION=300              # Total test duration in seconds (default: 300)
```

**Example**:

```bash
TEST_URL=http://localhost:3000 MAX_USERS=300 npm run test:stress
```

**Test Progression**:

1. Starts with `START_USERS` concurrent users
2. Every `INCREMENT_INTERVAL` seconds, adds `USER_INCREMENT` more users
3. Continues until reaching `MAX_USERS` or `STRESS_TEST_DURATION`
4. Reports metrics for each phase

**Metrics Collected** (per phase):

- Concurrent user count
- Total requests
- Success/failure counts
- Average and P95 response times
- Requests per second
- Error rate

**Success Criteria**:

- Success rate ≥90%
- Average response time <1000ms
- Breaking point identified when:
  - Error rate >5%, or
  - Average response time >2000ms

---

### Performance Demo (`performance-test-demo.ts`)

Displays information about available performance tests and optimization results.

**Usage**:

```bash
npm run test:performance:demo
```

**Shows**:

- Available test configurations
- Success criteria
- Usage examples
- Implemented optimizations
- Bundle size results

---

## Running the Tests

### Prerequisites

1. **Application must be running**:

   ```bash
   npm run dev
   ```

2. **Required endpoints must be accessible**:
   - `/api/health` - Health check endpoint
   - `/api/communities` - Communities listing
   - `/api/events` - Events listing
   - `/api/tournaments` - Tournaments listing

### Step-by-Step

1. **Start the application**:

   ```bash
   npm run dev
   ```

2. **Open a new terminal** and navigate to the project directory

3. **Run load test**:

   ```bash
   npm run test:load
   ```

4. **Or run stress test**:

   ```bash
   npm run test:stress
   ```

5. **Review results** in the terminal output

---

## Test Endpoints

Both tests target the following endpoints:

- `GET /api/health` - Health check
- `GET /api/communities` - Community listings
- `GET /api/events` - Event listings
- `GET /api/tournaments` - Tournament listings

Additional endpoints can be configured by modifying the `endpoints` array in the respective test files.

---

## Interpreting Results

### Load Test Results

Example output:

```
📊 Load Test Results
=====================================================
Endpoint: /api/health
  Total Requests: 5000
  Success: 4950 (99.00%)
  Failed: 50 (1.00%)
  Avg Response Time: 245.32ms
  Min: 45.12ms
  Max: 1234.56ms
  P95: 456.78ms
  P99: 789.01ms
  Throughput: 83.33 req/s

Overall Summary
=====================================================
Total Requests: 20000
Success Rate: 98.50%
Average Response Time: 312.45ms
Overall Throughput: 333.33 req/s
```

**What to look for**:

- ✅ Success rate >95%
- ✅ Average response time <500ms
- ✅ P95 <1000ms
- ❌ High error rates or slow responses indicate issues

### Stress Test Results

Example output:

```
📊 Stress Test Results
=====================================================
Phase 1 (10 users):
  Success Rate: 99.50%
  Avg Response: 123.45ms
  P95 Response: 234.56ms
  Error Rate: 0.50%

Phase 5 (50 users):
  Success Rate: 97.20%
  Avg Response: 456.78ms
  P95 Response: 789.01ms
  Error Rate: 2.80%

⚠️ Breaking point detected at Phase 8 (80 users)
  Error Rate: 6.20%
  Avg Response Time: 1234.56ms
```

**What to look for**:

- System capacity: Maximum users before breaking point
- Degradation pattern: How response times increase with load
- Breaking point: When error rate >5% or avg response >2000ms

---

## Troubleshooting

### Connection Refused / ECONNREFUSED

**Cause**: Application is not running or URL is incorrect.

**Solution**:

1. Ensure application is running: `npm run dev`
2. Verify URL in TEST_URL environment variable
3. Check that the port is correct (default: 3000)

### High Error Rates

**Cause**: Application struggling under load.

**Possible issues**:

- Database connection pool exhausted
- Memory limits reached
- CPU throttling
- Rate limiting triggered

**Solutions**:

- Review application logs
- Check database connection settings
- Monitor system resources
- Adjust rate limiting configuration

### Inconsistent Results

**Cause**: Background processes or network conditions.

**Solutions**:

- Run tests multiple times for average
- Close unnecessary applications
- Test on dedicated hardware/environment
- Run tests during low-traffic periods

---

## Performance Targets

Based on application requirements:

### Load Test Targets

- **Concurrent Users**: 50-100
- **Success Rate**: ≥95%
- **Average Response**: <500ms
- **P95 Response**: <1000ms
- **Throughput**: >50 req/s

### Stress Test Targets

- **Maximum Users**: 200+
- **Success Rate**: ≥90%
- **Average Response**: <1000ms
- **Breaking Point**: >100 concurrent users

---

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Start application
  run: npm run dev &

- name: Wait for startup
  run: sleep 30

- name: Run load tests
  run: npm run test:load
  env:
    TEST_URL: http://localhost:3000
    CONCURRENT_USERS: 50

- name: Run stress tests
  run: npm run test:stress
  env:
    TEST_URL: http://localhost:3000
    MAX_USERS: 100
```

---

## Related Documentation

- **Performance Checklist**: `../PERFORMANCE_OPTIMIZATION_CHECKLIST.md`
- **Deployment Guide**: `../docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Monitoring Guide**: `../monitoring/README.md`

---

**Last Updated**: 2025-10-18  
**Maintained By**: Shuffle & Sync Development Team
