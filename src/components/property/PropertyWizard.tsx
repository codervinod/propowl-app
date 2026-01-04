"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import PropertyBasicsStep from "./PropertyBasicsStep";

const WIZARD_STEPS = [
  { id: 1, title: "Property Basics", description: "Address and purchase details" },
  { id: 2, title: "Mortgage", description: "Loan information" },
  { id: 3, title: "Property Taxes", description: "Annual tax amount" },
  { id: 4, title: "Insurance", description: "Coverage details" },
  { id: 5, title: "Rental Income", description: "Income tracking method" },
  { id: 6, title: "Expenses", description: "Additional costs" },
  { id: 7, title: "Review", description: "Confirm and save" },
];

interface PropertyData {
  [key: string]: unknown;
}

export default function PropertyWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyData, setPropertyData] = useState<PropertyData>({});
  const router = useRouter();

  const updatePropertyData = (stepData: PropertyData) => {
    setPropertyData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyBasicsStep
            data={propertyData}
            onUpdate={updatePropertyData}
            onNext={nextStep}
          />
        );
      // TODO: Add other steps
      default:
        return <div>Step {currentStep} - Coming Soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToDashboard}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold text-gray-900">Add Property</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Step {currentStep} of {WIZARD_STEPS.length}
            </h2>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / WIZARD_STEPS.length) * 100)}% complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-4">
            {WIZARD_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step.id}
                </div>
                <div className="text-center mt-2">
                  <div className="text-xs font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                {currentStep}
              </span>
              {WIZARD_STEPS[currentStep - 1]?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderCurrentStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={goToDashboard}>
              Save & Exit
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}