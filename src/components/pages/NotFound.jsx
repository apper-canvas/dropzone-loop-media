import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-md mx-auto"
      >
        {/* 404 Icon */}
        <div className="space-y-4">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-2xl">
            <ApperIcon name="FileX" className="w-16 h-16 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-2xl font-bold text-gray-900">
              Page Not Found
            </h2>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <p className="text-secondary leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Use the button below to return to the file uploader
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Button 
            onClick={handleGoHome}
            size="lg"
            className="w-full"
          >
            <ApperIcon name="Upload" className="w-5 h-5 mr-2" />
            Go to DropZone
          </Button>
          
          <div className="flex justify-center space-x-4 text-sm">
            <button
              onClick={() => window.history.back()}
              className="text-secondary hover:text-primary transition-colors duration-200"
            >
              ← Go Back
            </button>
            <span className="text-gray-300">|</span>
            <a
              href="/"
              className="text-secondary hover:text-primary transition-colors duration-200"
            >
              Home
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;