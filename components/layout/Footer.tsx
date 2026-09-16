import { getCurrentAccessSession } from "@/app/lib/access";
import { HomeChrome } from "./HomeChrome";
import { LandingFooter } from "./LandingFooter";
import { AdminFooter } from "./AdminChrome";

export async function Footer() {
  const session = await getCurrentAccessSession();
  return (
    <HomeChrome
      home={<LandingFooter loggedIn={Boolean(session)} />}
      fallback={<AdminFooter />}
    />
  );
}
