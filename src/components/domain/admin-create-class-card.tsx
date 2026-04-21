import { PlusCircle } from "lucide-react";

import { AdminClassRequestDialog } from "@/components/domain/admin-class-request-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AdminCreateClassCard() {
  return (
    <Card className="h-full border-primary/30 bg-white shadow-panel">
      <CardContent className="flex h-full min-h-64 flex-col items-start justify-between gap-6 p-6">
        <div className="space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PlusCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Create New Class</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Submit a new class for admin review. Approved classes become available to assigned teachers and students.
            </p>
          </div>
        </div>
        <AdminClassRequestDialog
          trigger={
            <Button type="button">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Class
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
