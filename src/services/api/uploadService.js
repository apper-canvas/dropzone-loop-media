import configData from "@/services/mockData/uploadConfig.json";

class UploadService {
  constructor() {
    this.config = { ...configData };
    this.loadConfig();
  }

  loadConfig() {
    const savedConfig = localStorage.getItem("dropzone-config");
    if (savedConfig) {
      this.config = { ...this.config, ...JSON.parse(savedConfig) };
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("dropzone-config", JSON.stringify(this.config));
  }

  getConfig() {
    return { ...this.config };
  }

  async simulateUpload(file, onProgress) {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const totalSize = file.size;
      const chunkSize = Math.max(totalSize / 100, 1024); // At least 1KB chunks
      let uploaded = 0;
      const startTime = Date.now();

      const interval = setInterval(() => {
        const increment = Math.random() * chunkSize * 2; // Variable speed
        uploaded += increment;
        progress = Math.min((uploaded / totalSize) * 100, 100);
        
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = uploaded / elapsed;
        const remaining = (totalSize - uploaded) / speed;

        onProgress({
          progress: Math.round(progress),
          speed: Math.round(speed),
          remaining: remaining || 0
        });

        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate occasional failures for demonstration
          if (Math.random() < 0.1) {
            reject(new Error("Network error occurred"));
          } else {
            resolve({
              id: Date.now().toString(36) + Math.random().toString(36).substr(2),
              url: URL.createObjectURL(file),
              uploadedAt: Date.now()
            });
          }
        }
      }, 100 + Math.random() * 200); // Variable interval for more realistic feel
    });
  }

  async uploadFile(uploadFile, onProgress) {
    try {
      const result = await this.simulateUpload(uploadFile.file, onProgress);
      return {
        ...uploadFile,
        status: "complete",
        uploadedAt: result.uploadedAt,
        progress: 100
      };
    } catch (error) {
      return {
        ...uploadFile,
        status: "failed",
        error: error.message,
        progress: 0
      };
    }
  }

  getUploadHistory() {
    const history = sessionStorage.getItem("dropzone-history");
    return history ? JSON.parse(history) : [];
  }

  saveToHistory(uploadFile) {
    const history = this.getUploadHistory();
    history.unshift({
      ...uploadFile,
      file: undefined // Don't store file object in history
    });
    
    // Keep only last 50 uploads
    const trimmedHistory = history.slice(0, 50);
    sessionStorage.setItem("dropzone-history", JSON.stringify(trimmedHistory));
  }

  clearHistory() {
    sessionStorage.removeItem("dropzone-history");
  }
}

export default new UploadService();