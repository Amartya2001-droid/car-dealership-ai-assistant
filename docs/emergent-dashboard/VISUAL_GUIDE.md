# Dashboard Visual Guide

This guide shows what the Car Dealership AI Assistant monitoring dashboard looks like in different states.

## 🎨 Visual States

### 1. Error State (Backend Not Running)

**What You See:**
- Clean error screen with warm background gradient
- Red alert icon in a circular badge
- Clear heading: "Unable to Load Dashboard"
- Specific error message (e.g., "Request failed with status code 404")
- Troubleshooting checklist with actionable steps
- Prominent amber "Retry Connection" button
- Backend URL displayed for verification

**Color Scheme:**
- Background: Soft stone gradient (warm neutral)
- Error badge: Red (#DC2626)
- Alert box: Light red background with dark red text
- CTA button: Amber (#D97706) for dealership feel

**Purpose:**
Helps staff quickly diagnose connection issues and provides clear next steps.

---

### 2. Empty State (No Data Yet)

**Header Section:**
- Dark stone/amber gradient header
- "Operations Dashboard" title in elegant serif font
- Green pulsing "Live monitoring" indicator
- Runtime badges showing: storage provider, default persona, version
- Refresh button in top right
- Last updated timestamp

**KPI Cards:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Leads     │  │ Callbacks       │  │ Appointments    │  │ Follow-ups      │
│                 │  │ Requested       │  │                 │  │ Queued          │
│      0          │  │      0          │  │      0          │  │      0          │
│                 │  │                 │  │ 0 confirmed     │  │ 0 sent          │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
  Blue border          Amber border         Green border         Purple border
```

**Lead Monitoring Section:**
- Search bar and filter dropdowns
- Empty state message: "No leads found"
- Phone icon
- Subtext: "Leads will appear here as calls come in"

**Sidebar Sections:**
- **Appointments:** Calendar icon, "No appointments scheduled"
- **Follow-ups:** Clock icon, "No follow-ups queued"
- **Quick Links:** 6 buttons linking to JSON endpoints

---

### 3. Dashboard with Data (Normal Operations)

**Header Section:**
Same as empty state but with actual data flowing through.

**KPI Cards with Data:**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Total Leads     │  │ Callbacks       │  │ Appointments    │  │ Follow-ups      │
│ 👥              │  │ 📞              │  │ 📅              │  │ ⏰              │
│     12          │  │      5          │  │      3          │  │      8          │
│ +12% this week  │  │                 │  │ 2 confirmed     │  │ 6 sent          │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Attention Queue Alert (if applicable):**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔  3 leads require immediate attention (high urgency or        │
│     callback requested)                                          │
└─────────────────────────────────────────────────────────────────┘
  Amber background, amber icon, dark text
```

**Lead Card Example:**
```
┌────────────────────────────────────────────────────────────────────┐
│ John Smith 😊                                        [new] Mar 17, 1:45 PM  │
│ +1 902 555 1212                                                     │
│                                                                     │
│ "I am looking for a reliable SUV under 40000 dollars for my family"│
│                                                                     │
│ [inventory] [low urgency] [✓ Follow-up consent]                   │
│                                                                     │
│ RECOMMENDED VEHICLES                                                │
│ 2025 Toyota RAV4 - $39,250 [In Stock]                             │
│ 2025 Honda CR-V - $37,800 [In Stock]                              │
│                                                                     │
│ [📄 Brochure] [🎥 Walkaround]                                      │
└────────────────────────────────────────────────────────────────────┘
```

**Lead Card with Callback Request:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Mike Davis 😊                                [new] Mar 17, 2:15 PM  │
│ +1 902 555 5678                                                     │
│                                                                     │
│ "What is the best deal on a Honda CR-V? Call me back tomorrow      │
│  afternoon"                                                         │
│                                                                     │
│ [pricing] [medium urgency] [✓ Follow-up consent]                  │
│ [📞 Callback: afternoon]  ← Amber badge with phone icon            │
│                                                                     │
│ RECOMMENDED VEHICLES                                                │
│ 2025 Honda CR-V - $37,800 [In Stock]                              │
└────────────────────────────────────────────────────────────────────┘
```

**High Urgency Lead:**
```
┌────────────────────────────────────────────────────────────────────┐
│ Sarah Johnson 🤩                          [new] Mar 17, 11:30 AM   │
│ +1 902 555 1234                                                     │
│                                                                     │
│ "I need to book a test drive for a Toyota RAV4 today ASAP"        │
│                                                                     │
│ [test_drive] [high urgency]  ← Red badge                          │
│ [✓ Follow-up consent] [📞 Callback: morning]                      │
│                                                                     │
│ RECOMMENDED VEHICLES                                                │
│ 2025 Toyota RAV4 - $39,250 [In Stock]                             │
└────────────────────────────────────────────────────────────────────┘
```

**Appointments Section:**
```
┌──────────────────────────────────────┐
│ 📅 Appointments                      │
│ Test drive scheduling                │
│ ────────────────────────────────     │
│ ┌────────────────────────────────┐   │
│ │ [Confirmed] ✓  Mar 18, 10:00 AM│   │
│ │ Lead ID: lead-123              │   │
│ │ 2025 Toyota RAV4               │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ [Scheduled] 📅  Mar 19, 2:00 PM│   │
│ │ Lead ID: lead-456              │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Follow-up Queue:**
```
┌──────────────────────────────────────┐
│ ⏰ Follow-up Queue                   │
│ Next-day customer outreach           │
│ ────────────────────────────────     │
│ ┌────────────────────────────────┐   │
│ │ [Queued] 📥  Mar 18, 9:15 AM   │   │
│ │ Lead ID: lead-789              │   │
│ │ "Thank you for calling..."     │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ [Sent] ✓  Mar 17, 9:15 AM      │   │
│ │ Lead ID: lead-234              │   │
│ │ "Following up on your..."      │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

---

## 🎨 Color Coding System

### Status Badges
- **New** → Blue (bg-blue-100, text-blue-700, border-blue-300)
- **Pending Schedule** → Yellow (bg-yellow-100, text-yellow-700, border-yellow-300)
- **Scheduled** → Green (bg-green-100, text-green-700, border-green-300)
- **Contacted** → Purple (bg-purple-100, text-purple-700, border-purple-300)

### Topic Badges
- **Test Drive** → Blue
- **Pricing** → Green
- **Service** → Orange
- **Inventory** → Purple
- **General** → Stone/Gray

### Urgency Badges
- **High** → Red (bg-red-100, text-red-700, border-red-300)
- **Medium** → Yellow (bg-yellow-100, text-yellow-700, border-yellow-300)
- **Low** → Gray (bg-gray-100, text-gray-700, border-gray-300)

### KPI Card Colors
- **Total Leads** → Blue accent
- **Callbacks** → Amber accent
- **Appointments** → Green accent
- **Follow-ups** → Purple accent

---

## 📱 Mobile View (< 768px)

**Stacked Layout:**
```
┌─────────────────────────────────┐
│ 🚗 Operations Dashboard         │
│ ● Live monitoring               │
│ [Refresh]                       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Total Leads                     │
│ 12                              │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Callbacks Requested             │
│ 5                               │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Appointments                    │
│ 3 (2 confirmed)                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Follow-ups Queued               │
│ 8 (6 sent)                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🔔 3 leads require attention    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Lead Monitoring                 │
│ ───────────────────────────     │
│ [Search box]                    │
│ [Topic filter ▼]                │
│ [Status filter ▼]               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Lead Card 1                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Lead Card 2                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Appointments                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Follow-up Queue                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Quick Links                     │
└─────────────────────────────────┘
```

---

## 🖥️ Desktop View (> 1024px)

**3-Column Layout:**
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Header: Operations Dashboard                          [Last: 1:45] [Refresh]│
│ Runtime badges: [local_json] [concierge] [v1.0.0]                        │
└──────────────────────────────────────────────────────────────────────────┘

┌────────┬────────┬────────┬────────┐
│ KPI 1  │ KPI 2  │ KPI 3  │ KPI 4  │  ← 4 columns
└────────┴────────┴────────┴────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 🔔 Attention Queue Alert (if applicable)                           │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────┬───────────────────┐
│ Lead Monitoring (2 columns width)            │ Appointments      │
│                                               │                   │
│ [Search] [Topic ▼] [Status ▼]               │ - Appt 1          │
│                                               │ - Appt 2          │
│ ┌──────────────────┬──────────────────┐      │                   │
│ │ Lead Card 1      │ Lead Card 2      │      ├───────────────────┤
│ └──────────────────┴──────────────────┘      │ Follow-up Queue   │
│                                               │                   │
│ ┌──────────────────┬──────────────────┐      │ - Followup 1      │
│ │ Lead Card 3      │ Lead Card 4      │      │ - Followup 2      │
│ └──────────────────┴──────────────────┘      │                   │
│                                               ├───────────────────┤
│ (more cards...)                               │ Quick Links       │
│                                               │                   │
│                                               │ [Health Check]    │
│                                               │ [Runtime Status]  │
│                                               │ [Summary JSON]    │
│                                               │ [All Leads]       │
│                                               │ [Appointments]    │
│                                               │ [Follow-ups]      │
└──────────────────────────────────────────────┴───────────────────┘
```

---

## 🎬 Animations & Interactions

### On Page Load
1. **Fade-in animation** for all content (0.5s ease-out)
2. **Slide-in animation** for attention queue (0.4s ease-out)
3. **Pulse animation** for live status indicator (2s infinite)

### On Hover
- **Lead cards:** Border changes from stone-200 to amber-300, shadow increases
- **Buttons:** Background darkens, smooth transition (200ms)
- **Quick links:** Background changes to stone-50

### On Refresh
- **Refresh button:** Icon spins while loading
- **Toast notification:** Slides in from top-right
  - Success: Green background, checkmark icon
  - Error: Red background, X icon

### Auto-refresh
- **Silent update** every 30 seconds
- **Timestamp updates** in header
- **No visual disruption** to user's current view

---

## 📊 Data Display Examples

### Mood Indicators
- **Neutral:** 😊 (most common)
- **Enthusiastic:** 🤩 (excited buyers)
- **Frustrated:** 😤 (upset or impatient)

### Callback Windows
- **Morning:** 9:00 AM - 12:00 PM
- **Afternoon:** 12:00 PM - 5:00 PM
- **Evening:** 5:00 PM - 7:00 PM

### Vehicle Display Format
```
2025 Toyota RAV4 - $39,250 [In Stock]
^^^^  ^^^^^ ^^^^^   ^^^^^^^  ^^^^^^^^^
Year  Make  Model   Price    Availability
```

### Timestamp Format
- **Lead cards:** "Mar 17, 1:45 PM"
- **Appointments:** "Mar 18, 10:00 AM"
- **Follow-ups:** "Mar 18, 9:15 AM"
- **Header:** "1:45:30 PM" (with seconds)

---

## 🎯 Key Visual Principles

### 1. Premium Automotive Feel
- Warm neutrals (stone) instead of cold grays
- Bronze and rust accents instead of bright colors
- Elegant serif font for headers (Playfair Display)
- Professional sans-serif for body (Inter)

### 2. Operational Clarity
- Clear visual hierarchy (header → KPIs → details)
- Color-coded status system
- Badge-based categorization
- Icon-first communication

### 3. Attention Management
- High urgency leads have red badges
- Callback requests highlighted with phone icon
- Attention queue alert at top when needed
- Empty states guide staff expectations

### 4. Responsive & Accessible
- Touch-friendly on mobile (larger tap targets)
- Readable text sizes on all devices
- Sufficient color contrast (WCAG AA)
- Clear focus states for keyboard navigation

---

## 🖼️ Screenshot Checklist

When viewing the dashboard, verify these visual elements:

✅ **Header:**
- [ ] Dark gradient (stone → amber)
- [ ] Activity icon in amber circle
- [ ] Pulsing green dot next to "Live monitoring"
- [ ] Runtime badges visible
- [ ] Refresh button in top right

✅ **KPI Cards:**
- [ ] 4 cards in a row (desktop) or stacked (mobile)
- [ ] Each has colored border and icon
- [ ] Large number displays value
- [ ] Subtitle shows additional context

✅ **Lead Cards:**
- [ ] Border: stone-200, hover: amber-300
- [ ] Name and phone clearly visible
- [ ] Mood emoji present
- [ ] Status badge in top right
- [ ] Inquiry text in quotes and italic
- [ ] Badges for topic, urgency, consent
- [ ] Recommended vehicles in gray box
- [ ] Showroom buttons if applicable

✅ **Sidebar Sections:**
- [ ] Cards have consistent styling
- [ ] Status badges color-coded
- [ ] Timestamps formatted correctly
- [ ] Empty states show helpful messages

✅ **Interactions:**
- [ ] Search box filters live
- [ ] Dropdowns open smoothly
- [ ] Hover effects work
- [ ] Refresh button spins when clicked
- [ ] Toast notifications appear

---

**This visual guide demonstrates the premium automotive operations aesthetic** 🚗✨

*Designed for clarity, efficiency, and dealership staff workflows*
