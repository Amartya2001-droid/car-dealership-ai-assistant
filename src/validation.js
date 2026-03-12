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

module.exports = {
  validateSimulatedCall
};
