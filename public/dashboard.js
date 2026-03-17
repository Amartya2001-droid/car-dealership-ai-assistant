const statsEl = document.getElementById('stats');
const leadFeedEl = document.getElementById('lead-feed');
const appointmentFeedEl = document.getElementById('appointment-feed');
const followupFeedEl = document.getElementById('followup-feed');
const summaryBreakdownEl = document.getElementById('summary-breakdown');
const runtimeStatusEl = document.getElementById('runtime-status');
const attentionQueueEl = document.getElementById('attention-queue');
const leadSearchEl = document.getElementById('lead-search');
const topicFilterEl = document.getElementById('topic-filter');
const statusFilterEl = document.getElementById('status-filter');
const lastUpdatedEl = document.getElementById('last-updated');
const refreshButtonEl = document.getElementById('refresh-button');

let dashboardState = {
  leads: [],
  loading: false
};

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

const setSelectOptions = (element, values, label) => {
  const currentValue = element.value || 'all';
  element.innerHTML = [`<option value="all">All ${label}</option>`]
    .concat(values.map((value) => `<option value="${value}">${value}</option>`))
    .join('');
  element.value = values.includes(currentValue) ? currentValue : 'all';
};

const getFilteredLeads = () => {
  const query = leadSearchEl.value.trim().toLowerCase();
  const topic = topicFilterEl.value;
  const status = statusFilterEl.value;

  return dashboardState.leads.filter((lead) => {
    const matchesQuery =
      !query ||
      [lead.callerName, lead.phone, lead.inquiry]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    const matchesTopic = topic === 'all' || lead.topic === topic;
    const matchesStatus = status === 'all' || lead.status === status;

    return matchesQuery && matchesTopic && matchesStatus;
  });
};

const renderLeads = () => {
  const filteredLeads = getFilteredLeads();
  const recentLeads = filteredLeads.slice(-5).reverse();

  setCount('lead-count', `${filteredLeads.length} of ${dashboardState.leads.length} leads`);
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
        ${
          lead.showroomAsset
            ? `<div class="feed-links">
                <a href="${lead.showroomAsset.brochureUrl}" target="_blank" rel="noreferrer">Brochure</a>
                <a href="${lead.showroomAsset.videoUrl}" target="_blank" rel="noreferrer">Walkaround</a>
              </div>`
            : ''
        }
      </div>
    `,
    'Lead feed ready'
  );
};

const renderAttentionQueue = (leads, followups) => {
  const queuedPhones = new Set(
    (followups || []).filter((item) => item.status === 'queued').map((item) => item.phone)
  );

  const priorityLeads = (leads || [])
    .filter((lead) => lead.urgency === 'high' || lead.callbackWindow || queuedPhones.has(lead.phone))
    .slice(-5)
    .reverse();

  renderFeed(
    attentionQueueEl,
    priorityLeads,
    (lead) => {
      const priorityClass = lead.urgency === 'high' ? 'priority-high' : 'priority-medium';
      return `
        <div class="feed-item ${priorityClass}">
          <strong>${lead.callerName || lead.phone}</strong>
          <div>${lead.inquiry}</div>
          <div class="feed-meta">
            ${lead.urgency} | ${lead.status} | ${lead.callbackWindow ? `Callback ${lead.callbackWindow.label}` : 'No callback window'}
          </div>
        </div>
      `;
    },
    'Priority items will appear here'
  );
};

const loadDashboard = async () => {
  try {
    dashboardState.loading = true;
    refreshButtonEl.textContent = 'Refreshing...';
    refreshButtonEl.disabled = true;
    const [summaryRes, leadsRes, appointmentsRes, followupsRes, runtimeRes] = await Promise.all([
      fetch('/admin/summary'),
      fetch('/admin/leads'),
      fetch('/admin/appointments'),
      fetch('/admin/followups'),
      fetch('/admin/runtime')
    ]);

    const [summary, leads, appointments, followups, runtime] = await Promise.all([
      summaryRes.json(),
      leadsRes.json(),
      appointmentsRes.json(),
      followupsRes.json(),
      runtimeRes.json()
    ]);

    renderStats(summary);

    dashboardState.leads = leads.leads || [];
    setSelectOptions(topicFilterEl, [...new Set(dashboardState.leads.map((lead) => lead.topic).filter(Boolean))], 'topics');
    setSelectOptions(statusFilterEl, [...new Set(dashboardState.leads.map((lead) => lead.status).filter(Boolean))], 'statuses');
    const recentAppointments = (appointments.appointments || []).slice(-5).reverse();
    const recentFollowups = (followups.followups || []).slice(-5).reverse();

    setCount('appointment-count', `${recentAppointments.length} recent`);
    setCount('followup-count', `${summary.followups.queued} queued`);
    lastUpdatedEl.textContent = formatDate(Date.now());

    renderLeads();

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

    renderAttentionQueue(dashboardState.leads, followups.followups || []);

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

    runtimeStatusEl.innerHTML = `
      <div class="runtime-grid">
        <div class="runtime-item">
          <span>Version</span>
          <strong>${runtime.version}</strong>
        </div>
        <div class="runtime-item">
          <span>Storage Provider</span>
          <strong>${runtime.storage.provider}</strong>
        </div>
        <div class="runtime-item">
          <span>Storage Mode</span>
          <strong>${runtime.storage.mode}</strong>
        </div>
        <div class="runtime-item">
          <span>Default Persona</span>
          <strong>${runtime.defaultPersona}</strong>
        </div>
      </div>
    `;
  } catch (error) {
    statsEl.innerHTML = `<article class="stat-card"><span class="stat-label">Dashboard Error</span><strong class="stat-value">Offline</strong></article>`;
    leadFeedEl.innerHTML = `<div class="feed-item"><strong>Unable to load dashboard data</strong><div class="feed-meta">${error.message}</div></div>`;
  } finally {
    dashboardState.loading = false;
    refreshButtonEl.textContent = 'Refresh now';
    refreshButtonEl.disabled = false;
  }
};

loadDashboard();
setInterval(loadDashboard, 30000);

[leadSearchEl, topicFilterEl, statusFilterEl].forEach((element) => {
  element.addEventListener('input', renderLeads);
  element.addEventListener('change', renderLeads);
});

refreshButtonEl.addEventListener('click', loadDashboard);
