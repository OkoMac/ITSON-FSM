# 🚀 ITSON FSM - Quick Deployment Guide

## ⚡ Fastest Deployment (5 Minutes)

### Option 1: Docker (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/OkoMac/ITSON-FSM.git
cd ITSON-FSM

# 2. Configure environment
cp server/.env.example server/.env
cp .env.production.example .env.production

# Edit .env files with your production values
nano server/.env          # Set DB credentials, JWT secret
nano .env.production      # Set API URL

# 3. Deploy with Docker
./deploy.sh

# Choose option 1 (Docker)
# Containers will build and start automatically
```

**That's it!** Your app is now running:
- Backend: http://localhost:5000
- Frontend: http://localhost

---

### Option 2: VPS with PM2

```bash
# 1. Prerequisites
sudo apt update
sudo apt install -y nodejs npm postgresql

# 2. Clone and configure
git clone https://github.com/OkoMac/ITSON-FSM.git
cd ITSON-FSM
cp server/.env.example server/.env
cp .env.production.example .env.production

# Edit environment files
nano server/.env
nano .env.production

# 3. Run deployment script
./deploy.sh

# Choose option 2 (PM2)
```

**Done!** Backend running with PM2, frontend ready in `./dist/`

---

## 📋 Detailed Deployment Options

### Docker Deployment (Full Stack)

**Requirements:**
- Docker 20+
- Docker Compose 1.29+

**Steps:**

1. **Environment Configuration**
   ```bash
   # Create .env file from example
   cp server/.env.example server/.env

   # Required variables:
   DB_PASSWORD=your-secure-password
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   NODE_ENV=production
   ```

2. **Build and Start**
   ```bash
   # Build images
   docker-compose build

   # Start all services
   docker-compose up -d

   # View logs
   docker-compose logs -f

   # Check status
   docker-compose ps
   ```

3. **Run Migrations**
   ```bash
   # Access backend container
   docker-compose exec backend sh

   # Run migrations
   npm run db:migrate

   # Seed demo data (optional)
   npm run db:seed

   # Exit container
   exit
   ```

4. **Access Application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/health

**Docker Commands:**
```bash
# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Remove all (including volumes)
docker-compose down -v

# Rebuild specific service
docker-compose up -d --build backend
```

---

### VPS Deployment (PM2)

**Requirements:**
- Ubuntu 20.04+ / Debian 11+
- Node.js 18+
- PostgreSQL 14+
- Nginx

**Full Setup:**

1. **System Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Install Nginx
   sudo apt install -y nginx

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Database Setup**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE itson_fsm;
   CREATE USER itson_user WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE itson_fsm TO itson_user;
   \q
   ```

3. **Application Setup**
   ```bash
   # Create app directory
   sudo mkdir -p /var/www/itson-fsm
   sudo chown -R $USER:$USER /var/www/itson-fsm

   # Clone repository
   cd /var/www/itson-fsm
   git clone https://github.com/OkoMac/ITSON-FSM.git .

   # Configure environment
   cp server/.env.example server/.env
   nano server/.env  # Edit with production values

   # Install dependencies
   npm install
   cd server && npm install && cd ..

   # Build applications
   npm run build
   cd server && npm run build && cd ..

   # Run migrations
   cd server
   npm run db:migrate
   npm run db:seed  # Optional
   cd ..
   ```

4. **Start with PM2**
   ```bash
   # Start backend
   pm2 start ecosystem.config.js

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup
   # Run the command it provides

   # Check status
   pm2 list
   pm2 monit
   ```

5. **Configure Nginx**
   ```bash
   # Create nginx config
   sudo nano /etc/nginx/sites-available/itson-fsm
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       # Frontend
       root /var/www/itson-fsm/dist;
       index index.html;

       # Frontend routes
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Backend API proxy
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }

       # Static files caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/itson-fsm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt install -y certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

   # Auto-renewal is set up automatically
   # Test renewal
   sudo certbot renew --dry-run
   ```

---

### Manual Deployment

**For custom setups or when you need full control:**

1. **Build Backend**
   ```bash
   cd server
   npm install
   npm run build

   # Output in server/dist/
   ```

2. **Build Frontend**
   ```bash
   npm install
   npm run build

   # Output in dist/
   ```

3. **Copy Files**
   ```bash
   # Backend
   scp -r server/dist user@server:/path/to/backend
   scp server/.env user@server:/path/to/backend/
   scp -r server/node_modules user@server:/path/to/backend/

   # Frontend
   scp -r dist/* user@server:/path/to/frontend/
   ```

4. **Start Backend**
   ```bash
   # On your server
   cd /path/to/backend
   node dist/index.js
   ```

5. **Serve Frontend**
   Configure your web server (Nginx/Apache) to serve the `dist/` directory

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value (min 32 chars)
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Set up automatic security updates
- [ ] Enable fail2ban for SSH protection
- [ ] Configure database backups
- [ ] Set up monitoring and alerts
- [ ] Review and restrict CORS settings
- [ ] Enable rate limiting (already configured)
- [ ] Remove or secure debug endpoints

---

## 🧪 Post-Deployment Testing

After deployment, verify everything works:

```bash
# 1. Health check
curl http://yourserver.com/health

# 2. API test
curl http://yourserver.com/api/health

# 3. Login test
curl -X POST http://yourserver.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itsonfsm.com","password":"password123"}'

# 4. Database connection
docker-compose exec backend sh -c "npm run db:migrate"

# 5. Check logs
docker-compose logs -f backend
pm2 logs itson-fsm-api
```

**Manual Testing:**
1. Open frontend in browser
2. Login with demo credentials
3. Check all major pages load
4. Test check-in functionality
5. Test task creation
6. Verify API calls in Network tab

---

## 📊 Monitoring

### Docker

```bash
# View container stats
docker stats

# Check logs
docker-compose logs -f

# Monitor specific service
docker-compose logs -f backend

# Check health status
docker-compose ps
```

### PM2

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Check status
pm2 list

# Restart if needed
pm2 restart itson-fsm-api

# View detailed info
pm2 show itson-fsm-api
```

### System

```bash
# Check disk space
df -h

# Check memory
free -h

# Check processes
htop

# Check nginx
sudo systemctl status nginx

# Check postgres
sudo systemctl status postgresql
```

---

## 🔄 Updates & Maintenance

### Updating Application

**Docker:**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Run migrations if needed
docker-compose exec backend npm run db:migrate
```

**PM2:**
```bash
# Pull latest code
git pull origin main

# Rebuild
npm run build
cd server && npm run build && cd ..

# Restart PM2
pm2 restart itson-fsm-api

# Run migrations
cd server && npm run db:migrate && cd ..
```

### Database Backups

```bash
# Manual backup
pg_dump -U itson_user itson_fsm > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
# Add to crontab: crontab -e
0 2 * * * pg_dump -U itson_user itson_fsm > /backups/itson_fsm_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U itson_user itson_fsm < backup_20240204.sql
```

---

## ⚠️ Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend
pm2 logs itson-fsm-api

# Common fixes:
# 1. Check .env file exists and is configured
# 2. Verify database is running
# 3. Check port 5000 is not in use
sudo lsof -i :5000

# 4. Test database connection
psql -h localhost -U itson_user -d itson_fsm
```

### Frontend Shows Errors

```bash
# Check API_URL is correct
cat .env.production

# Verify backend is responding
curl http://localhost:5000/health

# Check nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Database Connection Failed

```bash
# Check postgres is running
sudo systemctl status postgresql

# Check connection string in .env
cat server/.env

# Test connection
psql -h localhost -U itson_user -d itson_fsm

# Check postgres logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

---

## 📞 Support

- **Documentation:** See all `/docs` and `.md` files
- **Testing:** Run `./test-system.sh`
- **Issues:** Check `BUG_REPORT.md`
- **Deployment:** This guide

---

## ✅ Quick Checklist

**Before Deploy:**
- [ ] Environment files configured
- [ ] Database credentials set
- [ ] JWT_SECRET changed
- [ ] API_URL correct
- [ ] SSL certificates ready
- [ ] Domain DNS configured

**After Deploy:**
- [ ] Health check passes
- [ ] Can login successfully
- [ ] API endpoints respond
- [ ] Database migrations run
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Logs accessible

---

## 🎉 You're Live!

Your ITSON FSM Platform is now deployed and ready for use!

**Demo Credentials:**
- Email: `admin@itsonfsm.com`
- Password: `password123`

**⚠️ Remember to change demo passwords in production!**

---

*Last Updated: February 4, 2026*
*Version: 1.0.0*
