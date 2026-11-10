import { THEME } from "@/lib/theme";
import { useColorScheme } from "nativewind";
import Svg, { Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  filled?: boolean;
};

type RectDef = { x: number; y: number; width: number; height: number };

const COLUMN_RECTS: RectDef[] = [
  { x: 1, y: 1, width: 18, height: 7 },
  { x: 1, y: 12, width: 18, height: 7 },
];

const GRID_RECTS: RectDef[] = [
  { x: 1, y: 1, width: 7, height: 7 },
  { x: 12, y: 1, width: 7, height: 7 },
  { x: 1, y: 12, width: 7, height: 7 },
  { x: 12, y: 12, width: 7, height: 7 },
];

function ViewIcon({
  rects,
  size = 20,
  color,
  filled = false,
}: IconProps & { rects: RectDef[] }) {
  const { colorScheme } = useColorScheme();
  const iconColor = color ?? THEME[colorScheme ?? "light"].foreground;

  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      {rects.map((rect) => (
        <Rect
          key={`${rect.x}-${rect.y}`}
          {...rect}
          rx={1}
          stroke={iconColor}
          strokeWidth={2}
          fill={filled ? iconColor : "none"}
        />
      ))}
    </Svg>
  );
}

export function ViewColumnIcon(props: IconProps) {
  return <ViewIcon rects={COLUMN_RECTS} {...props} />;
}

export function ViewGridIcon(props: IconProps) {
  return <ViewIcon rects={GRID_RECTS} {...props} />;
}
