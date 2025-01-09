import { SidebarLink } from "@/components/SidebarItems";
import { User, Home } from "lucide-react";

type AdditionalLinks = {
  title: string;
  links: SidebarLink[];
};

export const defaultLinks: SidebarLink[] = [
  { href: "/dashboard", title: "Dashboard", icon: Home },
  { href: "/account", title: "Account", icon: User },
  { href: "/wallet", title: "Wallet", icon: User },
];

export const additionalLinks: AdditionalLinks[] = [];
