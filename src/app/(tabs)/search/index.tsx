import ListingsFeed from "@/components/listings-feed";
import { useListings } from "@/hooks/useListings";
import { useSession } from "@/hooks/useSession";

export default function SearchScreen() {
  const { session } = useSession();
  const { listings, isLoading, error } = useListings(session?.user.id);

  return (
    <ListingsFeed
      title={"Filtrerad sökning"}
      listings={listings}
      path={"/search/object/[id]"}
      isLoading={isLoading}
      error={error}
      showUpdateFilter
    />
  );
}
