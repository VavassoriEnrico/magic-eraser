import { useColorModeValue } from "@chakra-ui/react";

import defaultBackgroundDarkImage from "../../assets/background2.jpg";
import defaultBackgroundLightImage from "../../assets/background2_light.jpg";
import Navbar from "./Navbar";
import Footbar from "./Footbar";
import type { AppLayoutProps } from "../../types/ui";

export default function AppLayout({
  children,
  currentPath,
  onNavigate,
  backgroundImageUrl,
}: AppLayoutProps) {
  const defaultResolvedBackgroundImageUrl = useColorModeValue(
    defaultBackgroundLightImage,
    defaultBackgroundDarkImage
  );
  const themedBackgroundSource =
    typeof backgroundImageUrl === "string"
      ? {
          light: defaultBackgroundLightImage,
          dark: defaultBackgroundDarkImage,
        }
      : backgroundImageUrl ?? {
          light: defaultBackgroundLightImage,
          dark: defaultBackgroundDarkImage,
        };
  const themedBackgroundImageUrl = useColorModeValue(
    themedBackgroundSource.light,
    themedBackgroundSource.dark
  );

  const resolvedBackgroundImageUrl =
    typeof backgroundImageUrl === "string"
      ? backgroundImageUrl
      : backgroundImageUrl
        ? themedBackgroundImageUrl
        : defaultResolvedBackgroundImageUrl;

  const overlayGradient = useColorModeValue(
    "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(244, 247, 250, 0.7) 100%)",
    "linear-gradient(180deg, rgba(7, 11, 18, 0.58) 0%, rgba(7, 11, 18, 0.8) 100%)"
  );

  return (
    <div
      className="app-shell"
      style={
        resolvedBackgroundImageUrl
          ? {
              backgroundImage: `${overlayGradient}, url(${resolvedBackgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundAttachment: "fixed",
            }
          : undefined
      }
    >
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />
      <main className="app-shell__content">{children}</main>
      <Footbar />
    </div>
  );
}
