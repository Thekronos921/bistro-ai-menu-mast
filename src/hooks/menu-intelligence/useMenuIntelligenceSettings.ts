
import { useState } from "react";

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

export const useMenuIntelligenceSettings = () => {
  // Settings configuration
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    const saved = localStorage.getItem('menuIntelligenceSettings');
    return saved ? JSON.parse(saved) : {
      criticalThreshold: 40,
      targetThreshold: 35,
      targetPercentage: 80
    };
  });

  const saveSettings = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    localStorage.setItem('menuIntelligenceSettings', JSON.stringify(newSettings));
  };

  return { settings, saveSettings };
};
