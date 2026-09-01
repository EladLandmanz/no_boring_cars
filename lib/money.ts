export function formatIls(agorot: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: agorot % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(agorot / 100);
}

export function currentPriceAgorot(
  startingBidAgorot: number,
  highBidAgorot: number | null,
) {
  return highBidAgorot ?? startingBidAgorot;
}

export function minNextBidAgorot(
  startingBidAgorot: number,
  highBidAgorot: number | null,
  incrementAgorot: number,
) {
  if (highBidAgorot == null) return startingBidAgorot;
  return highBidAgorot + incrementAgorot;
}
