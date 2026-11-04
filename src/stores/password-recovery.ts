import { create } from "zustand";

// True from a valid reset code until the new password is saved.
// The user has a session then, but must stay in (auth) to set the password.
// Not persisted: if the app restarts mid-reset, the user is simply signed in
type PasswordRecoveryState = {
  isRecovering: boolean;
  setIsRecovering: (isRecovering: boolean) => void;
};

export const usePasswordRecoveryStore = create<PasswordRecoveryState>()(
  (set) => ({
    isRecovering: false,
    setIsRecovering: (isRecovering) => set({ isRecovering }),
  }),
);
