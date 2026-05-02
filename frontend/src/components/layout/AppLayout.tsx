import { useColorModeValue } from "@chakra-ui/react";

import defaultBackgroundDarkImage from "../../assets/background2.jpg";
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
    undefined,
    defaultBackgroundDarkImage
  );
  const themedBackgroundSource =
    typeof backgroundImageUrl === "string"
      ? {
          light: "",
          dark: defaultBackgroundDarkImage,
        }
      : backgroundImageUrl ?? {
          light: "",
          dark: defaultBackgroundDarkImage,
        };
  const themedBackgroundImageUrl = useColorModeValue(
    undefined,
    themedBackgroundSource.dark
  );

  const resolvedBackgroundImageUrl =
    typeof backgroundImageUrl === "string"
      ? backgroundImageUrl
      : backgroundImageUrl
        ? themedBackgroundImageUrl
        : defaultResolvedBackgroundImageUrl;

  const overlayGradient = useColorModeValue(
    undefined,
    "linear-gradient(180deg, rgba(4, 8, 15, 0.9) 0%, rgba(4, 8, 15, 0.96) 100%)"
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
      <div className="app-shell__workspace">
        <Navbar currentPath={currentPath} onNavigate={onNavigate} />
        <main className={`app-shell__content${currentPath === "/" ? " app-shell__content--home" : ""}`}>
          {children}
        </main>
        <Footbar />
      </div>
    </div>
  );
}
