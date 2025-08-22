'use client'

interface StatusTimelineProps {
  currentStatus: string
  steps: {
    key: string
    label: string
    description: string
    icon: string
  }[]
}

export default function StatusTimeline({ currentStatus, steps }: StatusTimelineProps) {
  const getStatusIndex = (status: string) => {
    return steps.findIndex(step => step.key === status)
  }

  const currentIndex = getStatusIndex(currentStatus)

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex
          const isPending = index > currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${
                  index < currentIndex ? 'bg-green-500' : 'bg-slate-200'
                }`} 
                style={{ 
                  left: '50%',
                  right: '0',
                  width: 'calc(100% - 24px)',
                  marginLeft: '12px'
                }}
                />
              )}
              
              {/* Status circle */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-3 relative z-10
                ${isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-slate-200 text-slate-400'
                }
              `}>
                {isCompleted && index < currentIndex ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{step.icon}</span>
                )}
              </div>
              
              {/* Status label */}
              <div className="text-center">
                <h4 className={`text-sm font-semibold mb-1 ${
                  isCompleted || isCurrent ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {step.label}
                </h4>
                <p className={`text-xs ${
                  isCompleted || isCurrent ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}