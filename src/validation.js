const validateSimulatedCall = (payload = {}) => {
  const errors = [];

  if (!payload.phone) errors.push('phone is required');
  if (!payload.message) errors.push('message is required');

  if (payload.persona && !['sales_pro', 'concierge', 'tech_expert'].includes(payload.persona)) {
    errors.push('persona must be one of sales_pro, concierge, tech_expert');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const validateCallbackWindow = (payload = {}) => {
  const errors = [];
  const allowedLabels = ['morning', 'afternoon', 'evening'];

  if (!payload.label) errors.push('label is required');
  if (payload.startHour === undefined) errors.push('startHour is required');
  if (payload.endHour === undefined) errors.push('endHour is required');

  if (payload.label && !allowedLabels.includes(payload.label)) {
    errors.push('label must be one of morning, afternoon, evening');
  }

  if (payload.startHour !== undefined && payload.endHour !== undefined) {
    const startHour = Number(payload.startHour);
    const endHour = Number(payload.endHour);

    if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
      errors.push('startHour and endHour must be numbers');
    } else if (startHour < 0 || endHour > 23 || startHour >= endHour) {
      errors.push('startHour and endHour must form a valid hour range');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateSimulatedCall,
  validateCallbackWindow
};
