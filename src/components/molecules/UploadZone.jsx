import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import { cn } from "@/utils/cn";

const UploadZone = ({ 
  onFilesAdded, 
  accept = "*", 
  multiple = true, 
  maxFiles = 10,
  disabled = false,
  className 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragCounter(0);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const limitedFiles = files.slice(0, maxFiles);
      onFilesAdded?.(limitedFiles);
    }
  };

  const handleFileInputChange = (e) => {
    if (disabled) return;
    
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const limitedFiles = files.slice(0, maxFiles);
      onFilesAdded?.(limitedFiles);
    }
    
    // Reset input value to allow selecting same files again
    e.target.value = "";
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "relative border-3 border-dashed border-gray-300 rounded-2xl transition-all duration-300 cursor-pointer",
        isDragging && !disabled && "drag-over",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && !isDragging && "hover:border-primary hover:bg-primary/5 hover:scale-[1.01]",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="p-8 lg:p-12 text-center space-y-6">
        <AnimatePresence mode="wait">
          {isDragging ? (
            <motion.div
              key="dragging"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
                <ApperIcon name="Download" className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-primary">Drop files here</h3>
                <p className="text-secondary mt-1">Release to upload your files</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "space-y-6",
                !disabled && "upload-pulse"
              )}
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-sm">
                <ApperIcon name="Upload" className="w-10 h-10 text-secondary" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  Drag & drop files here
                </h3>
                <p className="text-secondary max-w-sm mx-auto leading-relaxed">
                  or click to browse and select files from your device
                </p>
              </div>

              <Button 
                variant="primary" 
                size="lg"
                disabled={disabled}
                onClick={(e) => e.stopPropagation()}
              >
                <ApperIcon name="FolderOpen" className="w-5 h-5 mr-2" />
                Choose Files
              </Button>

              <div className="text-xs text-secondary space-y-1">
                <p>Maximum {maxFiles} files</p>
                <p>Supported formats: All file types</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadZone;