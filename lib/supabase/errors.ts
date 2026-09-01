export function mapNbcError(message: string, hint?: string | null) {
  const code = message.replace(/^.*\b(NBC_[A-Z_]+).*$/s, "$1");
  switch (code) {
    case "NBC_UNAUTHENTICATED":
      return "Log in to continue.";
    case "NBC_PROFILE_INCOMPLETE":
      return "Choose a username before bidding.";
    case "NBC_OWN_LISTING":
      return "You cannot bid on your own listing.";
    case "NBC_NOT_LIVE":
      return "This auction is not live.";
    case "NBC_TOO_LOW": {
      const min = hint ? Number(hint) : null;
      if (min && Number.isFinite(min)) {
        return `Bid is too low. Minimum is ${(min / 100).toLocaleString("he-IL")} ₪.`;
      }
      return "Bid is too low.";
    }
    case "NBC_NOT_FOUND":
      return "Listing not found.";
    case "NBC_FORBIDDEN":
      return "You cannot publish this listing.";
    case "NBC_NOT_EDITABLE":
      return "This listing is no longer a draft.";
    case "NBC_MISSING_WINDOW":
      return "Set start and end times, save the draft, then publish.";
    case "NBC_BAD_WINDOW":
      return "End time must be after start time.";
    case "NBC_ALREADY_ENDED":
      return "End time is already in the past.";
    case "NBC_INVALID_AMOUNT":
      return "Enter a valid bid amount.";
    default:
      return message;
  }
}
