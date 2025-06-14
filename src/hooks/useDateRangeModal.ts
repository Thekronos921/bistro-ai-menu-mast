
import { useState, useRef } from 'react';

export const useDateRangeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const triggerClick = () => {
    if (triggerRef.current) {
      triggerRef.current.click();
    }
  };

  return {
    isOpen,
    openModal,
    closeModal,
    triggerClick,
    triggerRef
  };
};
