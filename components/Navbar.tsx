"use client";

import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  
  const getTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard";
      case "/account":
        return "Account";
      default:
        return "";
    }
  };

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">{getTitle()}</span>
        </div>
      </div>
    </nav>
  );
}
