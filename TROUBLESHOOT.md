# 🔍 Troubleshooting Register Error

## Diagnosa dari Test:
- ✅ **Validation berfungsi** (test dengan missing fields berhasil)
- ❌ **Database connection error** (register & login gagal)
- ❌ **Health check route not found** (kemungkinan stage/path issue)

## Masalah Utama: Environment Variables di Lambda

Error "Server error during registration" disebabkan oleh **DATABASE CONNECTION FAILED** karena environment variables tidak ter-set di Lambda function.

---

## 🛠️ Cara Fix:

### Opsi 1: Set Environment Variables di AWS Lambda Console (RECOMMENDED untuk AWS Academy)

1. **Buka AWS Lambda Console:**
   - Login ke AWS Academy Learner Lab
   - Buka service **Lambda**
   - Cari function dengan nama **"nottu-api"** atau yang sesuai

2. **Tambahkan Environment Variables:**
   - Klik pada function name
   - Scroll ke bawah ke section **"Configuration"**
   - Klik tab **"Environment variables"**
   - Klik **"Edit"**
   - Tambahkan variables berikut:

   ```
   Key: DATABASE_URL
   Value: postgresql://neondb_owner:npg_fEJZvrWmu72o@ep-winter-lake-ahhvdp0z-pooler.c-3.us-east-1.aws.neon.tech/kowan?sslmode=require

   Key: JWT_SECRET
   Value: 60d95f7cd4d19756f0f2c39303b5bec6be5f8739a288bbf3bd96f813d4fb3271

   Key: JWT_EXPIRE
   Value: 7d

   Key: CORS_ORIGIN
   Value: *

   Key: NODE_ENV
   Value: production

   Key: APP_NAME
   Value: NOTTU

   Key: APP_URL
   Value: https://1z2ivt0s87.execute-api.us-east-1.amazonaws.com/api
   ```

3. **Save** dan tunggu beberapa detik

4. **Test lagi:**
   ```bash
   curl -X POST https://1z2ivt0s87.execute-api.us-east-1.amazonaws.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "testuser@example.com",
       "password": "Password123!"
     }'
   ```

---

### Opsi 2: Cek CloudWatch Logs untuk Error Detail

1. **Buka CloudWatch Console:**
   - Login ke AWS Academy
   - Buka service **CloudWatch**
   - Klik **"Log groups"** di sidebar kiri
   - Cari log group: `/aws/lambda/nottu-api-api-api` atau sejenisnya

2. **Lihat Latest Log Stream:**
   - Klik log group
   - Klik log stream terbaru (paling atas)
   - Cari error message yang mengandung:
     - "Register error:"
     - "Database error"
     - "Connection timeout"

3. **Screenshot error dan share** untuk diagnosa lebih lanjut

---

### Opsi 3: Test Database Connection dari Lambda

Buat test endpoint untuk cek database:

1. Edit `backend/src/server.js`, tambahkan route:
   ```javascript
   app.get('/test-db', async (req, res) => {
     try {
       const result = await pool.query('SELECT NOW()');
       res.json({
         success: true,
         message: 'Database connected!',
         timestamp: result.rows[0].now
       });
     } catch (error) {
       res.status(500).json({
         success: false,
         message: 'Database error',
         error: error.message
       });
     }
   });
   ```

2. Re-deploy dan test:
   ```bash
   curl https://1z2ivt0s87.execute-api.us-east-1.amazonaws.com/api/test-db
   ```

---

## 📝 Kemungkinan Penyebab Error:

1. **Environment Variables tidak di-set** ⭐ (MOST LIKELY)
   - Lambda tidak punya DATABASE_URL
   - Lambda tidak bisa connect ke database

2. **Database Neon dalam mode sleep**
   - Neon database free tier auto-sleep setelah idle
   - Perlu "wake up" dengan koneksi pertama

3. **Lambda tidak punya internet access**
   - Jika Lambda di-deploy di VPC tanpa NAT Gateway
   - Tidak bisa akses database eksternal (Neon)

4. **Lambda timeout terlalu kecil**
   - Default 3 seconds mungkin tidak cukup
   - Database connection memerlukan waktu lebih lama

---

## ✅ Quick Check:

Jalankan command ini untuk verifikasi:

```bash
# 1. Test dengan missing fields (harus berhasil)
curl -X POST https://1z2ivt0s87.execute-api.us-east-1.amazonaws.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Expected: {"success":false,"message":"Please provide all required fields."}
```

Jika test di atas berhasil, artinya Lambda function berjalan dengan baik, dan masalahnya PASTI di **database connection**.

---

## 🎯 Next Steps:

1. ✅ Set environment variables di Lambda Console (OPSI 1)
2. ✅ Test lagi dengan curl
3. ✅ Jika masih error, cek CloudWatch Logs (OPSI 2)
4. ✅ Share screenshot error untuk diagnosa lebih lanjut
