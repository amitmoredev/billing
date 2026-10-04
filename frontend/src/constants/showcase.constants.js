// Illustrative figures for the landing page and sign-in previews.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * 36 months of one plant's consumption in MWh, Oct 2023 – Sep 2026: a seasonal
 * swing, slow growth, and a sudden jump in the latest month.
 */
export const CONSUMPTION_TREND = Array.from({ length: 36 }, (_, i) => {
  const monthIndex = (i + 9) % 12;
  const year = 2023 + Math.floor((i + 9) / 12);
  const seasonal = 60 + i * 0.15 + 7 * Math.sin(((i + 4) / 12) * 2 * Math.PI);
  const value = i === 35 ? seasonal * 1.18 : seasonal;

  return {
    label: MONTHS[monthIndex],
    tooltip: `${MONTHS[monthIndex]} ${year}`,
    value: Math.round(value * 10) / 10,
  };
});

export const FINANCIALS = {
  annualCost: '₹1.84 Cr',
  avoidableCost: '₹21.6 L',
  potentialSavings: '₹14.2 L',
};
