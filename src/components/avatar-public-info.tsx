import { Text } from "./ui/text";

type AvatarPublicInfoProps = {
  // Location where user can change the image
  location: string;
};

export default function AvatarPublicInfo({ location }: AvatarPublicInfoProps) {
  return (
    <Text variant="small">
      Din profilbild är offentlig. Alla som besöker din profil kan se och spara
      bilden. Du kan när som helst byta eller ta bort bilden under {location}.
    </Text>
  );
}
