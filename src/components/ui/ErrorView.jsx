import { useState } from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const ErrorView = ({ 
  error = "Something went wrong", 
  onRetry,
  title = "Upload Error"
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-error to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <ApperIcon name="AlertCircle" className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-secondary leading-relaxed">{error}</p>
          </div>
        </div>

        {onRetry && (
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full"
            >
              {isRetrying ? (
                <>
                  <ApperIcon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                  Retrying...
                </>
              ) : (
                <>
                  <ApperIcon name="RefreshCw" className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
            
            <p className="text-xs text-secondary">
              Check your connection and try again
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorView;