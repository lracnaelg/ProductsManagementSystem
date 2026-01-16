// Currency formatting utility
export const formatCurrency = (amount) => {
  return `₱${parseFloat(amount || 0).toFixed(2)}`;
};

export const formatCurrencyNoDecimals = (amount) => {
  return `₱${parseFloat(amount || 0).toFixed(0)}`;
};
