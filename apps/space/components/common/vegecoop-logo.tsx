import vegecoopLogo from "@/app/assets/images/vegecoop-logo.png?url";

type Props = {
  height?: number;
  width?: number;
  className?: string;
};

export function VegecoopLogo({ height, width, className }: Props) {
  return (
    <img
      src={vegecoopLogo}
      alt="vegecoop"
      style={{ height: height ? `${height}px` : undefined, width: width ? `${width}px` : undefined }}
      className={className}
    />
  );
}
