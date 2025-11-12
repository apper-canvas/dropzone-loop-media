import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import ProgressBar from "@/components/atoms/ProgressBar";
import { formatFileSize, formatUploadSpeed, formatTimeRemaining, getFileIcon } from "@/utils/file";

const FileCard = ({ 
  uploadFile, 
  onRemove, 
  onRetry,
  showRemove = true 
}) => {
  const { file, name, size, status, progress, uploadSpeed, thumbnail, error } = uploadFile;
  
  const getStatusBadge = () => {
    const configs = {
      queued: { variant: "default", icon: "Clock", text: "Queued" },
      uploading: { variant: "info", icon: "Upload", text: "Uploading" },
      complete: { variant: "success", icon: "CheckCircle", text: "Complete" },
      failed: { variant: "error", icon: "AlertCircle", text: "Failed" },
      paused: { variant: "warning", icon: "Pause", text: "Paused" }
    };
    
    const config = configs[status];
    return (
      <Badge variant={config.variant} size="sm">
        <ApperIcon 
          name={config.icon} 
          className={`w-3 h-3 mr-1 ${status === "uploading" ? "animate-pulse" : ""} ${status === "complete" ? "success-checkmark" : ""}`} 
        />
        {config.text}
      </Badge>
    );
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.(uploadFile.id);
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    onRetry?.(uploadFile.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="file-card bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
    >
      <div className="flex items-start space-x-3">
        {/* Thumbnail or Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-surface to-gray-100 flex items-center justify-center overflow-hidden">
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <ApperIcon 
              name={getFileIcon(file)} 
              className="w-6 h-6 text-secondary"
            />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {name}
              </h4>
              <p className="text-xs text-secondary">
                {formatFileSize(size)}
                {uploadSpeed > 0 && status === "uploading" && (
                  <span className="mx-1">•</span>
                )}
                {uploadSpeed > 0 && status === "uploading" && (
                  <span>{formatUploadSpeed(uploadSpeed)}</span>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-2 ml-2">
              {getStatusBadge()}
              {showRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="p-1 h-auto min-h-0 text-gray-400 hover:text-error"
                  disabled={status === "uploading"}
                >
                  <ApperIcon name="X" className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {(status === "uploading" || (status === "complete" && progress === 100)) && (
            <div className="space-y-1">
              <ProgressBar 
                value={progress}
                variant={status === "complete" ? "success" : "default"}
                animated={status === "uploading"}
                size="sm"
              />
              {status === "uploading" && uploadSpeed > 0 && (
                <div className="flex justify-between text-xs text-secondary">
                  <span>{progress}% complete</span>
                  <span>
                    {formatTimeRemaining((size - (size * progress / 100)) / uploadSpeed)} remaining
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {status === "failed" && error && (
            <div className="space-y-2">
              <p className="text-xs text-error bg-error/5 px-2 py-1 rounded border border-error/20">
                {error}
              </p>
              {onRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  <ApperIcon name="RefreshCw" className="w-3 h-3 mr-1" />
                  Retry Upload
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FileCard;