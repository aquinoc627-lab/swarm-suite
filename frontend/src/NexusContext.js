import React, { createContext, useContext, useState, useEffect } from "react";

const NexusContext = createContext(null);

export function NexusProvider({ children }) {
  const [zenithMode, setZenithMode] = useState(false);
  const [omnibarOpen, setOmnibarOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle Omnibar with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOmnibarOpen((prev) => !prev);
      }
      
      // Escape closes the Omnibar or exits Zenith mode
      if (e.key === "Escape") {
        if (omnibarOpen) {
          setOmnibarOpen(false);
        } else if (zenithMode) {
          setZenithMode(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [omnibarOpen, zenithMode]);

  return (
    <NexusContext.Provider
      value={{
        zenithMode,
        setZenithMode,
        omnibarOpen,
        setOmnibarOpen,
      }}
    >
      {children}
    </NexusContext.Provider>
  );
}

export function useNexus() {
  return useContext(NexusContext);
}
