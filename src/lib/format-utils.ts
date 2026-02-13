export function formatTokenCount(tokens: number): string {
  return `~${tokens.toLocaleString('en-US')}`;
}

export function formatEstimatedCost(cost: number): string {
  return `~$${cost.toFixed(2)}`;
}

export function formatTokenSummary(tokens: number, cost: number): string {
  return `${formatTokenCount(tokens)} tokens, est. ${formatEstimatedCost(cost)}`;
}
