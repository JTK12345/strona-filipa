import { getCurrentAccessSession } from "@/app/lib/access";
import { HomeChrome } from "./HomeChrome";
import { LandingHeader } from "./LandingHeader";
import { AdminHeader } from "./AdminChrome";
import { landingFonts } from "@/components/sections/landing-fonts";

export async function Navbar() {
  const session = await getCurrentAccessSession();
  return (
    <HomeChrome
      home={
        <LandingHeader
          loggedIn={Boolean(session)}
          isAdmin={session?.role === "admin"}
          fontClass={landingFonts}
        />
      }
      fallback={<AdminHeader />}
    />
  );
}
