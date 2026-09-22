const validateSimulatedCall = (payload = {}) => {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  if (typeof payload.phone !== 'string' || !/^\+[1-9]\d{7,14}$/.test(payload.phone)) {
    errors.push('phone must be an international number such as +19025550123');
  }
  if (typeof payload.message !== 'string' || !payload.message.trim() || payload.message.length > 5000) {
    errors.push('message must contain 1 to 5000 characters');
  }
  if (payload.callerName !== undefined && payload.callerName !== null &&
      (typeof payload.callerName !== 'string' || payload.callerName.length > 200)) {
    errors.push('callerName must be a string of at most 200 characters');
  }
  if (payload.optInFollowUp !== undefined && typeof payload.optInFollowUp !== 'boolean') {
    errors.push('optInFollowUp must be a boolean');
  }

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
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['payload must be an object'] };
  }
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

    const isHour = (value) =>
      (typeof value === 'number' || (typeof value === 'string' && /^\d{1,2}$/.test(value))) &&
      Number.isInteger(Number(value));
    if (!isHour(payload.startHour) || !isHour(payload.endHour)) {
      errors.push('startHour and endHour must be whole hours');
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
