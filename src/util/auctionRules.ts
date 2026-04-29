
// export function getRuleValue(
//   rules: AuctionRules | undefined,
//   key: string
// ): string | number | undefined {
//   return rules?.find((r) => r.key === key)?.value;
// }

// export function upsertRule(
//   rules: IAuctionRule[] | undefined,
//   rule: IAuctionRule
// ): IAuctionRule[] {
//   const base = Array.isArray(rules) ? [...rules] : [];
//   const idx = base.findIndex((r) => r.key === rule.key);
//   if (idx === -1) base.push(rule);
//   else base[idx] = { ...base[idx], ...rule };
//   return base;
// }

// export function removeRule(
//   rules: IAuctionRule[] | undefined,
//   key: string
// ): IAuctionRule[] {
//   return (rules ?? []).filter((r) => r.key !== key);
// }