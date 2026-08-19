"use client";

import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function WatchlistButton({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) {
  return (
    <Button className="watchlist-btn" onClick={() => onWatchlistChange}>
      <Star className={isInWatchlist ? "fill-yellow-400 text-yellow-400" : ""} />
      {type === "button" && (isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist")}
    </Button>
  );
}
