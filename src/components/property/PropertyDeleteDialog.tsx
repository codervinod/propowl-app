"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Home, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Property {
  id: string;
  street: string;
  streetLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
}

interface PropertyDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess: () => void;
}

export default function PropertyDeleteDialog({
  isOpen,
  onClose,
  property,
  onSuccess,
}: PropertyDeleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [step, setStep] = useState<"warning" | "confirmation">("warning");

  const formatAddress = () => {
    return `${property.street}${property.streetLine2 ? `, ${property.streetLine2}` : ''}, ${property.city}, ${property.state} ${property.zipCode}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      single_family: "Single Family Home",
      condo: "Condominium",
      townhouse: "Townhouse",
      multi_family: "Multi-Family (2-4 units)",
      apartment: "Apartment Building (5+ units)",
    };
    return types[type] || type;
  };

  const handleNextStep = () => {
    setStep("confirmation");
  };

  const handleDelete = async () => {
    if (confirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/properties/${property.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        await response.json();
        toast.success("Property and all related data deleted successfully");
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete property");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setStep("warning");
      setConfirmationText("");
      onClose();
    }
  };

  const handleBack = () => {
    setStep("warning");
    setConfirmationText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>
              {step === "warning" ? "Delete Property?" : "Confirm Deletion"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === "warning" ? (
              <>
                You are about to permanently delete this property:
                <strong className="block mt-2 text-gray-900">
                  {getPropertyTypeLabel(property.propertyType)}
                </strong>
                <strong className="block text-gray-900">
                  {formatAddress()}
                </strong>
              </>
            ) : (
              "This action cannot be undone. Please type DELETE to confirm."
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "warning" && (
          <div className="space-y-4">
            {/* Warning about what will be deleted */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-3">
                This will permanently delete:
              </h4>
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Property information and details</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>All income and expense records</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Tax year data for all years</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Generated Schedule E reports</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>Warning:</strong> This action cannot be undone. Consider backing up your data before proceeding.
              </p>
            </div>
          </div>
        )}

        {step === "confirmation" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                <strong>Final confirmation required.</strong> Type <strong>DELETE</strong> in the box below to permanently delete this property and all its associated data.
              </p>
              <Label htmlFor="confirmation" className="text-sm font-medium text-red-900">
                Type DELETE to confirm:
              </Label>
              <Input
                id="confirmation"
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="mt-2 border-red-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "warning" ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isSubmitting || confirmationText !== "DELETE"}
                className="flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Property
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}