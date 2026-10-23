import { getProfile } from "@/services/profile";
import { useQuery } from "@tanstack/react-query";

export const useProfile = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
    enabled,
    retry: false,
  });
