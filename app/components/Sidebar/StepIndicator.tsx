export const StepIndicator = ({ currentStep, totalSteps, stepNames }: { currentStep: number, totalSteps: number, stepNames: string[] }) => {
    const StepConnector = ({ isCompleted, isFirst, isLast }: { isCompleted: boolean, isFirst?: boolean, isLast?: boolean }) => (
      <div className={`w-1 flex-grow transition-height duration-200 ease-in-out ${isCompleted ? 'bg-blue-500' : 'bg-gray-300'} ${isFirst ? 'mt-3' : ''} ${isLast ? 'mb-3' : ''}`}></div>
    );
  
    return (
      <div className="py-5 w-fit h-full flex flex-col justify-center items-center text-gray-50 transition-all duration-200 ease-in-out">
        {stepNames.map((stepName, index) => {
          const isCompleted = index + 1 < currentStep;
          const isCurrent = index + 1 === currentStep;
          const isFirst = index === 0;
          const isLast = index === totalSteps - 1;
  
          return (
            <>
              <StepConnector isCompleted={isCompleted || isCurrent} isFirst={isFirst} />
              <div className="flex flex-col items-center transition-all duration-200 ease-in-out">
                <div className={`-rotate-90 relative w-fit h-fit rounded-lg ${isCompleted || isCurrent ? 'bg-white border-blue-500' : 'bg-white border-gray-300'} border-2 p-1 shadow transition-colors duration-200 ease-in-out`}>
                  <div className={`w-fit mx-1 mb-1 whitespace-nowrap font-medium ${isCompleted || isCurrent ? 'text-blue-500' : 'text-gray-400'}`}>
                    {stepName.toUpperCase()}
                  </div>
                </div>
              </div>
              {isLast && <StepConnector isCompleted={isCompleted} isLast={isLast} />}
            </>
          );
        })}
      </div>
    );
};