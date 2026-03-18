# Dashboard Testing Guide

This guide explains how to test the Car Dealership AI Assistant monitoring dashboard with the Express backend.

## Prerequisites

Before testing the dashboard, ensure you have:

1. ✅ **Frontend running** - React dashboard at `http://localhost:3000` or your production URL
2. ✅ **Express backend running** - Node.js server from the GitHub repository
3. ✅ **Backend accessible** - The URL in `REACT_APP_BACKEND_URL` must point to the running Express server

## Testing Scenarios

### Scenario 1: Backend Not Running (Error State)

**What you'll see:**
- Error screen with red alert icon
- Message: "Unable to Load Dashboard"
- Error details: "Request failed with status code 404"
- Troubleshooting tips
- "Retry Connection" button

**How to test:**
1. Ensure Express backend is NOT running
2. Open the dashboard URL
3. Verify error state displays correctly
4. Click "Retry Connection" - should show error again
5. Start the Express backend
6. Click "Retry Connection" - should load dashboard

### Scenario 2: Empty Data (No Leads Yet)

**What you'll see:**
- KPI cards showing all zeros
- Empty state messages in each section:
  - "No leads found" with phone icon
  - "No appointments scheduled" with calendar icon
  - "No follow-ups queued" with clock icon

**How to test:**
1. Start Express backend with empty data files
2. Open dashboard
3. Verify all KPI values are 0
4. Verify empty state messages display correctly
5. Verify no attention queue alert appears

### Scenario 3: Dashboard with Sample Data

**Setup:**
To test with sample data, you can use the Express backend's simulate endpoint:

```bash
# Example 1: General inquiry
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19025551212",
    "callerName": "John Smith",
    "message": "I am looking for a reliable SUV under 40000 dollars for my family",
    "persona": "sales_pro",
    "optInFollowUp": true
  }'

# Example 2: Test drive request (high urgency)
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19025551234",
    "callerName": "Sarah Johnson",
    "message": "I need to book a test drive for a Toyota RAV4 today ASAP",
    "persona": "concierge",
    "optInFollowUp": true
  }'

# Example 3: Pricing inquiry with callback
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19025555678",
    "callerName": "Mike Davis",
    "message": "What is the best deal on a Honda CR-V? Please call me back tomorrow afternoon",
    "persona": "sales_pro",
    "optInFollowUp": true
  }'

# Example 4: Service inquiry
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19025559999",
    "callerName": "Lisa Chen",
    "message": "I need an oil change and tire rotation for my 2023 Mazda CX-5",
    "persona": "tech_expert",
    "optInFollowUp": false
  }'

# Example 5: Enthusiastic buyer (high urgency + callback)
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+19025551111",
    "callerName": "Alex Rodriguez",
    "message": "I am so excited! I want to buy a Tesla Model 3 this week. Call me in the morning please!",
    "persona": "concierge",
    "optInFollowUp": true
  }'
```

**What you'll see after adding leads:**

1. **KPI Cards Update:**
   - Total Leads: Shows count
   - Callbacks Requested: Shows leads with callback windows
   - Appointments: Shows scheduled test drives
   - Follow-ups Queued: Shows queued follow-ups

2. **Attention Queue Alert:**
   - Appears when leads have high urgency or callback requested
   - Shows count of attention-required leads

3. **Lead Cards Display:**
   - Customer name and phone
   - Mood emoji (😊 neutral, 🤩 enthusiastic, 😤 frustrated)
   - Status badge (new, pending_schedule, scheduled, contacted)
   - Topic badge (test_drive, pricing, service, inventory, general)
   - Urgency badge (high/medium/low)
   - Follow-up consent checkmark
   - Callback window (morning/afternoon/evening)
   - Recommended vehicles with pricing
   - In-stock badges
   - Showroom links (brochure, walkaround)

4. **Appointments Section:**
   - Shows test drive appointments
   - Status: confirmed (green), scheduled (blue), pending (yellow)
   - Date/time display
   - Associated lead ID

5. **Follow-up Queue:**
   - Queued messages for next day
   - Status: queued (blue), sent (green), failed (red)
   - Scheduled time
   - Lead reference

## Testing Features

### Search Functionality

**Test Cases:**
1. Search by customer name (e.g., "John")
2. Search by phone number (e.g., "5551212")
3. Search by inquiry text (e.g., "SUV")
4. Verify partial matches work
5. Verify case-insensitive search
6. Clear search and verify all leads show again

### Filter Functionality

**Topic Filter:**
- Select "Test Drive" - should show only test_drive leads
- Select "Pricing" - should show only pricing leads
- Select "Service" - should show only service leads
- Select "Inventory" - should show only inventory leads
- Select "General" - should show only general leads
- Select "All Topics" - should show all leads

**Status Filter:**
- Select "New" - should show only new leads
- Select "Pending Schedule" - should show only pending_schedule leads
- Select "Scheduled" - should show only scheduled leads
- Select "Contacted" - should show only contacted leads
- Select "All Statuses" - should show all leads

**Combined Filters:**
- Try search + topic filter
- Try search + status filter
- Try topic + status filter
- Try all three combined

### Auto-Refresh Testing

**Test Cases:**
1. Open dashboard with existing data
2. Wait 30 seconds without interaction
3. Verify dashboard refreshes automatically (check timestamp updates)
4. Add a new lead via simulate endpoint
5. Wait for auto-refresh (30 seconds)
6. Verify new lead appears

### Manual Refresh Testing

**Test Cases:**
1. Click "Refresh" button
2. Verify button shows spinning icon
3. Verify success toast appears: "Dashboard refreshed successfully"
4. Verify timestamp updates
5. Test with backend down:
   - Stop Express server
   - Click refresh
   - Verify error toast: "Failed to refresh dashboard"

### Quick Links Testing

**Test Cases:**
1. Click each quick link button
2. Verify new tab opens with JSON response
3. Test all 6 links:
   - Health Check
   - Runtime Status
   - Summary JSON
   - All Leads
   - All Appointments
   - All Follow-ups

### Responsive Design Testing

**Desktop (1920px+):**
- 4-column KPI grid
- 2-column lead monitoring + 1-column sidebar layout
- All filters on one row

**Tablet (768px - 1024px):**
- 2-column KPI grid
- Stacked lead monitoring and sidebar
- Filters may wrap to multiple rows

**Mobile (< 768px):**
- Single column layout
- Stacked KPI cards
- Full-width filters
- Scrollable lead cards

### Error Handling Testing

**Connection Errors:**
1. Stop Express backend
2. Refresh dashboard
3. Verify error state displays
4. Verify error message shows specific error
5. Verify backend URL is displayed
6. Click "Retry Connection"
7. Verify error persists until backend starts

**CORS Errors:**
If CORS is misconfigured on backend:
- Dashboard shows connection error
- Browser console shows CORS error
- Fix: Update Express CORS settings to allow frontend origin

## Performance Testing

**Load Time:**
- Initial load should complete in < 2 seconds (with backend running)
- Subsequent refreshes should be < 1 second
- Auto-refresh should not cause UI lag

**Data Volume:**
- Test with 0 leads (empty state)
- Test with 10 leads (normal state)
- Test with 50+ leads (scrolling required)
- Verify search remains fast with large datasets

## Visual Testing Checklist

✅ **Colors & Theme:**
- Warm neutral backgrounds (stone tones)
- Amber accent in header gradient
- Status badges use appropriate colors
- No harsh purple tones

✅ **Typography:**
- Headers use Playfair Display serif font
- Body text uses Inter sans-serif
- Font sizes are readable on all devices

✅ **Animations:**
- Fade-in animation on page load
- Slide-in animation for attention queue
- Smooth transitions on hover states
- Pulse animation for live status indicator
- Spinning refresh icon when refreshing

✅ **Spacing & Layout:**
- Consistent padding in cards
- Proper gaps between elements
- Cards have subtle shadows
- Hover effects on interactive elements

✅ **Icons:**
- All icons display correctly (Lucide React)
- Icon colors match their context
- Icons are appropriately sized

## Integration Testing

### With Express Backend

**Verify API Contract:**
1. Check `/admin/summary` returns expected structure:
   ```json
   {
     "leads": { "total": 0, "byStatus": {}, "byTopic": {}, "byUrgency": {}, "callbacksRequested": 0 },
     "appointments": { "total": 0, "confirmed": 0, "pending": 0 },
     "followups": { "total": 0, "queued": 0, "sent": 0 }
   }
   ```

2. Check `/admin/leads` returns lead array:
   ```json
   {
     "leads": [
       {
         "id": "lead-123",
         "phone": "+19025551212",
         "callerName": "John Smith",
         "inquiry": "...",
         "persona": "sales_pro",
         "mood": "neutral",
         "topic": "inventory",
         "urgency": "low",
         "recommendedVehicles": [],
         "callbackWindow": null,
         "showroomAsset": {},
         "consentFollowUp": true,
         "status": "new",
         "lifecycle": [],
         "afterHours": true,
         "createdAt": "2026-03-17T12:00:00.000Z"
       }
     ]
   }
   ```

3. Verify CORS headers allow frontend origin
4. Verify all 6 endpoints return valid JSON
5. Verify timestamps are in ISO 8601 format

## Automated Testing

### Using Playwright

Example test script:
```javascript
import { test, expect } from '@playwright/test';

test('dashboard loads successfully', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Wait for dashboard to load
  await page.waitForSelector('[data-testid="kpi-total-leads"]');
  
  // Verify KPI cards are visible
  expect(await page.isVisible('[data-testid="kpi-total-leads"]')).toBeTruthy();
  expect(await page.isVisible('[data-testid="kpi-callbacks"]')).toBeTruthy();
  expect(await page.isVisible('[data-testid="kpi-appointments"]')).toBeTruthy();
  expect(await page.isVisible('[data-testid="kpi-followups"]')).toBeTruthy();
});

test('search functionality works', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForSelector('[data-testid="lead-search-input"]');
  
  // Type in search box
  await page.fill('[data-testid="lead-search-input"]', 'John');
  
  // Wait for filtering
  await page.waitForTimeout(500);
  
  // Verify results are filtered
  const leadCards = await page.$$('[data-testid^="lead-card-"]');
  expect(leadCards.length).toBeGreaterThan(0);
});

test('filters can be changed', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Open topic filter
  await page.click('[data-testid="topic-filter"]');
  await page.click('text=Test Drive');
  
  // Verify filter applied
  await page.waitForTimeout(500);
});

test('manual refresh works', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Click refresh button
  await page.click('[data-testid="refresh-button"]');
  
  // Wait for refresh to complete
  await page.waitForTimeout(2000);
  
  // Verify toast notification (if visible)
  // expect(await page.isVisible('text=refreshed successfully')).toBeTruthy();
});
```

## Troubleshooting Common Issues

### Issue: Dashboard shows error state

**Causes:**
- Express backend not running
- Wrong backend URL in `REACT_APP_BACKEND_URL`
- CORS configuration blocking requests
- Network connectivity issues

**Solutions:**
1. Start Express backend: `npm run dev` in the backend repo
2. Verify backend URL is correct
3. Check Express CORS settings allow frontend origin
4. Test backend endpoints directly with curl

### Issue: Empty data despite backend having data

**Causes:**
- Backend data files are empty
- API endpoints returning empty arrays
- Dashboard auto-refresh hasn't triggered yet

**Solutions:**
1. Use simulate endpoints to add test data
2. Check backend data files in `data/` directory
3. Wait for auto-refresh (30 seconds) or click manual refresh

### Issue: Filters not working

**Causes:**
- Lead data missing expected fields (topic, status)
- JavaScript error in browser console

**Solutions:**
1. Check browser console for errors
2. Verify lead objects have `topic` and `status` fields
3. Refresh page to reset state

### Issue: Styling looks wrong

**Causes:**
- Tailwind CSS not loading properly
- Font imports failed
- CSS conflicts

**Solutions:**
1. Check browser console for CSS loading errors
2. Verify Tailwind config is correct
3. Clear browser cache and reload
4. Check network tab for failed font requests

## Best Practices

1. **Always test with real backend data** when possible
2. **Test all responsive breakpoints** (desktop, tablet, mobile)
3. **Verify auto-refresh** doesn't cause memory leaks (leave open for 10+ minutes)
4. **Check browser console** for any warnings or errors
5. **Test error recovery** by stopping and starting backend
6. **Validate data** matches what backend actually returns
7. **Test accessibility** with screen readers and keyboard navigation

---

Happy Testing! 🎯🚗
