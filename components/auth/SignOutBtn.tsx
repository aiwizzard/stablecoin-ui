"use client";

import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { signOutAction } from "@/lib/actions/users";

const handleSignOut = async () => {
  await signOutAction();
};

export default function SignOutBtn() {
  return (
    <form action={handleSignOut} className="w-full text-left">
      <Btn />
    </form>
  );
}

const Btn = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={"destructive"}>
      Sign{pending ? "ing" : ""} out
    </Button>
  );
};
