const statsEl = document.getElementById('stats');
const leadFeedEl = document.getElementById('lead-feed');
const appointmentFeedEl = document.getElementById('appointment-feed');
const followupFeedEl = document.getElementById('followup-feed');
const summaryBreakdownEl = document.getElementById('summary-breakdown');

const setCount = (id, text) => {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
};

const formatDate = (value) => {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString();
};

const renderStats = (summary) => {
  const cards = [
    ['Total Leads', summary.leads.total],
    ['Callbacks Requested', summary.leads.callbacksRequested],
    ['Appointments', summary.appointments.total],
    ['Queued Follow-Ups', summary.followups.queued]
  ];

  statsEl.innerHTML = cards
    .map(
      ([label, value]) => `
        <article class="stat-card">
          <span class="stat-label">${label}</span>
          <strong class="stat-value">${value}</strong>
        </article>
      `
    )
    .join('');
};

const renderFeed = (target, items, renderer, emptyLabel) => {
  if (!items.length) {
    target.innerHTML = `<div class="feed-item"><strong>${emptyLabel}</strong><div class="feed-meta">No records yet.</div></div>`;
    return;
  }

  target.innerHTML = items.map(renderer).join('');
};

const renderTokens = (source, emptyLabel) => {
  const entries = Object.entries(source || {});
  if (!entries.length) return `<div class="feed-meta">${emptyLabel}</div>`;

  return `<div class="token-list">${entries
    .map(([label, value]) => `<span class="token">${label}: ${value}</span>`)
    .join('')}</div>`;
};

const loadDashboard = async () => {
  try {
    const [summaryRes, leadsRes, appointmentsRes, followupsRes] = await Promise.all([
      fetch('/admin/summary'),
      fetch('/admin/leads'),
      fetch('/admin/appointments'),
      fetch('/admin/followups')
    ]);

    const [summary, leads, appointments, followups] = await Promise.all([
      summaryRes.json(),
      leadsRes.json(),
      appointmentsRes.json(),
      followupsRes.json()
    ]);

    renderStats(summary);

    const recentLeads = (leads.leads || []).slice(-5).reverse();
    const recentAppointments = (appointments.appointments || []).slice(-5).reverse();
    const recentFollowups = (followups.followups || []).slice(-5).reverse();

    setCount('lead-count', `${recentLeads.length} recent`);
    setCount('appointment-count', `${recentAppointments.length} recent`);
    setCount('followup-count', `${summary.followups.queued} queued`);

    renderFeed(
      leadFeedEl,
      recentLeads,
      (lead) => `
        <div class="feed-item">
          <strong>${lead.callerName || lead.phone}</strong>
          <div>${lead.inquiry}</div>
          <div class="feed-meta">
            ${lead.topic} | ${lead.urgency} | ${lead.callbackWindow ? `Callback: ${lead.callbackWindow.label}` : 'No callback preference'}
          </div>
        </div>
      `,
      'Lead feed ready'
    );

    renderFeed(
      appointmentFeedEl,
      recentAppointments,
      (appointment) => `
        <div class="feed-item">
          <strong>${appointment.callerName || appointment.phone}</strong>
          <div>${formatDate(appointment.scheduledFor)}</div>
          <div class="feed-meta">${appointment.status} | ${appointment.provider}</div>
        </div>
      `,
      'Appointments will appear here'
    );

    renderFeed(
      followupFeedEl,
      recentFollowups,
      (followup) => `
        <div class="feed-item">
          <strong>${followup.phone}</strong>
          <div>${followup.message}</div>
          <div class="feed-meta">${followup.status} | ${formatDate(followup.createdAt)}</div>
        </div>
      `,
      'Follow-ups will appear here'
    );

    summaryBreakdownEl.innerHTML = `
      <div class="break-row">
        <strong>Lead Topics</strong>
        ${renderTokens(summary.leads.byTopic, 'No topic data yet')}
      </div>
      <div class="break-row">
        <strong>Lead Status</strong>
        ${renderTokens(summary.leads.byStatus, 'No status data yet')}
      </div>
      <div class="break-row">
        <strong>Urgency Mix</strong>
        ${renderTokens(summary.leads.byUrgency, 'No urgency data yet')}
      </div>
    `;
  } catch (error) {
    statsEl.innerHTML = `<article class="stat-card"><span class="stat-label">Dashboard Error</span><strong class="stat-value">Offline</strong></article>`;
    leadFeedEl.innerHTML = `<div class="feed-item"><strong>Unable to load dashboard data</strong><div class="feed-meta">${error.message}</div></div>`;
  }
};

loadDashboard();
setInterval(loadDashboard, 30000);
