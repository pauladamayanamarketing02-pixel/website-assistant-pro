import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type ContentItemDetails = {
  id: string;
  businessName: string;
  categoryName: string;
  contentTypeName: string;
  title: string;
  createdAt: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItemDetails | null;
};

export default function ViewContentItemDialog({ open, onOpenChange, item }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border border-border">
        <DialogHeader>
          <DialogTitle>Content Details</DialogTitle>
          <DialogDescription>Review the content item details.</DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="font-medium text-foreground">{item.title}</div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Business</div>
                <div className="text-foreground">{item.businessName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Category</div>
                <div className="text-foreground">{item.categoryName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Content Type</div>
                <div className="text-foreground">{item.contentTypeName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-foreground">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-sm text-muted-foreground">No item selected.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
