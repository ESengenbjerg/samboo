import Svg, { Rect } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
  filled?: boolean;
};

export function ViewColumnIcon({
  size = 20,
  color = "#293907",
  filled = false,
}: IconProps) {
  const fill = filled ? color : "none";
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={fill}>
      <Rect
        x={1}
        y={1}
        width={18}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={1}
        y={12}
        width={18}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
export function ViewGridIcon({
  size = 20,
  color = "#293907",
  filled = false,
}: IconProps) {
  const fill = filled ? color : "none";
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill={fill}>
      <Rect
        x={1}
        y={1}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={12}
        y={1}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={1}
        y={12}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={12}
        y={12}
        width={7}
        height={7}
        rx={1}
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
