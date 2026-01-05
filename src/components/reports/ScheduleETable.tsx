import { ScheduleEData } from "@/lib/schedule-e/types";
import { formatTaxAmount } from "@/lib/schedule-e/calculations";

interface ScheduleETableProps {
  data: ScheduleEData;
}

export function ScheduleETable({ data }: ScheduleETableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed Header - Always visible */}
      <div className="bg-gray-50 border-b-2 px-4 py-3 font-semibold text-sm">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1">Line</div>
          <div className="col-span-8">Description</div>
          <div className="col-span-3 text-right">Amount</div>
        </div>
      </div>

      {/* Scrollable Content Only */}
      <div className="max-h-80 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {/* Income */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-green-50">
            <div className="col-span-1 font-bold">3</div>
            <div className="col-span-8 font-medium">Rents received</div>
            <div className="col-span-3 text-right font-bold">
              {formatTaxAmount(data.income.rentalIncome)}
            </div>
          </div>

          {/* Expenses */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">5</div>
            <div className="col-span-8">Advertising</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.advertising)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">6</div>
            <div className="col-span-8">Auto and travel</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.autoAndTravel)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">7</div>
            <div className="col-span-8">Cleaning and maintenance</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.cleaningAndMaintenance)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">8</div>
            <div className="col-span-8">Commissions</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.commissions)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">9</div>
            <div className="col-span-8">Insurance</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.insurance)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">10</div>
            <div className="col-span-8">Legal and other professional fees</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.legal)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">11</div>
            <div className="col-span-8">Management fees</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.managementFees)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">12</div>
            <div className="col-span-8">Mortgage interest paid to banks, etc.</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.mortgageInterest)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">13</div>
            <div className="col-span-8">Other interest</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.otherInterest)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">14</div>
            <div className="col-span-8">Repairs</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.repairs)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">15</div>
            <div className="col-span-8">Supplies</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.supplies)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">16</div>
            <div className="col-span-8">Taxes</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.taxes)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">17</div>
            <div className="col-span-8">Utilities</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.utilities)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-blue-50">
            <div className="col-span-1 font-bold">18</div>
            <div className="col-span-8 font-medium">
              Depreciation expense
              {data.depreciation && (
                <div className="text-xs text-gray-600 mt-1">
                  Basis: {formatTaxAmount(data.depreciation.depreciableBasis)} |
                  Month: {data.depreciation.monthPlacedInService}
                </div>
              )}
            </div>
            <div className="col-span-3 text-right font-bold">
              {formatTaxAmount(data.expenses.depreciation)}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-4 py-3">
            <div className="col-span-1">19</div>
            <div className="col-span-8">Other</div>
            <div className="col-span-3 text-right">
              {formatTaxAmount(data.expenses.other)}
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-red-50 border-t-2">
            <div className="col-span-1 font-bold">20</div>
            <div className="col-span-8 font-medium">Total expenses</div>
            <div className="col-span-3 text-right font-bold">
              {formatTaxAmount(data.totals.totalExpenses)}
            </div>
          </div>

          <div className={`grid grid-cols-12 gap-4 px-4 py-3 border-t-2 ${data.totals.netIncome >= 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="col-span-1 font-bold">21</div>
            <div className="col-span-8 font-medium">
              Income or (loss) from rental real estate activities
            </div>
            <div className="col-span-3 text-right font-bold">
              {data.totals.netIncome < 0
                ? `(${formatTaxAmount(Math.abs(data.totals.netIncome))})`
                : formatTaxAmount(data.totals.netIncome)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}