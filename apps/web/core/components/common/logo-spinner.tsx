import vegecoopIcon from "@/app/assets/images/vegecoop-icon.png?url";

export function LogoSpinner() {
  return (
    <div className="flex items-center justify-center">
      <img src={vegecoopIcon} alt="Loading" className="h-8 w-8 animate-pulse object-contain sm:h-14 sm:w-14" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
