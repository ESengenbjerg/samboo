import { getListings } from "@/services/listings";
import { useQuery } from "@tanstack/react-query";

export const useListings = () =>
  useQuery({ queryKey: ["listings"], queryFn: getListings });
