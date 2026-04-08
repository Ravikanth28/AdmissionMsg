import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id
          const isLast = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : isActive
                      ? 'bg-brand-500/20 text-brand-400 ring-2 ring-brand-500 step-active'
                      : 'bg-dark-800 text-dark-500 border border-dark-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-center ${isActive ? 'text-brand-400' : isCompleted ? 'text-dark-300' : 'text-dark-500'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-dark-600 mt-0.5 hidden sm:block">{step.description}</p>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-3 h-0.5 mt-[-1.5rem]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-brand-500' : 'bg-dark-700'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
