import type { Tables } from "@shared/database.types";

// The listings columns the app uses. Queries may return more (listings(*)), never less
export type Listing = Pick<
  Tables<"listings">,
  | "id"
  | "agency"
  | "external_id"
  | "url"
  | "property_type"
  | "municipality"
  | "area"
  | "price"
  | "rooms"
  | "living_area"
  | "monthly_fee"
  | "address"
  | "image_url"
  | "is_new_construction"
  | "latitude"
  | "longitude"
  | "build_year"
  | "plot_area"
  | "floor_level"
  | "description"
  | "removed_at"
>;

export type UserListing = Pick<
  Tables<"user_listings">,
  "id" | "is_new" | "liked"
> & {
  listings: Listing;
};

// A listing together with my user_listings row data, so the UI can show the "Ny" flag
// and attach tags (listing_tags.user_listing_id = user_listing_id)
export type MatchedListing = Listing & {
  user_listing_id: number;
  is_new: boolean;
};

// A listing in a group member's liked list, with when the member liked it
export type MemberLikedListing = Listing &
  Pick<Tables<"user_listings">, "liked_at">;

// A listing's position. Both are null when the agency has not published one
export type ListingCoordinates = Pick<Listing, "latitude" | "longitude">;
