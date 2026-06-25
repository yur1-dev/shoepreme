import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();
  const idToken = (session as any)?.shopifyIdToken;
  const domain = process.env.SHOPIFY_CUSTOMER_ACCOUNT_DOMAIN;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Sign out of Next.js session first
  await signOut({ redirect: false });

  if (idToken && domain) {
    const logoutUrl = new URL(`https://${domain}/logout`);
    logoutUrl.searchParams.set("id_token_hint", idToken);
    logoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      `${baseUrl}/account/login`,
    );
    redirect(logoutUrl.toString());
  }

  redirect("/account/login");
}
