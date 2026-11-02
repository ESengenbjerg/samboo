import { router } from "expo-router";

export type BasePath = "/saved/object/[id]" | "/search/object/[id]";

export function goToObject(listingId: number, path: BasePath) {
    router.push({
      pathname: path,
      params: { id: String(listingId) },
    });
  }