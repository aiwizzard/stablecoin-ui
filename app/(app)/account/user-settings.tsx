"use client";
import UpdateNameCard from "./update-name-card";
import UpdateEmailCard from "./update-email-card";
import { AuthSession } from "@/lib/auth/utils";

export default function UserSettings({
  session,
}: {
  session: AuthSession["session"];
}) {
  return (
    <>
      <UpdateNameCard name={session?.user.name ?? ""} />
      <UpdateEmailCard email={session?.user.email ?? ""} />
    </>
  );
}
