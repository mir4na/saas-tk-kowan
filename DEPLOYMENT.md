# NOTTU - AWS Deployment Guide

Panduan lengkap deployment aplikasi NOTTU ke AWS Academy menggunakan arsitektur serverless.

## Arsitektur Deployment

```
Frontend (React)
    ↓
AWS Amplify Hosting
    ↓
    → API Gateway
         ↓
      AWS Lambda (Express via serverless-http)
         ↓
      Neon PostgreSQL (Cloud Database)
```

---

## Prerequisites

1. **AWS Academy Account** dengan akses ke:
   - AWS Lambda
   - API Gateway
   - AWS Amplify
   - IAM Roles

2. **AWS CLI** terinstall dan terkonfigurasi
   ```bash
   aws configure
   # Input: AWS Access Key ID
   # Input: AWS Secret Access Key
   # Region: us-east-1
   # Output format: json
   ```

3. **Serverless Framework** (optional, untuk deployment otomatis)
   ```bash
   npm install -g serverless
   ```

4. **Node.js** v18.x atau lebih tinggi

---

## Part 1: Deploy Backend ke AWS Lambda + API Gateway

### Option A: Manual Deployment via AWS Console

#### Step 1: Prepare Lambda Package

```bash
cd backend

# Install production dependencies only
npm install --production

# Create deployment package
zip -r nottu-lambda.zip . -x "*.git*" "node_modules/@types/*" "__tests__/*" "coverage/*"
```

#### Step 2: Create Lambda Function

1. Login ke **AWS Console** → **Lambda**
2. Click **Create function**
3. Pilih **Author from scratch**
4. Function name: `nottu-api`
5. Runtime: **Node.js 18.x**
6. Architecture: **x86_64**
7. Click **Create function**

#### Step 3: Upload Code

1. Di halaman Lambda function → **Code** tab
2. Click **Upload from** → **.zip file**
3. Upload file `nottu-lambda.zip`
4. Handler: `lambda.handler`

#### Step 4: Configure Environment Variables

Di **Configuration** → **Environment variables**, tambahkan:

```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_fEJZvrWmu72o@ep-winter-lake-ahhvdp0z-pooler.c-3.us-east-1.aws.neon.tech/kowan?sslmode=require
JWT_SECRET=60d95f7cd4d19756f0f2c39303b5bec6be5f8739a288bbf3bd96f813d4fb3271
JWT_EXPIRE=7d
CORS_ORIGIN=*
APP_NAME=NOTTU
```

#### Step 5: Configure Lambda Settings

1. **Configuration** → **General configuration**
   - Memory: **512 MB**
   - Timeout: **30 seconds**

2. **Configuration** → **Permissions**
   - Pastikan Lambda execution role punya akses ke CloudWatch Logs

#### Step 6: Create API Gateway

1. Buka **API Gateway** console
2. Click **Create API**
3. Pilih **HTTP API** → **Build**
4. API name: `nottu-api`
5. Click **Add integration**:
   - Integration type: **Lambda**
   - Lambda function: `nottu-api`
   - Version: **2.0**
6. Configure routes:
   - Method: **ANY**
   - Resource path: `/{proxy+}`
7. Click **Create**

#### Step 7: Enable CORS

1. Di API Gateway → **CORS**
2. Configure:
   - Access-Control-Allow-Origin: `*`
   - Access-Control-Allow-Headers: `Content-Type,Authorization`
   - Access-Control-Allow-Methods: `GET,POST,PUT,DELETE,OPTIONS`

#### Step 8: Deploy API

1. Click **Deploy**
2. Stage: **dev**
3. Copy **Invoke URL** (contoh: `https://abc123.execute-api.us-east-1.amazonaws.com/dev`)

#### Step 9: Test Backend

```bash
# Test health endpoint
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/health

# Expected response:
{
  "success": true,
  "message": "Notepad SaaS API is running",
  "timestamp": "2025-12-09T...",
  "environment": "production"
}
```

---

### Option B: Automated Deployment with Serverless Framework

#### Step 1: Install Serverless Framework

```bash
npm install -g serverless
```

#### Step 2: Configure AWS Credentials

```bash
serverless config credentials \
  --provider aws \
  --key YOUR_AWS_ACCESS_KEY \
  --secret YOUR_AWS_SECRET_KEY
```

#### Step 3: Deploy

```bash
cd backend

# Deploy to dev stage
serverless deploy

# Or deploy to production stage
serverless deploy --stage prod
```

#### Step 4: Get Deployment Info

```bash
serverless info

# Output will show:
# - API Gateway endpoint URL
# - Lambda function name
# - CloudFormation stack name
```

---

## Part 2: Deploy Frontend ke AWS Amplify

### Step 1: Prepare Frontend

```bash
cd frontend

# Update .env.production dengan API Gateway URL
echo "REACT_APP_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/api" > .env.production
```

### Step 2: Push Code to GitHub

```bash
cd ..
git add .
git commit -m "feat: prepare for AWS deployment"
git push origin master
```

### Step 3: Deploy via AWS Amplify Console

1. Login ke **AWS Console** → **AWS Amplify**
2. Click **New app** → **Host web app**
3. Pilih **GitHub** (atau Git provider lainnya)
4. Authorize AWS Amplify untuk akses repo
5. Pilih repository: `saas-tk-kowan`
6. Branch: `master`

### Step 4: Configure Build Settings

AWS Amplify akan auto-detect `amplify.yml`. Verify settings:

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

### Step 5: Add Environment Variables

Di **Amplify Console** → **Environment variables**, tambahkan:

```
REACT_APP_API_URL=https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/api
```

### Step 6: Deploy

1. Click **Save and deploy**
2. Tunggu build process selesai (~5-10 menit)
3. Amplify akan provide URL: `https://master.XXXXXX.amplifyapp.com`

### Step 7: Update CORS

Setelah dapat Amplify URL, update Lambda environment variable:

```
CORS_ORIGIN=https://master.XXXXXX.amplifyapp.com
```

---

## Part 3: Database Setup (Neon PostgreSQL)

Database sudah configured di `.env.production`. Pastikan tables sudah created:

### Run Migration (Local)

```bash
cd backend
node src/utils/migrate.js
```

Atau buat Lambda function terpisah untuk migration:

1. Create Lambda function: `nottu-migrate`
2. Upload code yang sama
3. Handler: `src/utils/migrate.js`
4. Run one-time execution

---

## Testing Deployment

### Test Backend

```bash
# Health check
curl https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/health

# Register user
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Frontend

1. Buka Amplify URL di browser
2. Register akun baru
3. Login
4. Create, edit, delete notes
5. Test theme toggle
6. Test auto-save functionality

---

## Monitoring & Logs

### Lambda Logs

```bash
# Via Serverless Framework
serverless logs -f api --tail

# Via AWS CLI
aws logs tail /aws/lambda/nottu-api --follow
```

### Amplify Logs

1. AWS Console → Amplify → App
2. Click pada build yang sedang running
3. View build logs di **Provision**, **Build**, **Deploy** tabs

### CloudWatch Metrics

1. AWS Console → CloudWatch
2. Metrics → Lambda → By Function Name
3. Monitor:
   - Invocations
   - Duration
   - Errors
   - Throttles

---

## Cost Estimation (AWS Academy)

AWS Academy biasanya memberikan credits, tapi estimasi normal:

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Lambda | 1M requests/month | ~$0-5/month |
| API Gateway | 1M requests/month | ~$0-5/month |
| Amplify Hosting | 1000 build minutes | ~$0-10/month |
| Neon PostgreSQL | Free tier available | $0/month |

**Total**: ~$0-20/month (dalam free tier limits)

---

## Troubleshooting

### Issue: CORS Error

**Solution**: Update Lambda environment variable `CORS_ORIGIN` dengan Amplify URL yang benar

### Issue: Lambda Timeout

**Solution**: Increase timeout di Lambda Configuration → General configuration → Timeout (max 30s)

### Issue: Database Connection Error

**Solution**:
- Check `DATABASE_URL` format
- Pastikan Neon DB allow connections dari AWS region
- Check security group rules

### Issue: API Gateway 502 Bad Gateway

**Solution**:
- Check Lambda logs di CloudWatch
- Verify Lambda execution role permissions
- Test Lambda directly (tanpa API Gateway)

---

## Production Checklist

Before going to production:

- [ ] Generate new `JWT_SECRET` yang secure
- [ ] Update `CORS_ORIGIN` dengan domain production
- [ ] Enable AWS WAF untuk API Gateway
- [ ] Setup CloudWatch Alarms
- [ ] Enable API Gateway access logs
- [ ] Setup backup untuk Neon database
- [ ] Configure custom domain untuk Amplify
- [ ] Enable HTTPS/SSL
- [ ] Review IAM permissions (principle of least privilege)
- [ ] Setup monitoring & alerting
- [ ] Load testing

---

## Useful Commands

```bash
# Backend deployment
cd backend
serverless deploy                    # Deploy ke dev
serverless deploy --stage prod       # Deploy ke production
serverless remove                    # Remove deployment

# Frontend local test
cd frontend
npm start                            # Development server
npm run build                        # Production build
npm test                             # Run tests

# AWS CLI commands
aws lambda list-functions            # List all Lambda functions
aws apigateway get-rest-apis         # List API Gateways
aws amplify list-apps                # List Amplify apps
```

---

## Support & Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [Neon PostgreSQL Documentation](https://neon.tech/docs)

---

## Author

NOTTU Team - 2025
