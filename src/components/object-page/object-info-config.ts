import {
    BedDoubleIcon,
    HandCoins,
    House,
    LucideVectorSquare,
} from "lucide-react-native";

export const OBJECT_INFO = {
  property_type: { icon: House, title: "Bostadstyp", suffix: "" },
  rooms: { icon: BedDoubleIcon, title: "Antal rum", suffix: " rum" },
  living_area: { icon: LucideVectorSquare, title: "Boarea", suffix: " kvm" },
  monthly_fee: { icon: HandCoins, title: "Avgift", suffix: " kr/mån" },
};

export type ObjectInfoType = keyof typeof OBJECT_INFO;

export const OBJECT_INFO_OPTIONS = Object.keys(OBJECT_INFO) as ObjectInfoType[];
