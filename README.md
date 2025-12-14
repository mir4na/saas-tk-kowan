# NOTTU Monorepo

This repository contains the NOTTU note-taking SaaS application with a Node.js/Express backend and a React frontend. The project is structured as a simple monorepo with `backend/` and `frontend/` workspaces plus Docker Compose helpers for local development and production.

##  TAHAP-TAHAP DEPLOYMENT

### 1 Prerequisites & Setup

#### 1.1 **AWS Account Setup**
```bash
# Install AWS CLI
# Configure AWS credentials
aws configure
# Input:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (us-east-1)
# - Output format (json)
```

#### 1.2 **Install Dependencies**
```bash
# Install Node.js 22+
# Verify installation
node --version  # Should be v22.x.x

# Install Serverless Framework globally
npm install -g serverless

# Clone repository
git clone <repository-url>
cd saas-tk-kowan
```

### 2 Database Deployment (Amazon Aurora RDS)

#### 2.1 **Create Aurora PostgreSQL Cluster**

**Via AWS Console:**
1. Navigate to RDS → Create Database
2. Choose **Amazon Aurora**
3. Edition: **PostgreSQL-compatible**
4. Templates: **Production** (atau Dev/Test untuk development)
5. Settings:
   - DB cluster identifier: `nottu-db-cluster`
   - Master username: `admin` (atau sesuai preference)
   - Master password: (generate strong password)
6. DB instance class: 
   - Serverless v2: `db.serverless` (recommended untuk cost-efficiency)
   - Atau Provisioned: `db.t4g.medium`
7. Storage: Aurora auto-scales (mulai dari 10GB)
8. Connectivity:
   - VPC: Default VPC atau create new
   - Public access: **No** (security best practice)
   - VPC Security group: Create new
9. Additional configuration:
   - Initial database name: `kowan`
   - Enable Enhanced Monitoring
   - Enable encryption
10. Create database

**Via AWS CLI:**
```bash
aws rds create-db-cluster \
  --db-cluster-identifier nottu-db-cluster \
  --engine aurora-postgresql \
  --engine-version 14.9 \
  --master-username admin \
  --master-user-password <STRONG_PASSWORD> \
  --database-name kowan \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name default \
  --storage-encrypted

aws rds create-db-instance \
  --db-instance-identifier nottu-db-instance-1 \
  --db-instance-class db.t4g.medium \
  --engine aurora-postgresql \
  --db-cluster-identifier nottu-db-cluster
```

#### 2.2 **Configure Security Group**
```bash
# Get Lambda security group ID (after Lambda deployment)
LAMBDA_SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=nottu-lambda-sg" \
  --query 'SecurityGroups[0].GroupId' --output text)

# Add inbound rule to RDS security group
aws ec2 authorize-security-group-ingress \
  --group-id <RDS_SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 5432 \
  --source-group $LAMBDA_SG_ID
```

#### 2.3 **Run Database Migration**
```bash
cd backend

# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://admin:<PASSWORD>@<RDS_ENDPOINT>:5432/kowan"

# Run migration script
node src/utils/migrate.js
```

**migrate.js akan membuat tables:**
- `users` - User accounts dan profile data
- `notes` - User notes dengan isolation
- `passkey_challenges` - Temporary challenge storage untuk WebAuthn
- `authenticators` - Passkey credentials storage

### 3 S3 Bucket Deployment

#### 3.1 **Create S3 Bucket**
```bash
# Create bucket dengan encryption
aws s3api create-bucket \
  --bucket nottu-profile-photos \
  --region us-east-1 \
  --create-bucket-configuration LocationConstraint=us-east-1

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket nottu-profile-photos \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access (security best practice)
aws s3api put-public-access-block \
  --bucket nottu-profile-photos \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning (optional, untuk data protection)
aws s3api put-bucket-versioning \
  --bucket nottu-profile-photos \
  --versioning-configuration Status=Enabled
```

#### 3.2 **Configure Lifecycle Policy** (Optional - Cost Optimization)
```bash
# Create lifecycle policy file
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "Delete old versions after 30 days",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    }
  ]
}
EOF

# Apply lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket nottu-profile-photos \
  --lifecycle-configuration file://lifecycle-policy.json
```

### 4 Backend Deployment (AWS Lambda + API Gateway)

#### 4.1 **Configure Serverless Framework**

Create `backend/serverless.yml`:
```yaml
service: nottu-backend

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs22.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  timeout: 30
  memorySize: 512
  
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}
    JWT_EXPIRE: 7d
    AWS_S3_BUCKET: nottu-profile-photos
    RP_NAME: NOTTU
    RP_ID: ${env:RP_ID}  # Domain untuk production
    ORIGIN: ${env:ORIGIN}  # Frontend URL
    CORS_ORIGIN: ${env:CORS_ORIGIN}
  
  iam:
    role:
      statements:
        # S3 permissions
        - Effect: Allow
          Action:
            - s3:PutObject
            - s3:GetObject
            - s3:DeleteObject
          Resource: arn:aws:s3:::nottu-profile-photos/*
        
        # CloudWatch Logs permissions
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: '*'
        
        # VPC permissions (if Lambda in VPC for RDS access)
        - Effect: Allow
          Action:
            - ec2:CreateNetworkInterface
            - ec2:DescribeNetworkInterfaces
            - ec2:DeleteNetworkInterface
          Resource: '*'
  
  vpc:
    securityGroupIds:
      - ${env:LAMBDA_SECURITY_GROUP_ID}
    subnetIds:
      - ${env:SUBNET_ID_1}
      - ${env:SUBNET_ID_2}

functions:
  api:
    handler: index.handler
    events:
      - http:
          method: ANY
          path: /
          cors:
            origin: ${env:CORS_ORIGIN}
            headers:
              - Content-Type
              - Authorization
            allowCredentials: true
      - http:
          method: ANY
          path: '{proxy+}'
          cors:
            origin: ${env:CORS_ORIGIN}
            headers:
              - Content-Type
              - Authorization
            allowCredentials: true

plugins:
  - serverless-offline

package:
  exclude:
    - node_modules/**
    - .git/**
    - .env
    - tests/**
```

#### 4.2 **Setup Environment Variables**

Create `backend/.env.production`:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://admin:<PASSWORD>@<RDS_ENDPOINT>:5432/kowan
JWT_SECRET=<GENERATE_STRONG_SECRET>  # openssl rand -base64 32
JWT_EXPIRE=7d
AWS_S3_BUCKET=nottu-profile-photos
AWS_REGION=us-east-1
RP_NAME=NOTTU
RP_ID=api.nottu.com  # Sesuaikan dengan domain
ORIGIN=https://nottu.com  # Frontend URL
CORS_ORIGIN=https://nottu.com

# VPC Configuration (dari AWS Console)
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxx
SUBNET_ID_1=subnet-xxxxxxxx
SUBNET_ID_2=subnet-yyyyyyyy
```

#### 4.3 **Deploy Backend**
```bash
cd backend

# Install dependencies
npm install

# Install Serverless plugins
npm install --save-dev serverless-offline

# Load environment variables
export $(cat .env.production | xargs)

# Deploy to AWS
serverless deploy --stage prod

# Output akan menampilkan:
# - API Gateway endpoint URL
# - Lambda function ARN
# - Stack outputs
```

**Expected Output:**
```
Service Information
service: nottu-backend
stage: prod
region: us-east-1
stack: nottu-backend-prod
api keys:
  None
endpoints:
  ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
  ANY - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/{proxy+}
functions:
  api: nottu-backend-prod-api
```

#### 4.4 **Test Backend Deployment**
```bash
# Test health endpoint
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/health

# Expected response:
{
  "success": true,
  "message": "Notepad SaaS API is running",
  "timestamp": "2025-12-14T...",
  "environment": "production"
}

# Test database connection
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/test-db
```

#### 4.5 **Configure Custom Domain** (Optional but Recommended)

**Via AWS Console:**
1. API Gateway → Custom Domain Names → Create
2. Domain name: `api.nottu.com`
3. Certificate: Request/Import ACM certificate
4. Create API mapping:
   - API: nottu-backend-prod
   - Stage: prod
5. Update Route 53 DNS:
   - Create A record (Alias) pointing to API Gateway domain

**Via Serverless Framework:**
Add to `serverless.yml`:
```yaml
plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: api.nottu.com
    certificateName: '*.nottu.com'
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true
```

Deploy with domain:
```bash
serverless create_domain --stage prod
serverless deploy --stage prod
```

### 5 Frontend Deployment (AWS Amplify)

#### 5.1 **Configure Frontend Environment**

Create `frontend/.env.production`:
```bash
REACT_APP_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
# Atau jika menggunakan custom domain:
# REACT_APP_API_URL=https://api.nottu.com

REACT_APP_RP_ID=nottu.com
REACT_APP_RP_NAME=NOTTU
```

Update `frontend/src/services/api.js`:
```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### 5.2 **Deploy via AWS Amplify Console**

**Via AWS Console (Recommended):**

1. **Navigate to AWS Amplify Console**
   - Search for "Amplify" in AWS Console

2. **Create New App**
   - Click "New App" → "Host web app"

3. **Connect Repository**
   - Choose Git provider (GitHub, GitLab, Bitbucket, etc.)
   - Authorize AWS Amplify
   - Select repository: `saas-tk-kowan`
   - Select branch: `main` (atau branch production)

4. **Configure Build Settings**
   - App name: `nottu-frontend`
   - Environment: Production
   
   **Build settings (amplify.yml akan auto-detected):**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: frontend/build
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```

5. **Add Environment Variables**
   - Dalam Amplify Console → App settings → Environment variables
   - Add:
     - `REACT_APP_API_URL`: `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
     - `REACT_APP_RP_ID`: `nottu.com`
     - `REACT_APP_RP_NAME`: `NOTTU`

6. **Advanced Settings**
   - Build image: Amazon Linux 2023
   - Enable automatic builds on Git push
   - Enable PR previews (optional)

7. **Save and Deploy**
   - Click "Save and deploy"
   - Amplify akan automatically:
     - Clone repository
     - Install dependencies
     - Run build
     - Deploy ke CDN global

**Deployment Output:**
```
✓ Provision
✓ Build
✓ Deploy
✓ Verify

Your app is live at: https://main.xxxxxxxxxxxxxx.amplifyapp.com
```

#### 5.3 **Configure Custom Domain in Amplify**

1. **In Amplify Console:**
   - App settings → Domain management → Add domain
   - Domain name: `nottu.com`
   - Add `www.nottu.com` subdomain (optional)

2. **Update DNS (Route 53 or External DNS):**
   - Amplify akan provide CNAME/A records
   - Add records ke DNS provider:
     ```
     Type: CNAME
     Name: nottu.com
     Value: xxxxxxxxxxxxxx.cloudfront.net
     ```

3. **SSL Certificate:**
   - Amplify automatically provisions dan manages SSL certificate via AWS Certificate Manager
   - Certificate auto-renews

4. **Wait for DNS Propagation:**
   ```bash
   # Check DNS propagation
   dig nottu.com
   
   # Test HTTPS access
   curl -I https://nottu.com
   ```

#### 5.4 **Configure Amplify Build Settings** (Manual Method)

Create `amplify.yml` di root project:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/build
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

Commit dan push:
```bash
git add amplify.yml
git commit -m "Add Amplify build configuration"
git push origin main
```

#### 5.5 **Setup Redirects for SPA** (Important!)

In Amplify Console → App settings → Rewrites and redirects:

Add rule:
```
Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>
Target: /index.html
Type: 200 (Rewrite)
```

Atau create `frontend/public/_redirects`:
```
/*  /index.html  200
```

**Reasoning:** React Router menggunakan client-side routing, semua routes harus di-redirect ke index.html.

### 6 Post-Deployment Configuration

#### 6.1 **Update CORS Settings**

Update `backend/.env.production`:
```bash
CORS_ORIGIN=https://nottu.com
ORIGIN=https://nottu.com
RP_ID=nottu.com
```

Redeploy backend:
```bash
cd backend
serverless deploy --stage prod
```

#### 6.2 **Configure API Gateway Throttling**

Prevent abuse dan control costs:
```bash
# Create usage plan
aws apigateway create-usage-plan \
  --name "nottu-standard-plan" \
  --throttle "rateLimit=100,burstLimit=200" \
  --quota "limit=10000,period=DAY"

# Associate dengan API stage
aws apigateway create-usage-plan-key \
  --usage-plan-id <USAGE_PLAN_ID> \
  --key-id <API_KEY_ID> \
  --key-type API_KEY
```

**Limits:**
- Rate: 100 requests/second
- Burst: 200 requests
- Quota: 10,000 requests/day

#### 6.3 **Setup Monitoring & Alarms**

**CloudWatch Alarms untuk Lambda:**
```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nottu-lambda-errors \
  --alarm-description "Alert when Lambda errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=FunctionName,Value=nottu-backend-prod-api

# Lambda duration alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nottu-lambda-duration \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=FunctionName,Value=nottu-backend-prod-api
```

**CloudWatch Alarms untuk RDS:**
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name nottu-rds-cpu \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBClusterIdentifier,Value=nottu-db-cluster
```

#### 6.4 **Setup Backup & Disaster Recovery**

**RDS Automated Backups:**
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier nottu-db-cluster \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

**S3 Cross-Region Replication** (Optional):
```bash
# Enable versioning (prerequisite)
aws s3api put-bucket-versioning \
  --bucket nottu-profile-photos \
  --versioning-configuration Status=Enabled

# Create replication configuration
# (requires destination bucket in different region)
```

