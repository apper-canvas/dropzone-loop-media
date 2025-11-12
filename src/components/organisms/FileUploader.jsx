import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import UploadZone from "@/components/molecules/UploadZone";
import FileCard from "@/components/molecules/FileCard";
import SettingsPanel from "@/components/molecules/SettingsPanel";
import Empty from "@/components/ui/Empty";
import uploadService from "@/services/api/uploadService";
import { generateFileId, validateFile, generateThumbnail } from "@/utils/file";

const FileUploader = () => {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [config, setConfig] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        await uploadService.loadConfig();
        const uploadConfig = uploadService.getConfig();
        setConfig(uploadConfig);
} catch (error) {
        console.error("Failed to load config:", error);
        toast.error("Failed to load upload settings");
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
    loadUploadHistory();
  }, []);

  const loadUploadHistory = async () => {
    try {
      const history = await uploadService.getUploadHistory();
      const historyFiles = history.map(record => ({
        id: record.Id,
        file_id_c: record.file_id_c,
        name: record.name_c,
        size: record.size_c,
        type: record.type_c,
        status: record.status_c === 'complete' ? 'complete' : record.status_c === 'failed' ? 'failed' : 'queued',
        progress: record.progress_c || 0,
        uploadSpeed: record.upload_speed_c || 0,
        thumbnail: null, // thumbnails not stored in database
        error: record.error_c,
        uploadedAt: record.uploaded_at_c,
        // Keep database record reference
        dbRecord: record
      }));
      setUploadFiles(historyFiles);
    } catch (error) {
      console.error("Failed to load upload history:", error);
    }
  };

  const addFiles = useCallback(async (files) => {
    if (!config) return;

    const newUploadFiles = [];

    for (const file of files) {
      // Validate file
      const errors = validateFile(file, config);
      if (errors.length > 0) {
        toast.error(`${file.name}: ${errors.join(", ")}`);
        continue;
      }

      // Check if file already exists
      const existingFile = uploadFiles.find(uf => 
        uf.name === file.name && uf.size === file.size
      );
      if (existingFile) {
        toast.warning(`${file.name} is already in the queue`);
        continue;
      }

      // Generate thumbnail for images
      const thumbnail = await generateThumbnail(file);
const uploadFile = {
        id: generateFileId(),
        file,
        file_id_c: null, // Will be set during upload
        name: file.name,
        size: file.size,
        type: file.type,
        status: "queued",
        progress: 0,
        uploadSpeed: 0,
        thumbnail,
        error: null,
        uploadedAt: null
      };

      newUploadFiles.push(uploadFile);
    }

    if (newUploadFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newUploadFiles]);
      toast.success(`Added ${newUploadFiles.length} file${newUploadFiles.length > 1 ? "s" : ""} to queue`);

      // Auto upload if enabled
      if (config.autoUpload) {
        setTimeout(() => startUpload([...uploadFiles, ...newUploadFiles]), 100);
      }
    }
  }, [config, uploadFiles]);

  const startUpload = useCallback(async (filesToUpload = null) => {
    const files = filesToUpload || uploadFiles.filter(f => f.status === "queued" || f.status === "failed");
    if (files.length === 0) return;

    setIsUploading(true);

    for (const uploadFile of files) {
      if (uploadFile.status !== "queued" && uploadFile.status !== "failed") continue;

      // Update status to uploading
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: "uploading", progress: 0, error: null }
          : f
      ));

      try {
        const result = await uploadService.uploadFile(uploadFile, (progressData) => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { 
                  ...f, 
                  progress: progressData.progress, 
                  uploadSpeed: progressData.speed 
                }
              : f
          ));
        });

        // Update final status
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? result : f
));

        // Database save is handled in uploadService.uploadFile
        if (result.status === "complete") {
          toast.success(`${result.name} uploaded successfully`);
        } else {
          toast.error(`${result.name} upload failed: ${result.error}`);
        }
      } catch (error) {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: "failed", error: error.message }
            : f
        ));
        toast.error(`${uploadFile.name} upload failed: ${error.message}`);
      }
    }

    setIsUploading(false);
  }, [uploadFiles]);

  const removeFile = useCallback((fileId) => {
    const file = uploadFiles.find(f => f.id === fileId);
    if (!file) return;

    if (file.status === "uploading") {
      toast.warning("Cannot remove file while uploading");
      return;
    }

    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
    toast.info(`${file.name} removed from queue`);
  }, [uploadFiles]);

  const retryUpload = useCallback(async (fileId) => {
    const file = uploadFiles.find(f => f.id === fileId);
    if (!file) return;

    await startUpload([file]);
  }, [uploadFiles, startUpload]);

  const handleConfigChange = useCallback((newConfig) => {
    uploadService.saveConfig(newConfig);
    setConfig(newConfig);
toast.success("Settings updated successfully");
  }, []);

  const clearCompleted = useCallback(async () => {
    const completedFiles = uploadFiles.filter(f => f.status === "complete");
    if (completedFiles.length === 0) {
      toast.info("No completed uploads to clear");
      return;
    }

    try {
      await uploadService.clearHistory();
      await loadUploadHistory(); // Reload from database
    } catch (error) {
      console.error("Failed to clear completed uploads:", error);
      toast.error("Failed to clear completed uploads");
    }
  }, [uploadFiles]);
if (!config || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading DropZone...</p>
        </div>
      </div>
    );
  }

  const queuedFiles = uploadFiles.filter(f => f.status === "queued");
  const uploadingFiles = uploadFiles.filter(f => f.status === "uploading");
  const completedFiles = uploadFiles.filter(f => f.status === "complete");
  const failedFiles = uploadFiles.filter(f => f.status === "failed");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload Zone */}
      <UploadZone
        onFilesAdded={addFiles}
        maxFiles={config.maxFiles}
        disabled={isUploading}
        className="mx-4 lg:mx-0"
      />

      {/* Stats Bar */}
      {uploadFiles.length > 0 && (
        <div className="mx-4 lg:mx-0 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{uploadFiles.length}</p>
              <p className="text-xs text-secondary">Total Files</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-warning">{queuedFiles.length}</p>
              <p className="text-xs text-secondary">Queued</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-success">{completedFiles.length}</p>
              <p className="text-xs text-secondary">Complete</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-error">{failedFiles.length}</p>
              <p className="text-xs text-secondary">Failed</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Actions */}
      {(queuedFiles.length > 0 || failedFiles.length > 0) && !config.autoUpload && (
        <div className="mx-4 lg:mx-0 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => startUpload()}
            disabled={isUploading}
            className="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"
                />
                Uploading...
              </>
            ) : (
              `Upload ${queuedFiles.length + failedFiles.length} Files`
            )}
          </button>
          
          {completedFiles.length > 0 && (
            <button
              onClick={clearCompleted}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
            >
              Clear Completed
            </button>
          )}
        </div>
      )}

      {/* File List */}
      {uploadFiles.length > 0 ? (
        <div className="mx-4 lg:mx-0 space-y-4">
          <AnimatePresence mode="popLayout">
            {uploadFiles.map((uploadFile) => (
              <FileCard
                key={uploadFile.id}
                uploadFile={uploadFile}
                onRemove={removeFile}
                onRetry={retryUpload}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty
          icon="Upload"
          title="No files uploaded yet"
          description="Drag and drop files here or click the upload button to get started"
        />
      )}

      {/* Settings Panel */}
      <SettingsPanel
        config={config}
        onConfigChange={handleConfigChange}
      />
    </div>
  );
};

export default FileUploader;