import { motion } from "framer-motion";
import FileUploader from "@/components/organisms/FileUploader";

const Home = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
          <div className="text-center space-y-3">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              DropZone
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed"
            >
              Upload files with confidence. Drag, drop, and track your uploads with clear feedback at every step.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12">
        <FileUploader />
      </div>

      {/* Footer */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
          <div className="text-center text-sm text-secondary">
            <p>
              Built with React + Vite • Designed for simplicity and confidence
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;