import ApperIcon from "@/components/ApperIcon";

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <ApperIcon 
            name="Upload" 
            className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">Loading DropZone</h3>
          <p className="text-sm text-secondary">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;