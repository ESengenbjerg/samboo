import ListingsFeed from "@/components/listings-feed";
import { useSession } from "@/hooks/auth/useSession";
import { useListings } from "@/hooks/useListings";

export default function SearchScreen() {
  const { session } = useSession();
  const { listings, isLoading, error } = useListings(session?.user.id);

  return (
    <ListingsFeed
      title={"Din bevakning"}
      listings={listings}
      path={"/search/object/[id]"}
      isLoading={isLoading}
      error={error}
      showUpdateFilter
      emptyMessage="Vi letar efter bostäder som matchar din bevakning. Nya objekt dyker upp här."
    />
  );
}
