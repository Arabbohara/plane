import vegecoopIcon from "@/app/assets/images/vegecoop-icon.png?url";

type Props = {
  className?: string;
};

export function VegecoopIcon({ className }: Props) {
  return <img src={vegecoopIcon} alt="vegecoop" className={className} />;
}
