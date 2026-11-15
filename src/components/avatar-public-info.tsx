import { Text } from "./ui/text";

type AvatarPublicInfoProps = {
  // Location where user can change the image
  location?: string;
};

export default function AvatarPublicInfo({ location }: AvatarPublicInfoProps) {
  return (
    <Text variant="small">
      Konton du kopplar ihop dig med ser din profilbild. Bilden sparas med en
      öppen länk, så den som får tag på länken kan också se den. Du kan när som
      helst byta eller ta bort bilden
      {location ? ` under ${location}` : ""}.
    </Text>
  );
}
