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
| Orchestration | Kubernetes / Docker Compose |
| Reverse Proxy | NGINX |

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

## Production Deployment (Kubernetes)

This guide covers deploying QuickClip to AWS EC2 using Minikube, with DuckDNS for DNS and Caddy for automatic HTTPS.

### Architecture

```
Internet → DuckDNS → EC2 (Caddy:443) → Minikube → NGINX → Frontend/Backend → PostgreSQL
                                                                    ↓
                                                                 AWS S3
```

### Prerequisites

- AWS EC2 instance (Ubuntu 22.04, t3.medium or larger)
- Elastic IP associated with EC2
- DuckDNS domain pointing to EC2 IP
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

### Step 3: Transfer Files to EC2

From your local machine:
```bash
scp -r -i your-key.pem ./saas-tk-kowan ubuntu@<EC2_IP>:~/
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
- `ORIGIN`: `https://yourdomain.duckdns.org`
- `RP_ID`: `yourdomain.duckdns.org`
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

### Step 7: Configure Caddy

```bash
# Get Minikube IP
minikube ip

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

Add:
```
yourdomain.duckdns.org {
    reverse_proxy <MINIKUBE_IP>:30080
}
```

```bash
sudo systemctl restart caddy
```

---

### Step 8: Verify

```bash
curl https://yourdomain.duckdns.org/api/health
```

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
