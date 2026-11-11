import StatusRow from "@/components/admin/status-row";
import FormError from "@/components/form-error";
import { ConfirmDialog } from "@/components/modals/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { EMAIL_MAX_LENGTH } from "@/constants/limits";
import { useBlockUser } from "@/hooks/admin/useBlockUser";
import { showToast } from "@/stores/toast";
import { AdminUser } from "@/types/admin";
import { formatDateTime } from "@/utils/date-format";
import { useState } from "react";
import { View } from "react-native";

type UserCardProps = {
  user: AdminUser;
  onToggle: () => void;
  isSubmitting: boolean;
};

function UserCard({ user, onToggle, isSubmitting }: UserCardProps) {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="flex-row items-center justify-between gap-2 px-4">
        <CardTitle className="shrink">{user.name}</CardTitle>
        <Badge variant={user.is_active ? "secondary" : "destructive"}>
          <Text>{user.is_active ? "Aktiv" : "Spärrad"}</Text>
        </Badge>
      </CardHeader>
      <CardContent className="gap-2 px-4">
        <StatusRow label="E-post" value={user.email} />
        <StatusRow
          label="E-post bekräftad"
          value={user.email_confirmed ? "Ja" : "Nej"}
        />
        <StatusRow label="Registrerad" value={formatDateTime(user.created_at)} />
        <StatusRow
          label="Senaste inloggning"
          value={formatDateTime(user.last_sign_in_at)}
        />
        {user.is_admin && <StatusRow label="Roll" value="Administratör" />}
      </CardContent>
      <CardContent className="px-4">
        <Button
          variant={user.is_active ? "destructive" : "secondary"}
          onPress={onToggle}
          disabled={isSubmitting}
          className="self-start"
        >
          <Text>{user.is_active ? "Spärra konto" : "Häv spärr"}</Text>
        </Button>
      </CardContent>
    </Card>
  );
}

// Find a user by exact e-mail and block or unblock them. Search instead of a list, so the view works with many users and does not show every address
export default function BlockUserSection() {
  const [email, setEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const {
    user,
    isSearching,
    isSubmitting,
    error,
    search,
    setActive,
    clearError,
  } = useBlockUser();

  // true = the dialog blocks, false = it unblocks
  const willBlock = user?.is_active ?? false;

  async function onConfirm() {
    if (!user) return;
    setConfirmOpen(false);
    const saved = await setActive(user, !willBlock);
    if (saved) showToast(willBlock ? "Kontot är spärrat." : "Spärren är hävd.");
  }

  return (
    <View className="gap-4">
      <View>
        <Text variant="h2">Spärra användare</Text>
        <Text>
          Sök på användarens e-postadress. Ett spärrat konto kommer inte åt
          något i appen, och adressen kan inte användas för att registrera sig
          igen.
        </Text>
      </View>

      <View className="gap-2">
        <Label htmlFor="block-user-email">E-postadress</Label>
        <View className="flex-row gap-2">
          <Input
            id="block-user-email"
            className="flex-1"
            placeholder="m@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) clearError();
            }}
            onSubmitEditing={() => search(email)}
            keyboardType="email-address"
            autoComplete="off"
            autoCapitalize="none"
            maxLength={EMAIL_MAX_LENGTH}
            returnKeyType="search"
            editable={!isSearching}
          />
          <Button
            onPress={() => search(email)}
            disabled={isSearching || !email.trim()}
          >
            <Text>{isSearching ? "Söker..." : "Sök"}</Text>
          </Button>
        </View>
      </View>

      {error && <FormError>{error}</FormError>}
      {user === null && <Text>Ingen användare med den e-postadressen.</Text>}
      {user && (
        <UserCard
          user={user}
          onToggle={() => setConfirmOpen(true)}
          isSubmitting={isSubmitting}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={willBlock ? "Spärra kontot?" : "Häva spärren?"}
        description={
          willBlock
            ? `${user?.name} (${user?.email}) kommer inte längre åt något i appen.`
            : `${user?.name} (${user?.email}) får tillgång till appen igen.`
        }
        actionLabel={willBlock ? "Spärra" : "Häv spärr"}
        onAction={onConfirm}
        cancelLabel="Avbryt"
        onCancel={() => setConfirmOpen(false)}
        isLoading={isSubmitting}
      />
    </View>
  );
}
