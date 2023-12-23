import React, { useState, useEffect } from 'react';
import './Alert.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';

type AlertProps = {
  id: number;
  message: string;
  dismissible: boolean;
  type: 'success' | 'error' | 'warning';
  onDismiss: (id: number) => void;
};

const Alert: React.FC<AlertProps> = ({ id, message, dismissible, type, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!dismissible) {
      const timer = setTimeout(() => {setIsExiting(true); setTimeout(() => onDismiss(id), 300);}, 10000);
      return () => clearTimeout(timer);
    }
  }, [id, dismissible, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div className={`${!isExiting ? 'alert-enter' : 'alert-exit'} flex items-center border px-4 py-2 my-2 rounded shadow-lg ${
      type === 'success' ? 'bg-green-100 border-green-400 text-green-600' : 
      type === 'error' ? 'bg-red-100 border-red-400 text-red-600' : 
      'bg-yellow-100 border-yellow-400 text-yellow-600'
      }`}>
      <FontAwesomeIcon className={`${type === 'success' ? 'text-green-500' : 
      type === 'error' ? 'text-red-500' : 
      'text-yellow-500'} mr-2`}
      aria-hidden="true"
      icon={type === 'success' ? faCircleCheck : 
      type === 'error' ? faCircleExclamation : 
      faTriangleExclamation} />
      {message}
      {dismissible && <button onClick={handleDismiss} className="ml-2 bg-transparent border-none cursor-pointer">
        <FontAwesomeIcon icon={faXmark} />
      </button>}
    </div>
  );
};

export default Alert;
