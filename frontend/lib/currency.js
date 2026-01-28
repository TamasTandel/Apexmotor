// Currency formatting utilities to keep SSR & client consistent and avoid Intl locale discrepancies
export function formatINR(value) {
  const n = Number(value);
  if (!isFinite(n)) return '₹—';
  const v = Math.round(n);
  const s = String(v);
  if (s.length <= 3) return '₹' + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const restWith = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return '₹' + restWith + ',' + last3;
}

export function convertUSDToINR(usd, rateEnv) {
  const rate = rateEnv ? Number(rateEnv) : 83;
  if (!usd || !isFinite(usd)) return 0;
  return Math.round(Number(usd) * rate);
}

export function formatUSD(value) {
  const n = Number(value);
  if (!isFinite(n)) return '$—';
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
