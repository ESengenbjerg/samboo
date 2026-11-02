import { Image } from "expo-image";

type ProfileImageProps = {
  uri: string;
  size?: number;
};

export default function ProfileImage({ uri, size = 96 }: ProfileImageProps) {
  return (
    <Image
      source={{ uri }}
      style={{ width: 96, height: 96, borderRadius: 48 }}
      className="w-24 h-24 rounded-full self-center"
    />
  );
}
