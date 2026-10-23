import { sendInvite } from "@/services/invites";
import { useMutation } from "@tanstack/react-query";

export const useSendInvite = () => useMutation({ mutationFn: sendInvite });
