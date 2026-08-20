import { Star } from "lucide-react";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import SearchCommand from "@/components/SearchCommand";
import { getWatchlistWithData } from "@/lib/actions/watchlist.actions";
import { WatchlistTable } from "@/components/WatchlistTable";
import { auth } from "@/lib/better-auth/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const Watchlist = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("sign-in");
  const user: User = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks("", user?.email || "");

  // Empty state
  if (watchlist.length === 0) {
    return (
      <section className="flex watchlist-empty-container">
        <div className="watchlist-empty">
          <Star className="watchlist-star" />
          <h2 className="empty-title">Your watchlist is empty</h2>
          <p className="empty-description">
            Start building your watchlist by searching for stocks and clicking
            the star icon to add them.
          </p>
        </div>
        <SearchCommand initialStocks={initialStocks} user={user} />
      </section>
    );
  }

  return (
    <section className="watchlist">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="watchlist-title">Watchlist</h2>
          <SearchCommand initialStocks={initialStocks} user={user} />
        </div>
        <WatchlistTable watchlist={watchlist} />
      </div>
    </section>
  );
};

export default Watchlist;
