"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import PropertyBasicsStep, { type PropertyBasicsData } from "./PropertyBasicsStep";
import PropertySummaryStep from "./PropertySummaryStep";

const WIZARD_STEPS = [
  { id: 1, title: "Property Basics", description: "Address and purchase details" },
  { id: 2, title: "Review & Save", description: "Complete property setup" },
];

interface PropertyData extends Partial<PropertyBasicsData> {
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

  const handleSaveProperty = async () => {
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Property saved successfully:", result);

        // Redirect to dashboard to see the saved property
        router.push("/dashboard");
      } else {
        const error = await response.json();
        console.error("Failed to save property:", error);
        // Throw error to be caught by PropertySummaryStep
        throw new Error(error.message || `Failed to save property (${response.status})`);
      }
    } catch (error) {
      console.error("Error saving property:", error);
      // Re-throw error so PropertySummaryStep can handle it
      throw error instanceof Error ? error : new Error("Network error occurred while saving property");
    }
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
      case 2:
        return (
          <PropertySummaryStep
            data={propertyData}
            onBack={prevStep}
            onSave={handleSaveProperty}
          />
        );
      default:
        return <div>Step {currentStep} not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🦉</span>
              <Home className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl font-bold text-orange-500">Add Property</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Step {currentStep} of {WIZARD_STEPS.length}
            </h2>
            <span className="text-sm font-semibold text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
              {Math.round((currentStep / WIZARD_STEPS.length) * 100)}% complete
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-orange-400 to-amber-400 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${(currentStep / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-6">
            {WIZARD_STEPS.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step.id <= currentStep
                      ? "bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md scale-105"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step.id}
                </div>
                <div className="text-center mt-3">
                  <div className={`text-xs font-medium ${step.id <= currentStep ? "text-orange-500" : "text-gray-600"}`}>
                    {step.title}
                  </div>
                  <div className={`text-xs hidden sm:block ${step.id <= currentStep ? "text-gray-600" : "text-gray-500"}`}>
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="border border-orange-200 shadow-lg bg-white">
          <CardHeader className="bg-orange-50 border-b border-orange-200">
            <CardTitle className="flex items-center gap-3">
              <span className="bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm">
                {currentStep}
              </span>
              <span className="text-xl font-bold text-gray-800">
                {WIZARD_STEPS[currentStep - 1]?.title}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">{renderCurrentStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-4">
            <Button variant="ghost" onClick={goToDashboard} className="text-gray-600 hover:bg-gray-100">
              Save & Exit
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}