# QuickSight Setup — PulseBoard

## Overview

Amazon QuickSight provides business intelligence dashboards for PulseBoard,
making service health data accessible to both engineers and non-technical stakeholders.

## Architecture

```
PulseBoard Services → CloudWatch Logs/Metrics → QuickSight Dataset → QuickSight Dashboard
                                                              ↓
                                                    Email/Embed/Public Link
```

## Prerequisites

1. AWS account with QuickSight enabled
2. CloudWatch log group `/pulseboard/pulseboard` with data flowing
3. QuickSight user created (admin or author role)

## Step 1: Enable QuickSight

1. Go to AWS Console → QuickSight
2. Click **Sign up for QuickSight** (if not already signed up)
3. Choose **Standard** edition
4. Select your region (eu-central-1 or us-east-1)
5. Enter your email and create account
6. Wait for activation (1-2 minutes)

## Step 2: Connect CloudWatch as Data Source

1. In QuickSight console, click **Datasets** → **New dataset**
2. Choose **CloudWatch** as the data source
3. Configure:
   - **Name:** PulseBoard CloudWatch Metrics
   - **Region:** eu-central-1 (or us-east-1)
   - **Log Group:** /pulseboard/pulseboard
4. Click **Create data source**
5. Select the metrics you want to visualize:
   - FiveXXCount
   - ApiLatency
   - ErrorCount
6. Click **Visualize**

## Step 3: Create Dashboard

### Widget 1: Service Health Overview
- **Type:** KPI / Scorecard
- **Field:** status (count of healthy vs unhealthy)
- **Filter:** Last 5 minutes
- **Color:** Green for healthy, Red for unhealthy

### Widget 2: Response Time Trend
- **Type:** Line chart
- **X-axis:** recordedAt (time)
- **Y-axis:** responseTime (average)
- **Group by:** service
- **Filter:** Last 1 hour

### Widget 3: Error Rate by Service
- **Type:** Bar chart
- **X-axis:** service
- **Y-axis:** count of 5xx errors
- **Filter:** Last 24 hours

### Widget 4: CPU & Memory Usage
- **Type:** Area chart
- **X-axis:** recordedAt (time)
- **Y-axis:** cpu, memory (average)
- **Group by:** service
- **Filter:** Last 1 hour

### Widget 5: Alert History
- **Type:** Table
- **Columns:** timestamp, service, message, severity
- **Sort:** timestamp desc
- **Filter:** Last 7 days

### Widget 6: Service Availability (%)
- **Type:** Gauge
- **Value:** (healthy checks / total checks) * 100
- **Target:** 99.5%

## Step 4: Share Dashboard

### Option A: Email Report
1. Click **Share** → **Email report**
2. Enter recipient emails
3. Set schedule (daily/weekly)
4. Click **Send**

### Option B: Public Link (for portfolio)
1. Click **Share** → **Generate public link**
2. Copy the link
3. Add to PulseBoard README

### Option C: Embed in Website
1. Click **Share** → **Embed**
2. Copy the embed code
3. Add to your frontend (React component)

## Step 5: Add to PulseBoard README

Add this section to README.md:

```markdown
## Monitoring Dashboard

PulseBoard includes a QuickSight dashboard for real-time visualization:

- **Service Health:** Green/red status for all 5 services
- **Latency Trends:** Response time over the last hour
- **Error Rates:** 5xx errors by service
- **Resource Usage:** CPU and memory utilization
- **Alert History:** Recent alerts with severity

[View Live Dashboard](https://quicksight.aws.amazon.com/...)
```

## Cost

| Item | Cost |
|---|---|
| QuickSight Standard (1 user) | $9/month (first 30 days free) |
| SPICE (10GB) | Free |
| CloudWatch data transfer | Included in QuickSight |
| **Total for demo** | **$0 (30-day free trial)** |

## Cleanup

When done with the demo:
1. Delete the QuickSight dashboard
2. Delete the dataset
3. Delete the data source
4. Cancel QuickSight subscription (or let it expire)

## Interview Talking Points

> "I added Amazon QuickSight to PulseBoard so that anyone — even non-technical stakeholders — can look at a dashboard and immediately see if services are healthy. CloudWatch is great for engineers, but QuickSight makes the data accessible to everyone. It connects directly to CloudWatch, so there's no ETL pipeline to build. The dashboard shows service health, latency trends, error rates, and resource usage — all updating in real time."

> "I chose QuickSight over Grafana because it's AWS-native, requires zero infrastructure management, and integrates directly with CloudWatch. For a small team, that's a big win — no servers to maintain, no dashboards to host."

## Updated Resume Bullet

```
"Added Amazon QuickSight BI dashboards to PulseBoard for real-time visualization
of service health, latency trends, error rates, and resource utilization — making
monitoring data accessible to both engineers and non-technical stakeholders."
```
EOF

echo "✅ QuickSight setup guide created"