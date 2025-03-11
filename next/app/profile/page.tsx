import { redirect } from "next/navigation";
import { withAuth, signOut } from "@workos-inc/authkit-nextjs";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { user } = await withAuth();

  if (!user) {
    redirect("/");
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button variant="outline" type="submit">
        Sign out
      </Button>
    </form>
  );
}
