import ListingMap from "@/components/object-page/listing-map";
import ObjectInfo from "@/components/object-page/object-info";
import { OBJECT_INFO_OPTIONS } from "@/components/object-page/object-info-config";
import ScheduleShowingSection from "@/components/object-page/schedule-showing-section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useSession } from "@/hooks/auth/useSession";
import { useListing } from "@/hooks/useListing";
import { useListingTags } from "@/hooks/useListingTags";
import { useMarkListingSeen } from "@/hooks/useMarkListingSeen";
import { useSaveTag } from "@/hooks/useSaveTag";
import { useUserTags } from "@/hooks/useUserTags";
import { Listing } from "@/types/listing";
import handleBack from "@/utils/handle-back";
import { isNewConstruction } from "@/utils/is-new-construction";
import { formatPrice } from "@shared/format";
import { Image } from "expo-image";
import { PlusSquare } from "lucide-react-native";
import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import FormError from "../form-error";
import { LikeButton } from "../like-button";
import { CategoriesDialog } from "../modals/categories-dialog";
import CategoryTag from "../tags/category-tag";
import { Icon } from "../ui/icon";
import { Spinner } from "../ui/spinner";
import ObjectDescription from "./object-description";

type ObjectPageProps = {
  listing: Listing | null;
  isLoading: boolean;
};

const fallbackImage = require("@/assets/images/no-image.jpg");

// Shows the fallback image when the listing has no image, or the image fails to load
function ListingImage({ imageUrl }: { imageUrl: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showFallback = !imageUrl || failedUrl === imageUrl;

  return (
    <Image
      source={showFallback ? fallbackImage : { uri: imageUrl }}
      onError={() => setFailedUrl(imageUrl)}
      style={{ width: "100%", height: 320 }}
      contentFit="cover"
    />
  );
}

export default function ObjectPageScreen({
  listing,
  isLoading,
}: ObjectPageProps) {
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);

  const { session } = useSession();
  const userId = session?.user.id;

  const [isSaving, setIsSaving] = useState(false);

  // My user_listings row for this listing (id and is_new).
  // null if a group member has been matched with the listing, but not the session user
  const { userListing, error: userListingError } = useListing(
    listing ? String(listing.id) : undefined,
  );

  // Mark the listing as seen every time the page opens, also a group member's listing outside my search
  useMarkListingSeen(listing?.id);

  const {
    tags,
    reload: reloadTags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useUserTags(userId);
  const {
    listingTags,
    reload: reloadListingTags,
    isLoading: listingTagsLoading,
    error: listingTagsError,
  } = useListingTags(userId);
  const {
    applyTag,
    unapplyTag,
    saveCategorization,
    isSaving: isSavingTag,
    error: saveTagError,
    clearError,
  } = useSaveTag();


  // Load errors (tags or applied tags) and save errors are shown in the same place
  const error =
    userListingError || tagsError || listingTagsError || saveTagError;
  // The dialog starts from the applied tags, so it must not open before both lists are
  // loaded. Otherwise saving would remove tags that just had not been fetched yet
  const canCategorize =
    !!userListing &&
    !tagsLoading &&
    !listingTagsLoading &&
    !tagsError &&
    !listingTagsError;
  const saving = isSaving || isSavingTag;

  // The ids of my categories (user_tags.id) that are on this listing.
  // listingTags holds every tag application I have, so filter on this listing's row
  const appliedTagIds = userListing
    ? listingTags
        .filter((lt) => lt.user_listing_id === userListing.id)
        .map((lt) => lt.user_tag_id)
    : [];

  // Called by the dialog with the selected category ids, the ids the dialog was opened
  //with, and the names of new categories. New categories are created here, on save
  async function handleSave(
    selectedIds: number[], 
    initialIds: number[],
    newNames: string[],
  ) {
    if (!userId || !userListing) return;
    setIsSaving(true);

    const ok = await saveCategorization({
      userId,
      userListingId: userListing.id,
      existingTags: tags,
      selectedIds,
      initialIds,
      newNames,
    })

    // Always fetch again, also on failure: some tags might have been created before it failed
    reloadTags();
    reloadListingTags();

    // Keep the dialog open if something failed, so error is visible
    if (ok) setCategoriesDialogOpen(false);
    setIsSaving(false)
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

  // Clears an old error when dialog is closed
  function closeCategoriesDialog() {
    clearError();
    setCategoriesDialogOpen(false);
  }

  if (isLoading)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background">
        <Spinner size="large" />
      </View>
    );

  if (!listing)
    return (
      <View className="flex-1 px-8 py-6 gap-6 bg-background justify-center items-center ">
        <Text>Kunde inte hitta objekt.</Text>
        <Button className="w-36" onPress={handleBack}>
          <Text>Tillbaka</Text>
        </Button>
      </View>
    );

  return (
    <View className="flex-1 bg-background">
      <Button className="justify-start" variant="link" onPress={handleBack}>
        <Text>Tillbaka</Text>
      </Button>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="pb-8"
      >
        {/* --- IMAGE --- */}
        <ListingImage imageUrl={listing.image_url} />
        <View className="px-8 py-6 gap-6">
          {/* --- ADDRESS AND AREA --- */}
          <View className="gap-4">
            <View>
              <View className="flex-row justify-between gap-2">
                <Text variant="h1" className="flex-1 shrink min-w-0">
                  {listing.address ?? "Adress saknas"}
                </Text>
                <View className="shrink-0">
                  <LikeButton listingId={listing.id} size={24} />
                </View>
              </View>
              <Text>
                {[listing.area, listing.municipality]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>

            {/* --- PRICE --- */}
            {listing.price != null ? (
              <Text variant="bold">{formatPrice(listing.price)}</Text>
            ) : (
              <Text variant="bold">Pris saknas</Text>
            )}
          </View>
          <Separator />

          {/* --- CATEGORIES --- */}
          <View className="gap-2">
            {/* Only possible if I have my own user_listings row and the tags are loaded */}
            {canCategorize && (
              <Pressable
                onPress={openCategoriesDialog}
                className="flex-row justify-start items-center gap-1 w-[50%]"
              >
                <Text variant="bold">Lägg till taggar</Text>
                <Icon as={PlusSquare} size={18} />
              </Pressable>
            )}
            <View className="flex-row flex-wrap justify-start gap-2">
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
              onOpenChange={closeCategoriesDialog}
              categories={tags}
              selectedIds={appliedTagIds}
              onSave={handleSave}
              isSaving={saving}
              error={saveTagError}
              onClearError={clearError}
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
            <ObjectDescription description={listing.description} />
            <Button
              onPress={() => Linking.openURL(listing.url)}
              className="w-52 mt-4"
            >
              <Text>Läs mer hos mäklaren</Text>
            </Button>
          </View>

          {/* --- MAP --- */}
          <ListingMap
            latitude={listing.latitude}
            longitude={listing.longitude}
          />
          <Separator />

          {/* --- SCHEDULE SHOWING --- */}
          <ScheduleShowingSection listingId={listing.id} />
        </View>
      </ScrollView>
    </View>
  );
}
