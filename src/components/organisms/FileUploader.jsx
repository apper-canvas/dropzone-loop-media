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

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const uploadConfig = uploadService.getConfig();
        setConfig(uploadConfig);
      } catch (error) {
        console.error("Failed to load config:", error);
        toast.error("Failed to load upload settings");
      }
    };

    loadConfig();
  }, []);

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

        // Save to history
        uploadService.saveToHistory(result);

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

  const clearCompleted = useCallback(() => {
    const completedCount = uploadFiles.filter(f => f.status === "complete").length;
    if (completedCount === 0) {
      toast.info("No completed uploads to clear");
      return;
    }

    setUploadFiles(prev => prev.filter(f => f.status !== "complete"));
    toast.success(`Cleared ${completedCount} completed upload${completedCount > 1 ? "s" : ""}`);
  }, [uploadFiles]);

  if (!config) {
    return null;
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