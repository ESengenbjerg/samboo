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
};
