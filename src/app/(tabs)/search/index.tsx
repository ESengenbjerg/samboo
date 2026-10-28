import ListingsFeed from "@/components/listings-feed";
import { useListings } from "@/hooks/useListings";

export default function SearchScreen() {
  const { listings, loading } = useListings();

  return (
    <ListingsFeed
      title={"Filtrerad sökning"}
      listings={listings}
      path={"/search/object/[id]"}
      isLoading={loading}
      error={null}
    />
  );
}
