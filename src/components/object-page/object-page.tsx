import ObjectInfo from "@/components/object-page/object-info";
import { OBJECT_INFO_OPTIONS } from "@/components/object-page/object-info-config";
import ScheduleShowingSection from "@/components/object-page/schedule-showing-section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useListing } from "@/hooks/useListing";
import { useListingTags } from "@/hooks/useListingTags";
import { useSaveTag } from "@/hooks/useSaveTag";
import { useSession } from "@/hooks/useSession";
import { useUserTags } from "@/hooks/useUserTags";
import { Listing } from "@/types/listing";
import { formatPrice } from "@/utils/format-price";
import { isNewConstruction } from "@/utils/is-new-construction";
import { Image } from "expo-image";
import { router } from "expo-router";
import { PlusSquare } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import FormError from "../form-error";
import { LikeButton } from "../like-button";
import { CategoriesDialog } from "../modals/categories-dialog";
import CategoryTag from "../tags/category-tag";
import { Icon } from "../ui/icon";

type ObjectPageProps = {
  listing: Listing | null;
  isLoading: boolean;
};

export default function ObjectPageScreen({
  listing,
  isLoading,
}: ObjectPageProps) {
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);

  const { session } = useSession();
  const userId = session?.user.id;

  // My user_listings row for this listing (id and is_new).
  // null if a group member has been matched with the listing, but not the session user
  const { userListing } = useListing(listing ? String(listing.id) : undefined);

  const { tags, reload: reloadTags } = useUserTags(userId);
  const { listingTags, reload: reloadListingTags } = useListingTags(userId);
  const { createTag, applyTag, unapplyTag, isSaving, error, clearError } =
    useSaveTag();

  // The ids of my categories (user_tags.id) that are on this listing.
  // listingTags holds every tag application I have, so filter on this listing's row
  const appliedTagIds = userListing
    ? listingTags
        .filter((lt) => lt.user_listing_id === userListing.id)
        .map((lt) => lt.user_tag_id)
    : [];

  // Called by the dialog when the user adds a new category.
  // Returns the new category (or null on failure) so the dialog can select it
  async function handleCreateTag(name: string) {
    if (!userId) return null;

    const tag = await createTag(userId, name);
    if (tag) reloadTags();
    return tag;
  }

  // Called by the dialog with the final list of selected category ids.
  // Only the difference to what is already saved is sent to the database
  async function handleSave(selectedIds: number[]) {
    if (!userListing) return;

    // Selected in the dialog but not saved yet
    const toAdd = selectedIds.filter((id) => !appliedTagIds.includes(id));
    // Saved earlier but removed in the dialog
    const toRemove = appliedTagIds.filter((id) => !selectedIds.includes(id));

    // Run all changes in parallel. Each call returns true on success
    const results = await Promise.all([
      ...toAdd.map((id) => applyTag(id, userListing.id)),
      ...toRemove.map((id) => unapplyTag(id, userListing.id)),
    ]);

    // Fetch again so the tags on the page match the database
    reloadListingTags();
    // Keep the dialog open if something failed, so the error is visible
    if (results.every(Boolean)) setCategoriesDialogOpen(false);
  }

  // Removes one category from this listing directly, without opening the dialog
  async function handleRemoveTag(tagId: number) {
    if (!userListing) return;

    const removed = await unapplyTag(tagId, userListing.id);
    // Fetch again so the tag disappears from the page
    if (removed) reloadListingTags();
  }

  // Clears an old error from a previous attempt before the dialog opens
  function openCategoriesDialog() {
    clearError();
    setCategoriesDialogOpen(true);
  }

  if (isLoading)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Text>Laddar...</Text>
      </View>
    );

  if (!listing)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background justify-center items-center ">
        <Text>Kunde inte hitta objekt.</Text>
        <Button className="w-36" onPress={() => router.back()}>
          <Text>Tillbaka</Text>
        </Button>
      </View>
    );

  return (
    <View className="flex-1 bg-background">
      <Button
        className="justify-start"
        variant="link"
        onPress={() => router.back()}
      >
        <Text>Tillbaka</Text>
      </Button>
      <ScrollView className="flex-1">
        {/* --- IMAGE --- */}
        <Image
          source={
            listing.ld_json.image
              ? { uri: listing.ld_json.image }
              : require("@/assets/images/no-image.jpg")
          }
          style={{ width: "100%", height: 320 }}
          contentFit="cover"
        />
        <View className="px-8 py-6 gap-6">
          {/* --- ADDRESS AND AREA --- */}
          <View className="gap-4">
            <View>
              <View className="flex-row justify-between items-center">
                <Text variant="h1">
                  {listing.ld_json.streetAddress ?? "Adress saknas"}
                </Text>
                <LikeButton listingId={listing.id} size={24} />
              </View>
              <Text>
                {[listing.area, listing.municipality]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>

            {/* --- PRICE --- */}
            {listing.price != null && (
              <Text variant="bold">{formatPrice(listing.price)}</Text>
            )}
          </View>
          <Separator />

          {/* --- CATEGORIES --- */}
          <View className="gap-2">
            {/* Only possible if I have my own user_listings row for the listing */}
            {userListing && (
              <Pressable
                onPress={openCategoriesDialog}
                className="flex-row justify-start items-center gap-1 w-[50%]"
              >
                <Text variant="bold">Kategorisera</Text>
                <Icon as={PlusSquare} size={18} />
              </Pressable>
            )}
            <View className="flex-row justify-start gap-2">
              {isNewConstruction(listing) && <CategoryTag isNewConstruction />}
              {/* My own categories on this listing */}
              {tags
                .filter((t) => appliedTagIds.includes(t.id))
                .map((t) => (
                  <Pressable key={t.id} onPress={() => handleRemoveTag(t.id)}>
                    <CategoryTag text={t.tag_name} removable />
                  </Pressable>
                ))}
            </View>
            {/* The dialog shows its own error, so only show it here when it is closed */}
            {error && !categoriesDialogOpen && <FormError>{error}</FormError>}
          </View>

          {categoriesDialogOpen && (
            <CategoriesDialog
              open={categoriesDialogOpen}
              onOpenChange={setCategoriesDialogOpen}
              categories={tags}
              selectedIds={appliedTagIds}
              onCreateCategory={handleCreateTag}
              onSave={handleSave}
              isSaving={isSaving}
              error={error}
            />
          )}

          {/* --- OBJECT INFO --- */}
          <View className="gap-6">
            <Text variant="h4">Om bostaden</Text>
            <View className="gap-2">
              {OBJECT_INFO_OPTIONS.map((o) => (
                <ObjectInfo key={o} type={o} value={listing[o]} />
              ))}
            </View>
            <Button
              onPress={() => Linking.openURL(listing.url)}
              className="w-52 mt-4"
            >
              <Text>Läs mer hos mäklaren</Text>
            </Button>
          </View>
          <Separator />
          {/* --- SCHEDULE SHOWING --- */}
          <ScheduleShowingSection listingId={listing.id} />
        </View>
      </ScrollView>
    </View>
  );
}
