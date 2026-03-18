# Car Dealership AI Assistant - Monitoring Dashboard

A premium, production-style monitoring dashboard for the after-hours AI assistant used by car dealerships. This React-based frontend provides real-time visibility into leads, appointments, follow-ups, and system runtime status.

## 🎨 Design Philosophy

The dashboard features a **premium automotive operations aesthetic** with:
- **Warm neutral color palette** with stone backgrounds
- **Muted accent colors**: forest green, bronze, and rust tones
- **Professional typography**: Inter for UI, Playfair Display for headers
- **Subtle animations** and smooth transitions
- **Responsive design** optimized for desktop and mobile

## 🏗️ Architecture

### Frontend Stack
- **React 19** with functional components and hooks
- **Tailwind CSS** for styling with custom automotive theme
- **shadcn/ui** component library for consistent UI elements
- **Axios** for API communication
- **Lucide React** for icons
- **Sonner** for toast notifications

### Backend Integration
The dashboard connects to the existing **Node.js Express backend** from the GitHub repository and consumes these endpoints:

- `GET /health` - Service health check
- `GET /admin/runtime` - Runtime configuration and storage status
- `GET /admin/summary` - Aggregated KPI data
- `GET /admin/leads` - All lead records
- `GET /admin/appointments` - Test drive appointments
- `GET /admin/followups` - Follow-up queue

## 📊 Dashboard Features

### 1. Hero Header
- **Live status indicator** with pulsing animation
- **Dealership branding** section
- **Runtime badges** showing:
  - Storage provider (local_json, Supabase, etc.)
  - Default persona (sales_pro, concierge, tech_expert)
  - Application version
- **Manual refresh button** with loading state
- **Last updated timestamp**

### 2. KPI Cards (4 Metrics)
- **Total Leads** - Count of all customer inquiries with trend indicator
- **Callbacks Requested** - Leads that requested callback windows
- **Appointments** - Total and confirmed test drive appointments
- **Follow-ups Queued** - Next-day outreach queue status

### 3. Lead Monitoring Section
**Search & Filters:**
- Full-text search by name, phone, or inquiry text
- Topic filter: test_drive, pricing, service, inventory, general
- Status filter: new, pending_schedule, scheduled, contacted

**Lead Cards Display:**
- Customer name and contact information
- Mood indicator (frustrated 😤, enthusiastic 🤩, neutral 😊)
- Status badge with color coding
- Topic and urgency badges
- Inquiry text (quoted)
- Follow-up consent indicator
- Callback window preference (morning/afternoon/evening)
- Recommended vehicles with pricing
- In-stock availability badges
- Showroom asset links (brochure PDF, walkaround video)
- Timestamp of lead creation

### 4. Appointments Section
- List of scheduled test drive appointments
- Status badges: confirmed (green), scheduled (blue), pending (yellow)
- Appointment date and time
- Associated lead ID reference
- Vehicle information

### 5. Follow-up Queue Section
- Queued follow-ups for next business day
- Status indicators: queued (blue), sent (green), failed (red)
- Scheduled delivery time
- Follow-up message preview
- Lead ID reference

### 6. Attention Queue Alert
- Highlighted banner for urgent leads
- Automatically shows leads with:
  - High urgency classification
  - Callback window requested
- Count of leads requiring immediate attention

### 7. Quick Links Panel
Direct access to JSON API endpoints:
- Health Check
- Runtime Status
- Summary JSON
- All Leads
- All Appointments
- All Follow-ups

Each link opens in a new tab for raw JSON inspection.

## 🔄 Auto-Refresh Behavior

- **Automatic polling**: Dashboard refreshes every **30 seconds**
- **Manual refresh**: Click the "Refresh" button in the header
- **Loading states**: Skeleton screens on initial load
- **Toast notifications**: Success/error feedback on manual refresh
- **Graceful error handling**: Connection issues display helpful error state

## 🎯 Data Testids

All interactive elements include `data-testid` attributes for automated testing:

- `refresh-button` - Manual refresh button
- `kpi-total-leads` - Total leads KPI card
- `kpi-callbacks` - Callbacks requested KPI card
- `kpi-appointments` - Appointments KPI card
- `kpi-followups` - Follow-ups queued KPI card
- `attention-queue` - Urgent leads alert banner
- `lead-monitoring-section` - Lead monitoring container
- `lead-search-input` - Lead search input field
- `topic-filter` - Topic filter dropdown
- `status-filter` - Status filter dropdown
- `lead-card-{id}` - Individual lead card
- `appointments-section` - Appointments container
- `appointment-{id}` - Individual appointment card
- `followup-section` - Follow-up queue container
- `followup-{id}` - Individual follow-up card
- `quick-links-panel` - Quick links container
- `quick-link-{name}` - Individual quick link button
- `retry-button` - Error state retry button

## 🚀 Getting Started

### Prerequisites
1. **Node.js Express backend** must be running (from the GitHub repository)
2. Backend should be accessible at the URL configured in `REACT_APP_BACKEND_URL`

### Installation
```bash
cd /app/frontend
yarn install
```

### Configuration
The frontend uses the environment variable defined in `/app/frontend/.env`:
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

**Important:** Do not hardcode URLs in the code. Always use `process.env.REACT_APP_BACKEND_URL`.

### Running the Dashboard
```bash
cd /app/frontend
yarn start
```

Or using supervisor:
```bash
sudo supervisorctl restart frontend
```

The dashboard will be available at `http://localhost:3000` (development) or your configured production URL.

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:
- **Mobile** (< 768px): Single column layout, stacked cards
- **Tablet** (768px - 1024px): 2-column grid for KPIs
- **Desktop** (> 1024px): Full 4-column KPI grid, 3-column main layout

## 🎨 Color Palette

### Primary Colors
- **Stone**: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900`
- **Amber**: `50, 100, 200, 300, 400, 500, 600, 700, 800, 900`

### Status Colors
- **Success/Green**: Confirmed appointments, sent follow-ups, in-stock vehicles
- **Warning/Yellow**: Pending appointments, medium urgency
- **Error/Red**: Failed follow-ups, high urgency
- **Info/Blue**: New leads, scheduled appointments, queued follow-ups
- **Purple**: General informational states

### Topic Colors
- **Test Drive**: Blue
- **Pricing**: Green
- **Service**: Orange
- **Inventory**: Purple
- **General**: Stone/Gray

## 🔧 Component Structure

```
/app/frontend/src/
├── App.js                          # Main router
├── App.css                         # Global styles and animations
├── components/
│   ├── Dashboard.jsx               # Main dashboard container
│   ├── KPICard.jsx                 # KPI metric cards
│   ├── LeadMonitoring.jsx          # Lead search, filter, and cards
│   ├── AppointmentsSection.jsx     # Appointments list
│   ├── FollowupSection.jsx         # Follow-up queue
│   ├── QuickLinksPanel.jsx         # API endpoint links
│   ├── LoadingSkeleton.jsx         # Loading state skeleton
│   └── ErrorState.jsx              # Error handling UI
└── components/ui/                  # shadcn/ui components
    ├── alert.jsx
    ├── badge.jsx
    ├── button.jsx
    ├── card.jsx
    ├── input.jsx
    ├── select.jsx
    ├── skeleton.jsx
    ├── sonner.jsx
    └── ...
```

## 🐛 Error Handling

### Connection Errors
If the dashboard cannot reach the backend:
1. **Error state screen** displays with troubleshooting tips
2. Shows the configured backend URL
3. Provides a "Retry Connection" button
4. Lists common connection issues to check

### Empty States
Each section handles empty data gracefully:
- **No leads**: "Leads will appear here as calls come in"
- **No appointments**: "No appointments scheduled"
- **No follow-ups**: "No follow-ups queued"

### Loading States
- **Initial load**: Full skeleton screen with animated placeholders
- **Refresh**: Spinning icon on refresh button
- **Smooth transitions**: Fade-in animations for loaded content

## 🔐 Security Notes

- Backend URL is read from environment variables (never hardcoded)
- External links open in new tabs (`target="_blank"`)
- No sensitive data stored in localStorage
- All API calls use HTTPS in production

## 📈 Performance

- **Auto-refresh interval**: 30 seconds (configurable)
- **Lazy loading**: Components render progressively
- **Optimized re-renders**: React hooks with proper dependencies
- **Efficient polling**: Uses `useCallback` to prevent unnecessary fetches

## 🧪 Testing

The dashboard includes comprehensive testids for automated testing with Playwright, Cypress, or similar tools. All interactive elements and data displays are tagged for easy test selection.

Example test selectors:
```javascript
// Click refresh button
await page.click('[data-testid="refresh-button"]');

// Search for a lead
await page.fill('[data-testid="lead-search-input"]', 'John Doe');

// Filter by topic
await page.click('[data-testid="topic-filter"]');
await page.click('text=Test Drive');

// Verify KPI values
const totalLeads = await page.textContent('[data-testid="kpi-total-leads"]');
```

## 🎯 Future Enhancements

Potential features for future iterations:
- Real-time WebSocket updates instead of polling
- Export leads to CSV functionality
- Advanced analytics charts (bar, pie, line graphs)
- Dark mode toggle
- User authentication and role-based access
- Multi-dealership support with location filtering
- Push notifications for high-urgency leads
- Inline lead editing and status updates
- Calendar view for appointments
- SMS/Email preview before sending follow-ups

## 📝 Maintenance

### Updating Dependencies
```bash
cd /app/frontend
yarn upgrade-interactive
```

### Checking for Issues
```bash
# Frontend logs
tail -f /var/log/supervisor/frontend.out.log
tail -f /var/log/supervisor/frontend.err.log

# Restart if needed
sudo supervisorctl restart frontend
```

### Environment Variables
All configuration is in `/app/frontend/.env`:
- `REACT_APP_BACKEND_URL` - Backend API base URL
- `WDS_SOCKET_PORT` - WebSocket port for development
- `ENABLE_HEALTH_CHECK` - Health check feature flag

## 🤝 Integration with Express Backend

The dashboard is designed to work seamlessly with the Express backend from the GitHub repository:
- **No backend modifications needed** - Uses existing API endpoints
- **Data contract compliance** - Expects standard lead/appointment/followup schemas
- **Graceful degradation** - Works with empty data arrays
- **CORS friendly** - Configured for cross-origin requests

## 📞 Support

For issues or questions:
1. Check backend server logs for API errors
2. Verify CORS configuration on Express backend
3. Inspect browser console for client-side errors
4. Review network tab for failed API requests
5. Ensure `REACT_APP_BACKEND_URL` points to running server

---

**Built with care for dealership operations teams** 🚗✨
