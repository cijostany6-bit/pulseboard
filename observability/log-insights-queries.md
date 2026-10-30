# CloudWatch Logs Insights Queries — PulseBoard

## Query 1: Recent Errors (Last 1 Hour)

```
SOURCE '/pulseboard/pulseboard'
| fields @timestamp, @message, service, status, responseTime
| filter @message like /ERROR/ or status >= 500
| sort @timestamp desc
| limit 50
```

## Query 2: Slow Requests (Response Time > 1s)

```
SOURCE '/pulseboard/pulseboard'
| fields @timestamp, service, path, responseTime
| filter responseTime > 1000
| sort responseTime desc
| limit 20
```

## Query 3: Request Count by Service

```
SOURCE '/pulseboard/pulseboard'
| fields service
| stats count(*) as requestCount by service
| sort requestCount desc
```

## Query 4: Error Rate by Service (Last 24 Hours)

```
SOURCE '/pulseboard/pulseboard'
| fields service, status
| filter status >= 400
| stats count(*) as errorCount by service, bin(1h)
| sort bin desc
```

## Query 5: Top 10 Slowest Endpoints

```
SOURCE '/pulseboard/pulseboard'
| fields path, responseTime
| filter responseTime > 0
| stats avg(responseTime) as avgLatency, max(responseTime) as maxLatency, count(*) as requests by path
| sort avgLatency desc
| limit 10
```

## Query 6: Health Check Failures

```
SOURCE '/pulseboard/pulseboard'
| fields @timestamp, service, status
| filter status = "unhealthy" or status = "degraded"
| sort @timestamp desc
| limit 30
```

## Query 7: Pod Restart Events

```
SOURCE '/pulseboard/pulseboard'
| fields @timestamp, @message
| filter @message like /restart/ or @message like /CrashLoopBackOff/ or @message like /OOMKilled/
| sort @timestamp desc
| limit 20
```

## Query 8: Request Volume Over Time

```
SOURCE '/pulseboard/pulseboard'
| fields @timestamp
| stats count(*) as requests by bin(5m)
| sort bin asc
```

## Query 9: Unique Users (Approximate)

```
SOURCE '/pulseboard/pulseboard'
| fields userId
| stats count_distinct(userId) as uniqueUsers
```

## Query 10: Service Availability (Uptime %)

```
SOURCE '/pulseboard/pulseboard'
| fields service, status
| stats count(*) as total, sum(status = "healthy" ? 1 : 0) as healthy by service
| eval availability = healthy / total * 100
| sort availability asc
```
