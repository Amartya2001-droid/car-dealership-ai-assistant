# Deployment Checklist

Complete checklist for deploying the Car Dealership AI Assistant monitoring dashboard.

## 📋 Pre-Deployment Checklist

### Backend Requirements
- [ ] Express backend repository cloned and dependencies installed
- [ ] Backend `.env` file configured with all required variables
- [ ] Backend server starts without errors: `npm run dev` or `npm start`
- [ ] All 6 API endpoints respond correctly:
  - [ ] `GET /health` returns JSON with status
  - [ ] `GET /admin/runtime` returns runtime configuration
  - [ ] `GET /admin/summary` returns aggregated summary
  - [ ] `GET /admin/leads` returns leads array
  - [ ] `GET /admin/appointments` returns appointments array
  - [ ] `GET /admin/followups` returns followups array
- [ ] Backend CORS configured to allow frontend origin
- [ ] Test data added (use `/simulate/call` endpoint) or production data exists

### Frontend Setup
- [ ] Frontend dependencies installed: `yarn install`
- [ ] `.env` file configured with backend URL: `REACT_APP_BACKEND_URL`
- [ ] Frontend starts without errors: `yarn start`
- [ ] No console errors in browser developer tools
- [ ] Tailwind CSS compiling correctly
- [ ] All shadcn/ui components rendering properly

### Integration Testing
- [ ] Frontend successfully fetches data from backend
- [ ] KPI cards display correct values
- [ ] Lead cards render with all fields
- [ ] Search functionality works
- [ ] Topic and status filters work
- [ ] Manual refresh button works
- [ ] Auto-refresh triggers every 30 seconds
- [ ] Empty states display when no data
- [ ] Error state displays when backend unreachable

### Visual Quality Assurance
- [ ] Premium automotive design visible (warm neutrals, amber accents)
- [ ] Fonts loaded correctly (Playfair Display, Inter)
- [ ] All icons display (Lucide React)
- [ ] Animations work smoothly (fade-in, slide-in, pulse)
- [ ] Color-coded badges correct (status, topic, urgency)
- [ ] Responsive design works on desktop, tablet, mobile
- [ ] No layout breaks or overflow issues

### Performance
- [ ] Initial page load < 3 seconds
- [ ] Dashboard refresh < 1 second
- [ ] Smooth scrolling in lead monitoring section
- [ ] No memory leaks after 10+ minutes of auto-refresh
- [ ] API calls complete quickly (< 500ms)

## 🚀 Deployment Steps

### Option 1: Local Development

**Backend:**
```bash
cd /path/to/car-dealership-ai-assistant
npm install
npm run dev
# Server runs on http://localhost:3000
```

**Frontend:**
```bash
cd /app/frontend
yarn install
yarn start
# Dashboard runs on http://localhost:3000 (or :3001 if backend on :3000)
```

**Update frontend `.env` if needed:**
```env
REACT_APP_BACKEND_URL=http://localhost:3000
```

---

### Option 2: Production with Supervisor (Current Setup)

**Backend:**
1. Clone backend repo to a permanent location (e.g., `/opt/backend`)
2. Install dependencies: `npm install`
3. Configure production `.env`
4. Set up supervisor config for backend
5. Start: `sudo supervisorctl start backend`

**Frontend:**
1. Already in `/app/frontend`
2. Update `.env` with production backend URL
3. Start: `sudo supervisorctl restart frontend`

**Supervisor Status:**
```bash
sudo supervisorctl status
# backend      RUNNING   pid 123
# frontend     RUNNING   pid 456
# mongodb      RUNNING   pid 789
```

---

### Option 3: Docker Deployment

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DATA_DIR=/app/data
    volumes:
      - ./backend/data:/app/data

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_BACKEND_URL=http://backend:3000
    depends_on:
      - backend
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Option 4: Separate Cloud Hosting

**Backend (e.g., Railway, Render, Fly.io):**
1. Push backend repo to GitHub
2. Connect to hosting provider
3. Set environment variables in provider dashboard
4. Deploy
5. Note the deployed URL (e.g., `https://your-backend.railway.app`)

**Frontend (e.g., Vercel, Netlify):**
1. Push frontend code to GitHub (or use `/app/frontend` directory)
2. Connect to Vercel/Netlify
3. Set build command: `yarn build`
4. Set output directory: `build`
5. Set environment variable: `REACT_APP_BACKEND_URL=https://your-backend.railway.app`
6. Deploy

---

## 🔧 Environment Configuration

### Backend .env (Express)
```env
# Server
PORT=3000
BASE_URL=https://your-backend.com
NODE_ENV=production

# Storage
STORAGE_PROVIDER=local_json
DATA_DIR=/app/data

# Dealership
DEALERSHIP_NAME=Northstar Auto Group
DEALERSHIP_TIMEZONE=America/Halifax
DEFAULT_PERSONA=concierge

# Business Hours
BUSINESS_HOURS_START=9
BUSINESS_HOURS_END=18

# Follow-up
FOLLOW_UP_HOUR=9
FOLLOW_UP_MINUTE=15

# AI (optional)
USE_MOCK_AI=true
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o-mini

# Twilio (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Calendar (optional)
GOOGLE_CALENDAR_ID=
GOOGLE_ACCESS_TOKEN=
```

### Frontend .env (React)
```env
# Backend URL (REQUIRED)
REACT_APP_BACKEND_URL=https://your-backend.com

# Dev Server (optional)
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

---

## 🔒 Security Checklist

- [ ] Backend URL uses HTTPS in production
- [ ] CORS restricted to specific frontend origin (not `*`)
- [ ] No sensitive data hardcoded in frontend
- [ ] Environment variables properly configured
- [ ] API rate limiting enabled on backend (if applicable)
- [ ] Express backend uses helmet for security headers
- [ ] No API keys exposed in frontend code
- [ ] Production build minified and optimized

---

## 🧪 Post-Deployment Testing

### Smoke Tests
- [ ] Dashboard loads without errors
- [ ] All 6 API endpoints return data
- [ ] KPI cards display values
- [ ] Search works
- [ ] Filters work
- [ ] Refresh button works
- [ ] Auto-refresh triggers

### End-to-End Tests
- [ ] Create a test lead via `/simulate/call`
- [ ] Verify lead appears in dashboard within 30 seconds
- [ ] Search for the test lead
- [ ] Filter by topic and status
- [ ] Verify lead details are correct
- [ ] Check appointments section
- [ ] Check follow-up queue
- [ ] Test quick links open correctly

### Load Testing
- [ ] Dashboard handles 100+ leads without performance issues
- [ ] Multiple concurrent users can access dashboard
- [ ] Auto-refresh doesn't cause memory leaks
- [ ] Backend responds quickly under load

---

## 📊 Monitoring Setup

### Backend Monitoring
```bash
# Health check endpoint
curl https://your-backend.com/health

# Expected response:
# {"status":"ok","service":"car-dealership-ai-assistant","version":"1.0.0","time":"2026-03-17T12:00:00.000Z"}
```

### Frontend Monitoring
- Use browser performance tools
- Monitor console for errors
- Set up error tracking (e.g., Sentry)
- Track API call success rates

### Uptime Monitoring
- Set up external monitoring (e.g., UptimeRobot, Pingdom)
- Monitor these endpoints:
  - Frontend URL (should return 200)
  - Backend `/health` (should return JSON with status: ok)

---

## 🐛 Troubleshooting Deployed Application

### Dashboard Shows Error State

**Check:**
1. Is backend server running?
   ```bash
   curl https://your-backend.com/health
   ```
2. Is backend URL correct in frontend `.env`?
3. Are CORS headers set correctly?
   ```bash
   curl -I -X OPTIONS https://your-backend.com/admin/leads \
     -H "Origin: https://your-frontend.com"
   ```
4. Check backend logs for errors
5. Check frontend browser console

**Solution:**
- Restart backend service
- Verify environment variables
- Update CORS configuration
- Clear browser cache

### Empty Dashboard (No Data)

**Check:**
1. Backend data files exist and aren't empty
2. API endpoints return arrays (not errors)
   ```bash
   curl https://your-backend.com/admin/leads
   ```
3. Frontend is polling correct endpoints

**Solution:**
- Add test data via `/simulate/call`
- Verify backend data directory exists
- Check file permissions

### Styling Broken

**Check:**
1. Build process completed successfully
2. Static assets served correctly
3. Font files loaded
4. Tailwind CSS compiled

**Solution:**
- Rebuild frontend: `yarn build`
- Clear CDN cache if using CDN
- Check Content-Security-Policy headers
- Verify all static assets accessible

### Performance Issues

**Check:**
1. API response times
2. Frontend bundle size
3. Number of API calls per refresh
4. Memory usage over time

**Solution:**
- Optimize backend queries
- Implement caching
- Code-split frontend bundle
- Reduce auto-refresh frequency if needed

---

## 📈 Scaling Considerations

### Backend Scaling
- Use Redis for session/cache storage
- Add load balancer for multiple backend instances
- Optimize database queries (if using DB instead of JSON files)
- Implement API caching

### Frontend Scaling
- Use CDN for static assets
- Enable gzip/brotli compression
- Implement service worker for offline support
- Lazy load components

---

## 🔄 Maintenance

### Regular Tasks
- [ ] **Daily:** Check dashboard functionality
- [ ] **Weekly:** Review backend logs for errors
- [ ] **Weekly:** Verify auto-refresh working
- [ ] **Monthly:** Update dependencies
- [ ] **Monthly:** Review performance metrics
- [ ] **Quarterly:** Security audit

### Backup Strategy
- [ ] Backend data files backed up daily
- [ ] Environment variables documented
- [ ] Deployment configuration version controlled
- [ ] Database (if applicable) backed up regularly

---

## 📞 Support Contacts

**For Backend Issues:**
- Repository: https://github.com/Amartya2001-droid/car-dealership-ai-assistant
- Check backend logs and data files
- Review Express server configuration

**For Frontend Issues:**
- Check `/app/frontend` directory
- Review browser console errors
- Verify Tailwind CSS compilation
- Test API endpoint responses

---

## ✅ Deployment Complete Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured correctly
- [ ] CORS working properly
- [ ] All API endpoints responding
- [ ] Dashboard loads and displays data
- [ ] Search and filters working
- [ ] Auto-refresh functioning
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Documentation reviewed
- [ ] Team trained on dashboard usage
- [ ] Backup strategy implemented

---

**Deployment Status: Ready for Production** 🚀

*Once all checkboxes are marked, the dashboard is production-ready*
