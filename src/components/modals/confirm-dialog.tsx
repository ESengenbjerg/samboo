import { buttonTextVariants, buttonVariants } from "@/components/ui/button";
import { Text, TextClassContext } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  cancelLabel: string;
  onCancel: () => void;
};

// Function to make buttonVariants accessible to AlertDialogAction
function AlertDialogAction({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  VariantProps<typeof buttonVariants>) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant })}>
      <AlertDialogPrimitive.Action
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}
// Function to make buttonVariants accessible to AlertDialogCancel
function AlertDialogCancel({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  VariantProps<typeof buttonVariants>) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant })}>
      <AlertDialogPrimitive.Action
        className={cn(buttonVariants({ variant }), className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}


export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onAction,
  cancelLabel,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row">

            <AlertDialogAction
              variant="destructive"
              onPress={onAction}
            >
              <Text>
                {actionLabel}
              </Text>
            </AlertDialogAction>
            <AlertDialogCancel
              variant="default"
              onPress={onCancel}
            >
              <Text>
                {cancelLabel}
              </Text>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
