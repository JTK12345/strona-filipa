import Script from "next/script";
import { headers } from "next/headers";

export async function TurnstileScript() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
