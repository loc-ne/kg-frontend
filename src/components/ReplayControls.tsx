import React from 'react';

interface ReplayControlsProps {
  onStart?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onEnd?: () => void;
  disabledStart?: boolean;
  disabledPrevious?: boolean;
  disabledNext?: boolean;
  disabledEnd?: boolean;
}

const iconClass = "w-4 h-4";

const ReplayControls: React.FC<ReplayControlsProps> = ({
  onStart,
  onPrevious,
  onNext,
  onEnd,
  disabledStart,
  disabledPrevious,
  disabledNext,
  disabledEnd,
}) => (
  <div className="flex gap-3 justify-center items-center mt-2">
    <button
      onClick={onStart}
      disabled={disabledStart}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      aria-label="Về đầu"
    >
      <img src="/assets/start-icon.png" alt="Start" className={iconClass} />
    </button>
    <button
      onClick={onPrevious}
      disabled={disabledPrevious}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      aria-label="Lùi lại"
    >
      <img src="/assets/previous-icon.png" alt="Previous" className={iconClass} />
    </button>
    <button
      onClick={onNext}
      disabled={disabledNext}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      aria-label="Tiến tới"
    >
      <img src="/assets/next-icon.png" alt="Next" className={iconClass} />
    </button>
    <button
      onClick={onEnd}
      disabled={disabledEnd}
      className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
      aria-label="Về cuối"
    >
      <img src="/assets/end-icon.png" alt="End" className={iconClass} />
    </button>
  </div>
);

export default ReplayControls;