import Link from "next/link";
import { LifeBuoy, UserRound } from "lucide-react";

import { AdminSignOutButton } from "@/components/domain/admin-sign-out-button";
import { Button } from "@/components/ui/button";

export function AdminActionBar() {
  return (
    <div className="border-b border-border bg-white">
      <div className="container-shell flex min-h-14 flex-wrap items-center justify-end gap-3 py-3">
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <UserRound className="mr-2 h-4 w-4" />
            Switch to student page
          </Link>
        </Button>
        <Button asChild variant="outline">
          <a href="mailto:admin@example.com">
            <LifeBuoy className="mr-2 h-4 w-4" />
            Contact admin
          </a>
        </Button>
        <AdminSignOutButton />
      </div>
    </div>
  );
}
