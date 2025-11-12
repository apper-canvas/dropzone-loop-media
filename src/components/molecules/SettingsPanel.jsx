import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { formatFileSize } from "@/utils/file";
import { cn } from "@/utils/cn";

const SettingsPanel = ({ 
  config, 
  onConfigChange, 
  className 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);

  const fileSizeOptions = [
    { value: 1048576, label: "1 MB" },
    { value: 5242880, label: "5 MB" },
    { value: 10485760, label: "10 MB" },
    { value: 52428800, label: "50 MB" },
    { value: 104857600, label: "100 MB" }
  ];

  const commonFileTypes = [
    { value: "image/", label: "Images" },
    { value: "video/", label: "Videos" },
    { value: "audio/", label: "Audio" },
    { value: ".pdf", label: "PDF" },
    { value: "text/", label: "Text Files" },
    { value: ".zip,.rar,.7z", label: "Archives" }
  ];

const handleSave = () => {
    onConfigChange?.(localConfig);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalConfig(config);
  };

  const toggleFileType = (type) => {
    const types = localConfig.allowedTypes.includes(type)
      ? localConfig.allowedTypes.filter(t => t !== type)
      : [...localConfig.allowedTypes, type];
    
    setLocalConfig(prev => ({ ...prev, allowedTypes: types }));
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <ApperIcon name="X" className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Max File Size */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Maximum File Size
                    </label>
                    <select
                      value={localConfig.maxFileSize}
                      onChange={(e) => setLocalConfig(prev => ({ 
                        ...prev, 
                        maxFileSize: parseInt(e.target.value) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      {fileSizeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Max Files */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Maximum Files
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={localConfig.maxFiles}
                      onChange={(e) => setLocalConfig(prev => ({ 
                        ...prev, 
                        maxFiles: parseInt(e.target.value) || 1 
                      }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {/* Allowed File Types */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Allowed File Types
                    </label>
                    <div className="space-y-2">
                      {commonFileTypes.map(type => (
                        <label key={type.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={localConfig.allowedTypes.includes(type.value)}
                            onChange={() => toggleFileType(type.value)}
                            className="rounded border-gray-300 text-primary focus:ring-primary/50"
                          />
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
                    {localConfig.allowedTypes.length === 0 && (
                      <p className="text-xs text-info bg-info/10 px-2 py-1 rounded border border-info/20">
                        All file types allowed
                      </p>
                    )}
                  </div>

                  {/* Auto Upload */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Auto Upload
                    </label>
                    <button
                      type="button"
                      onClick={() => setLocalConfig(prev => ({ 
                        ...prev, 
                        autoUpload: !prev.autoUpload 
                      }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50",
                        localConfig.autoUpload ? "bg-primary" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          localConfig.autoUpload ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="ghost" size="sm" onClick={handleReset} className="flex-1">
                    Reset
                  </Button>
                  <Button onClick={handleSave} size="sm" className="flex-1">
                    Save Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl"
      >
        <ApperIcon name="Settings" className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default SettingsPanel;