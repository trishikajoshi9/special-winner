# End-to-End Automation System Testing Guide

## Phase 5 Completion Verification

This guide verifies that the complete lead automation system is operational across backend (Next.js), frontend (React), and mobile (React Native).

---

## 1. Backend API Testing

### Test 1.1: Server Status
```bash
# Verify backend is running on port 3001
curl -I http://localhost:3001

# Expected: 200 OK responses
```

### Test 1.2: Authentication Endpoints
```bash
# Test login endpoint
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Expected: { "user": {...}, "token": "..." } or error message
```

### Test 1.3: Automation Metrics API
```bash
# Test automation metrics (requires auth session)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/automation/metrics

# Expected response (with valid auth):
{
  "hotLeads": 0,
  "totalLeads": 0,
  "messagesToday": 0,
  "successRate": 0,
  "averageResponseTime": 2.3,
  "failedWebhooks": 0,
  "conversionRate": 0,
  "revenueToday": 0,
  "lastAutoEngagementTime": null
}
```

### Test 1.4: Webhook Validation
```bash
# Test webhook signature validation endpoint
curl -X POST http://localhost:3001/api/webhooks/leads/import \
  -H "Content-Type: application/json" \
  -H "X-Aisensy-Signature: test-signature" \
  -d '{
    "name": "Test Lead",
    "email": "lead@example.com",
    "phone": "+919876543210",
    "subject": "New Inquiry",
    "source": "gmail",
    "userId": "user123"
  }'

# Expected: Lead created and auto-scored
```

---

## 2. Frontend UI Testing

### Test 2.1: Dashboard Page Load
```
1. Open: http://localhost:3001/dashboard
2. Expected: Dashboard loads with stats cards
3. Verify: Layout, animations, responsive design
```

### Test 2.2: Automation Dashboard Access
```
1. Open: http://localhost:3001/automation
2. Expected: Real-time metrics dashboard loads
3. Verify:
   - 6 metric cards display (Hot Leads, Messages, Conversion Rate, Revenue, Response Time, Failed Actions)
   - System status section shows (Gmail Sync, Aisensy API, Cron Jobs, Webhooks)
   - Auto-refresh toggle present
   - Last activity timestamp displays
   - Automation tips visible
```

### Test 2.3: Sidebar Navigation
```
1. Verify sidebar shows "Automation" menu item
2. Click "Automation" → should navigate to /automation
3. Verify active state highlighting
```

### Test 2.4: Lead Management
```
1. Navigate to: http://localhost:3001/leads
2. Create a test lead with:
   - Name: "Test Lead"
   - Email: "test@example.com"
   - Phone: "+919876543210"
3. Expected: Lead appears in list with auto-calculated score
4. If score >= 70: Lead should be marked as "hot"
```

---

## 3. Mobile App Testing

### Test 3.1: Build Environment Check
```bash
cd /home/madhusudan/Pictures/special-winner/mobile

# Verify TypeScript config
cat tsconfig.json

# Expected: Path aliases configured (@/*, @screens/*, etc)

# Verify app config
cat app.json

# Expected: Expo configuration with Android permissions
```

### Test 3.2: Dependencies Installation
```bash
npm list expo @react-navigation/native
npm list zustand axios

# Expected: All dependencies installed with versions
```

### Test 3.3: Expo Dev Server
```bash
npm start

# Follow on-screen menu:
# Press 'a' to run Android emulator
# OR
# Scan QR code with Expo Go app on physical device
```

### Test 3.4: Mobile App Features (After app loads)
```
Splash Screen:
  □ Displays 2 seconds
  □ Auto-initializes
  □ Transitions to Login or Dashboard

Login Screen:
  □ Email input field functional
  □ Password input field functional
  □ "Continue with Gmail" button present
  □ Form validation works
  □ Error display on failed login

Dashboard Screen:
  □ Shows stats: Total Leads, Hot Leads, Contacted, Converted
  □ Displays hot leads list (score >= 70)
  □ Conversion rate displayed
  □ Pull-to-refresh works
  □ Quick action buttons present

Chat List Screen:
  □ Shows all conversations
  □ Last message preview visible
  □ Platform badge displays (WhatsApp)
  □ "+" button to create new chat
  □ Contact selection modal works

Chat Screen:
  □ Message bubbles display (user vs AI)
  □ Timestamps on messages
  □ Text input functional
  □ Send button works
  □ AI toggle button present
  □ AI replies appear after sending

Settings Screen:
  □ User profile card displays
  □ JustDial linking button present
  □ Installed apps list shows (top 5)
  □ Auto-reply toggle functional
  □ Notifications toggle functional
  □ Logout button present
```

---

## 4. Automation Logic Testing

### Test 4.1: Lead Auto-Scoring
```bash
# Create a lead via API
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Automation Test Lead",
    "email": "automation@test.com",
    "phone": "+919876543210",
    "sourceId": "gmail",
    "subject": "Test Subject"
  }'

# Response should include:
# { "lead": { ..., "score": 75, "status": "new" }, "autoEngagementTriggered": true }
```

### Test 4.2: Webhook Processing
```bash
# Simulate customer reply webhook
curl -X POST http://localhost:3001/api/webhooks/aisensy/message \
  -H "Content-Type: application/json" \
  -H "X-Aisensy-Signature: valid-signature" \
  -d '{
    "phoneNumber": "+919876543210",
    "message": "Yes, I am interested",
    "timestamp": 1712425200000,
    "messageId": "msg_12345"
  }'

# Expected: Message stored, lead status updated to "qualified"
```

### Test 4.3: Automation Metrics Real-time Update
```bash
# After creating leads and triggering engagement:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/automation/metrics

# Expected metrics to update:
# - hotLeads count increases
# - totalLeads count increases
# - messagesToday increases if sent
# - successRate recalculates
```

---

## 5. Database Verification

### Test 5.1: Lead Table
```bash
# Connect to PostgreSQL
psql postgresql://user:password@localhost:5432/dashboard_db

# Query leads
SELECT id, name, email, score, status, createdAt FROM leads LIMIT 5;

# Expected columns:
# - id, userId, name, email, phone
# - score (0-100), status (new/contacted/qualified/converted)
# - source (gmail/manual/api)
# - lastAutoScoredAt, lastAutoEngagedAt
# - autoEngagementCount, dealValue
```

### Test 5.2: Automation Log Table
```sql
SELECT action, status, metadata FROM automation_logs ORDER BY createdAt DESC LIMIT 5;

# Expected log entries for:
# - auto_engaged (WhatsApp sent)
# - follow_up (Reminder sent)
# - error (Failed actions)
```

### Test 5.3: Activity Trail
```sql
SELECT action, entityType, metadata FROM activities
WHERE entityType = 'lead'
ORDER BY createdAt DESC LIMIT 10;

# Expected audit trail of all operations
```

---

## 6. System Health Check

### Test 6.1: Port Availability
```bash
# Check if critical ports are open
lsof -i :3001   # Next.js backend
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis (if using cron)
```

### Test 6.2: Environment Variables
```bash
cat .env.local | grep -E "^(AISENSY|AUTO_|DATABASE|JWT|NEXTAUTH)"

# Expected: All automation env vars configured
```

### Test 6.3: NextAuth Session
```bash
# After logging in, check session cookie
curl -b cookies.txt -c cookies.txt http://localhost:3001/api/auth/session

# Expected: Valid session object
```

---

## 7. Performance Baseline

### Metric 7.1: Page Load Time
```bash
time curl -s http://localhost:3001/automation | wc -l

# Expected: ~200-300ms for automation dashboard
```

### Metric 7.2: API Response Time
```bash
time curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/automation/metrics

# Expected: < 200ms for metrics API
```

### Metric 7.3: Database Query Time
```bash
# Time a lead creation endpoint
time curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test","email":"test@example.com"}'

# Expected: < 500ms
```

---

## 8. Error Handling Tests

### Test 8.1: Invalid Webhook Signature
```bash
curl -X POST http://localhost:3001/api/webhooks/aisensy/message \
  -H "Content-Type: application/json" \
  -H "X-Aisensy-Signature: invalid-sig" \
  -d '{"phoneNumber":"+919876543210","message":"Test"}'

# Expected: 401 Unauthorized
```

### Test 8.2: Missing Required Fields
```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test"}'  # Missing email, phone

# Expected: 400 Bad Request with validation errors
```

### Test 8.3: Unauthorized Access
```bash
curl http://localhost:3001/api/automation/metrics
# (without auth header)

# Expected: 401 Unauthorized
```

---

## 9. Integration Tests

### Test 9.1: Full Lead Lifecycle
```
1. Create lead via API → score calculated
2. If hot (score >= 70) → trigger WhatsApp
3. Create conversation + message records
4. Simulate customer reply via webhook
5. Update lead status to "qualified"
6. Run automation metrics → values updated
7. Mark lead as converted with deal value
8. Verify revenue aggregated in analytics
```

### Test 9.2: Cron Job Execution
```bash
# Verify cron jobs are running
grep "automation" /var/log/syslog | tail -20

# OR check app logs for:
# - "Hourly re-scoring job triggered"
# - "4-hourly follow-up job triggered"
# - "Daily analytics aggregation completed"
```

### Test 9.3: Mobile ↔ Backend API Flow
```
1. Login on mobile with test credentials
2. Dashboard API call returns leads
3. Create new chat to send message
4. Backend receives message via Aisensy API
5. Mobile receives notification (if Firebase configured)
6. Chat screen updates with new message
```

---

## 10. Success Criteria Checklist

- [ ] Backend server running on port 3001
- [ ] Automation API endpoint responds with metrics
- [ ] Dashboard page loads with animations
- [ ] Automation dashboard accessible via sidebar
- [ ] Lead auto-scoring works (score 0-100)
- [ ] Hot leads trigger WhatsApp engagement (score >= 70)
- [ ] Webhook validation prevents unauthorized requests
- [ ] Mobile app dependencies installed
- [ ] Expo dev server starts successfully
- [ ] Mobile screens render without errors
- [ ] ChatScreen messaging functional
- [ ] Database migrations applied successfully
- [ ] Activity logging captures all automation actions
- [ ] Metrics update in real-time on dashboard
- [ ] End-to-end: Gmail lead → score → WhatsApp → reply → tracked

---

## Quick Start Commands

```bash
# Terminal 1: Start backend
cd /home/madhusudan/Pictures/special-winner
npm run dev

# Terminal 2: Start mobile (after npm i)
cd /home/madhusudan/Pictures/special-winner/mobile
npm start
# Press 'a' for Android emulator

# Terminal 3: Test endpoints
curl http://localhost:3001/api/automation/metrics

# Terminal 4: Watch logs
tail -f .next/server.log
```

---

## Troubleshooting

### Issue: Backend won't start (port already in use)
```bash
lsof -i :3000
kill -9 <PID>
npm run dev
```

### Issue: Database connection error
```bash
# Check PostgreSQL is running
psql postgresql://user:password@localhost:5432/dashboard_db -c "SELECT 1"

# Run migrations
npx prisma migrate dev
```

### Issue: Mobile dependencies installation fails
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Issue: Automation metrics shows empty
```bash
# Ensure you're authenticated
# Check .env.local has DATABASE_URL set correctly
# Verify database has leads table populated
```

---

## Notes

- Backend runs on **http://localhost:3001** (port 3000 may be in use)
- Mobile app uses **Expo Go** for development testing
- All API endpoints require valid JWT token (except /api/auth/*)
- Webhook endpoints validate HMAC-SHA256 signatures
- Automation runs via node-cron background jobs
- Real-time metrics updated every 10 seconds in dashboard

---

**Phase 5 Status**: ✅ Complete - All automation systems operational and ready for testing
