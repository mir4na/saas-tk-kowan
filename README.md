# QuickClip

**QuickClip** is a modern SaaS web application that combines two essential utilities:
- **Pastebin** - Store, manage, and share text/code snippets with optional password protection
- **URL Shortener** - Create short links with click tracking

Built with React, Node.js, PostgreSQL, and AWS S3, deployed on Kubernetes.

## Features

- 🔐 **Passwordless Authentication** - WebAuthn/Passkey support (biometrics, security keys)
- 📝 **Pastebin** - Create public or private pastes with optional password protection
- 🔗 **URL Shortener** - Shorten URLs with click analytics (max 5 per user)
- 👤 **Profile Management** - Customizable name, description, and profile photo
- ☁️ **Cloud Storage** - Large pastes (>50KB) and profile photos stored in AWS S3
- 🚀 **Kubernetes Ready** - Full K8s manifests included for production deployment

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6, Axios |
| Backend | Node.js 22+, Express.js 4 |
| Database | PostgreSQL 14 |
| Storage | AWS S3 |
| Auth | WebAuthn (SimpleWebAuthn) |
| Orchestration | Kubernetes (Minikube) / Docker Compose |
| Reverse Proxy | NGINX, Caddy |
| CDN / Security | Cloudflare (WAF, DDoS, SSL) |

---

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- AWS S3 bucket with valid credentials

### 1. Clone and Configure

```bash
git clone https://github.com/mir4na/saas-tk-kowan.git
cd saas-tk-kowan
cp .env.example .env
```

### 2. Edit `.env` with your values

```env
DB_NAME=quickclip
DB_USER=postgres
DB_PASSWORD=your-secure-password

JWT_SECRET=your-random-secret-string
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost
REACT_APP_API_URL=/api

RP_NAME=QUICKCLIP
ORIGIN=http://localhost
RP_ID=localhost

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_SESSION_TOKEN=your-session-token
AWS_S3_BUCKET=your-bucket-name
```

### 3. Start the Application

```bash
docker-compose up --build
```

### 4. Access

Open **http://localhost** in your browser.

---

## Production Deployment (Kubernetes + Cloudflare)

This guide covers deploying QuickClip to AWS EC2 using Minikube for Kubernetes, Caddy for origin SSL, and Cloudflare for CDN/security.

### Architecture

```
Internet → Cloudflare (CDN/WAF/SSL) → EC2 (Caddy:443) → Minikube → NGINX → Frontend/Backend → PostgreSQL
                                                                                    ↓
                                                                                 AWS S3
```

### Prerequisites

- AWS EC2 instance (Ubuntu 22.04, t3.medium or larger)
- Elastic IP associated with EC2
- Custom domain with access to change nameservers
- Cloudflare account (free tier)
- AWS S3 bucket for storage

---

### Step 1: Install Dependencies on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Log out and back in for docker group
exit
```

---

### Step 2: Start Minikube

```bash
minikube start --driver=docker --memory=3072 --cpus=2
kubectl get nodes
```

---

### Step 3: Clone the Repository

```bash
cd ~
git clone https://github.com/mir4na/saas-tk-kowan.git
```

---

### Step 4: Build Docker Images

```bash
# Use Minikube's Docker daemon
eval $(minikube docker-env)

# Build images
cd ~/saas-tk-kowan/backend
docker build -t quickclip-backend:latest .

cd ~/saas-tk-kowan/frontend
docker build -t quickclip-frontend:latest --build-arg REACT_APP_API_URL=/api .
```

---

### Step 5: Configure Secrets

```bash
cd ~/saas-tk-kowan/k8s
cp 02-secrets.yaml.example 02-secrets.yaml
nano 02-secrets.yaml
```

Update with your actual values:
- `DB_PASSWORD`: Secure database password
- `JWT_SECRET`: Random string for JWT signing
- `ORIGIN`: `https://yourdomain.com`
- `RP_ID`: `yourdomain.com`
- `AWS_*`: Your AWS credentials
- `AWS_S3_BUCKET`: Your S3 bucket name

---

### Step 6: Deploy to Kubernetes

```bash
cd ~/saas-tk-kowan/k8s

kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secrets.yaml
kubectl apply -f 03-postgres-pvc.yaml
kubectl apply -f 04-postgres-deployment.yaml
kubectl apply -f 05-postgres-service.yaml
kubectl apply -f 06-backend-deployment.yaml
kubectl apply -f 07-backend-service.yaml
kubectl apply -f 08-frontend-deployment.yaml
kubectl apply -f 09-frontend-service.yaml
kubectl apply -f 10-nginx-deployment.yaml
kubectl apply -f 11-nginx-service.yaml

# Verify pods are running
kubectl get pods -n quickclip
```

---

### Step 7: Setup Cloudflare

#### 7.1 Add Domain to Cloudflare
1. Create a [Cloudflare account](https://cloudflare.com) (free tier)
2. Click **Add a Site** and enter your domain
3. Select the **Free** plan

#### 7.2 Configure DNS
Add an A record pointing to your EC2 Elastic IP:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` or subdomain | `<YOUR_EC2_ELASTIC_IP>` | ☁️ Proxied (orange) |

#### 7.3 Update Nameservers
1. Cloudflare will provide two nameservers (e.g., `ada.ns.cloudflare.com`)
2. Go to your domain registrar and replace existing nameservers with Cloudflare's
3. Wait for propagation (5 minutes to 24 hours)

#### 7.4 Generate Origin Certificate
1. In Cloudflare → **SSL/TLS** → **Origin Server**
2. Click **Create Certificate**
3. Keep defaults (15 years validity)
4. Copy the **Certificate** and **Private Key**

#### 7.5 Install Origin Certificate on EC2
```bash
# Save certificate
sudo nano /etc/ssl/cloudflare-origin.pem
# Paste the certificate content

# Save private key
sudo nano /etc/ssl/cloudflare-origin.key
# Paste the private key content
```

#### 7.6 Configure SSL/TLS Settings
In Cloudflare Dashboard → **SSL/TLS**:
- **Overview**: Set to **Full (Strict)**
- **Edge Certificates**: Enable **Always Use HTTPS**
- **Edge Certificates**: Enable **Automatic HTTPS Rewrites**

#### 7.7 Enable Security Features
- **Security** → **Bots**: Enable **Bot Fight Mode**
- **Security** → **Settings**: Keep Security Level at **Medium**
- **Security** → **Security Rules**: (Optional) Add rate limiting rule for `/api/auth`

---

### Step 8: Configure Caddy with Origin Certificate

```bash
# Get Minikube IP
minikube ip

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

Add (replace with your domain and Minikube IP):
```
yourdomain.com {
    tls /etc/ssl/cloudflare-origin.pem /etc/ssl/cloudflare-origin.key
    reverse_proxy <MINIKUBE_IP>:30080
}
```

```bash
sudo systemctl restart caddy
```

---

### Step 9: Verify Deployment

```bash
# Check Cloudflare headers
curl -I https://yourdomain.com 2>/dev/null | grep -E "cf-ray|server"

# Should show:
# server: cloudflare
# cf-ray: xxxxxxxxx
```

Open `https://yourdomain.com` in your browser - you should see the QuickClip landing page with a valid SSL certificate.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register/options` | No | WebAuthn registration challenge |
| POST | `/api/auth/register/verify` | No | Verify registration |
| POST | `/api/auth/login/options` | No | WebAuthn login challenge |
| POST | `/api/auth/login/verify` | No | Verify login |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/pastes` | Yes | List user's pastes |
| GET | `/api/pastes/:slug` | Optional | Get paste |
| POST | `/api/pastes` | Yes | Create paste |
| PUT | `/api/pastes/:slug` | Yes | Update paste |
| DELETE | `/api/pastes/:slug` | Yes | Delete paste |
| GET | `/api/urls` | Yes | List short URLs |
| POST | `/api/urls` | Yes | Create short URL |
| DELETE | `/api/urls/:id` | Yes | Delete short URL |
| PUT | `/api/profile/name` | Yes | Update profile |
| PUT | `/api/profile/photo` | Yes | Upload photo |
| GET | `/api/health` | No | Health check |

---

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -n quickclip
kubectl logs -n quickclip deployment/backend
```

### Restart Deployments
```bash
kubectl rollout restart deployment/backend -n quickclip
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `CreateContainerConfigError` | Missing secret key - check all keys exist |
| 404 on API routes | Check NGINX proxy_pass config |
| WebAuthn fails | Ensure ORIGIN matches browser URL exactly |

---

## License

MIT

---

## Contributors

- Muhammad Afwan Hafizh (2306208855)
- Christian Raphael Heryanto (2306152323)
- Pascal Hafidz Fajri (2306222746)
- Steven Setiawan (2306152260)
- Yudayana Arif Prasojo (2306215160)
