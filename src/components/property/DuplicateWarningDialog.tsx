"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, Home, ArrowRight } from "lucide-react";

interface DuplicateProperty {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PotentialShare {
  ownerEmail: string;
  ownerName: string;
  propertyId: string;
  address: string;
  suggestion: string;
}

interface DuplicateWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
  hasDuplicate: boolean;
  duplicateProperty?: DuplicateProperty | null;
  potentialShares: PotentialShare[];
  address: string;
}

export function DuplicateWarningDialog({
  isOpen,
  onClose,
  onProceedAnyway,
  hasDuplicate,
  duplicateProperty,
  potentialShares,
  address,
}: DuplicateWarningDialogProps) {
  const hasAnyIssues = hasDuplicate || potentialShares.length > 0;

  if (!hasAnyIssues) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Duplicate Property Detected</DialogTitle>
          </div>
          <DialogDescription>
            We found potential issues with this property address:
            <strong className="block mt-1">{address}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User's Own Duplicate */}
          {hasDuplicate && duplicateProperty && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900 mb-1">
                    You Already Own This Property
                  </h4>
                  <p className="text-sm text-red-700">
                    You already have this property in your portfolio. Adding it again would create a duplicate.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                    onClick={() => {
                      // TODO: Navigate to existing property
                      window.location.href = `/properties/${duplicateProperty.id}`;
                    }}
                  >
                    View Existing Property <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Potential Sharing Opportunities */}
          {potentialShares.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Property Already Managed by Others
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {potentialShares.length === 1
                      ? "Another user is already managing this property:"
                      : `${potentialShares.length} other users are managing this property:`
                    }
                  </p>

                  <div className="space-y-2">
                    {potentialShares.map((share, index) => (
                      <div key={index} className="bg-white rounded border border-blue-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900">{share.ownerName}</p>
                            <p className="text-xs text-blue-600">{share.ownerEmail}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            onClick={() => {
                              // TODO: Implement request access functionality
                              alert("Request access functionality coming soon!");
                            }}
                          >
                            Request Access
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning for proceeding anyway */}
          {!hasDuplicate && potentialShares.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> If you proceed, you&apos;ll create a separate copy of this property.
                Consider requesting access instead to collaborate with existing users.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {hasDuplicate ? (
            <Button
              variant="outline"
              onClick={() => window.location.href = `/properties/${duplicateProperty?.id}`}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              View Existing Property
            </Button>
          ) : (
            <Button
              onClick={onProceedAnyway}
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
            >
              Add Property Anyway
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}