// A tag the user has created (user_tags)
export type UserTag = {
  id: number;
  tag_name: string;
};

// A tag applied to a matched listing (listing_tags)
export type ListingTag = {
  id: number;
  user_tag_id: number;
  user_listing_id: number;
  // The listing the tagged user_listings row points to. Used to match on listings.id,
  // so my tags also apply in a group member's list and in the shared list
  user_listings: { listing_id: number };
};
