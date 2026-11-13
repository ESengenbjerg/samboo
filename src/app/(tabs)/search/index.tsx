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
      emptyMessage="Inga bostäder matchar din bevakning just nu. Vi söker regelbundet efter nya annonser och visar träffar här. Du kan också prova att bredda bevakningen, till exempel med fler områden eller ett högre prisintervall."
    />
  );
}
