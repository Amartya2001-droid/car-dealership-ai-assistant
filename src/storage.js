const fs = require('fs');
const path = require('path');
const config = require('./config');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const ensureFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

const readJson = (filePath, defaultValue) => {
  ensureFile(filePath, defaultValue);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw || JSON.stringify(defaultValue));
};

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

ensureDir(config.dataDir);

const files = {
  leads: path.join(config.dataDir, 'leads.json'),
  followups: path.join(config.dataDir, 'followups.json'),
  knowledge: path.join(config.dataDir, 'knowledge-base.json'),
  appointments: path.join(config.dataDir, 'appointments.json')
};

ensureFile(files.leads, []);
ensureFile(files.followups, []);
ensureFile(files.appointments, []);
ensureFile(files.knowledge, {
  inventory: [
    {
      id: 'inv-100',
      make: 'Toyota',
      model: 'RAV4',
      year: 2025,
      price: 39250,
      bodyType: 'SUV',
      fuelType: 'Hybrid',
      inStock: true
    },
    {
      id: 'inv-101',
      make: 'Honda',
      model: 'CR-V',
      year: 2025,
      price: 37800,
      bodyType: 'SUV',
      fuelType: 'Gasoline',
      inStock: true
    },
    {
      id: 'inv-102',
      make: 'Mazda',
      model: 'CX-30',
      year: 2024,
      price: 34120,
      bodyType: 'SUV',
      fuelType: 'Gasoline',
      inStock: true
    },
    {
      id: 'inv-103',
      make: 'Tesla',
      model: 'Model 3',
      year: 2025,
      price: 48990,
      bodyType: 'Sedan',
      fuelType: 'Electric',
      inStock: false
    }
  ],
  hours: {
    salesWeekdays: '9:00 AM - 6:00 PM',
    serviceWeekdays: '8:00 AM - 5:30 PM',
    saturday: '10:00 AM - 4:00 PM',
    sunday: 'Closed'
  },
  promotions: [
    '0.99% APR for up to 48 months on select SUVs.',
    'Free first-year maintenance package on certified pre-owned vehicles.'
  ]
});

const appendRecord = (filePath, record) => {
  const records = readJson(filePath, []);
  records.push(record);
  writeJson(filePath, records);
  return record;
};

const updateRecordById = (filePath, id, updates = {}) => {
  const records = readJson(filePath, []);
  const index = records.findIndex((item) => item.id === id);
  if (index === -1) return null;

  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  writeJson(filePath, records);
  return records[index];
};

const summarizeLeads = (leads = []) => {
  const summary = {
    total: leads.length,
    byStatus: {},
    byTopic: {},
    byUrgency: {},
    callbacksRequested: 0
  };

  for (const lead of leads) {
    summary.byStatus[lead.status] = (summary.byStatus[lead.status] || 0) + 1;
    summary.byTopic[lead.topic] = (summary.byTopic[lead.topic] || 0) + 1;
    summary.byUrgency[lead.urgency] = (summary.byUrgency[lead.urgency] || 0) + 1;
    if (lead.callbackWindow) {
      summary.callbacksRequested += 1;
    }
  }

  return summary;
};

module.exports = {
  files,
  readJson,
  writeJson,
  appendLead: (lead) => appendRecord(files.leads, lead),
  appendFollowUp: (followup) => appendRecord(files.followups, followup),
  appendAppointment: (appointment) => appendRecord(files.appointments, appointment),
  updateLeadById: (id, updates) => updateRecordById(files.leads, id, updates),
  updateAppointmentById: (id, updates) => updateRecordById(files.appointments, id, updates),
  summarizeLeads
};
