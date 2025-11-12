import { getApperClient } from "@/services/apperClient";
import { toast } from "react-toastify";

class UploadService {
  constructor() {
    this.tableName = 'upload_file_c';
    this.defaultConfig = {
      maxFileSize: 10485760,
      allowedTypes: [],
      maxFiles: 10,
      autoUpload: true
    };
    this.config = { ...this.defaultConfig };
    this.loadConfig();
  }

  async loadConfig() {
    try {
      // Try to load config from database first
      const apperClient = getApperClient();
      if (apperClient) {
        // For now, use local storage until we have a settings table
        const savedConfig = localStorage.getItem("dropzone-config");
        if (savedConfig) {
          this.config = { ...this.defaultConfig, ...JSON.parse(savedConfig) };
        }
      }
    } catch (error) {
      console.error("Failed to load config from database:", error);
      // Fallback to localStorage
      const savedConfig = localStorage.getItem("dropzone-config");
      if (savedConfig) {
        this.config = { ...this.defaultConfig, ...JSON.parse(savedConfig) };
      }
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem("dropzone-config", JSON.stringify(this.config));
    // TODO: Save to database settings table when available
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
              file_id_c: Date.now().toString(36) + Math.random().toString(36).substr(2),
              url: URL.createObjectURL(file),
              uploaded_at_c: new Date().toISOString()
            });
          }
        }
      }, 100 + Math.random() * 200); // Variable interval for more realistic feel
    });
  }

  async uploadFile(uploadFile, onProgress) {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        throw new Error("ApperClient not available");
      }

      const result = await this.simulateUpload(uploadFile.file, onProgress);
      
      // Create database record
      const dbRecord = {
        file_id_c: result.file_id_c,
        name_c: uploadFile.name,
        size_c: uploadFile.size,
        type_c: uploadFile.type,
        status_c: "complete",
        progress_c: 100,
        upload_speed_c: 0,
        uploaded_at_c: result.uploaded_at_c,
        error_c: null
      };

      const response = await apperClient.createRecord(this.tableName, {
        records: [dbRecord]
      });

      if (!response.success) {
        console.error(`Failed to save upload record: ${response.message}`);
        throw new Error(response.message);
      }

      const savedRecord = response.results?.[0];
      if (!savedRecord?.success) {
        const errorMsg = savedRecord?.message || "Failed to save upload record";
        console.error(`Failed to save upload record: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      return {
        ...uploadFile,
        Id: savedRecord.data.Id,
        file_id_c: result.file_id_c,
        status: "complete",
        uploaded_at_c: result.uploaded_at_c,
        progress: 100
      };

    } catch (error) {
      console.error("Upload failed:", error);
      
      // Save failed record to database
      try {
        const apperClient = getApperClient();
        if (apperClient) {
          const failedRecord = {
            file_id_c: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name_c: uploadFile.name,
            size_c: uploadFile.size,
            type_c: uploadFile.type,
            status_c: "failed",
            progress_c: 0,
            upload_speed_c: 0,
            uploaded_at_c: null,
            error_c: error.message
          };

          await apperClient.createRecord(this.tableName, {
            records: [failedRecord]
          });
        }
      } catch (dbError) {
        console.error("Failed to save error record:", dbError);
      }

      return {
        ...uploadFile,
        status: "failed",
        error: error.message,
        progress: 0
      };
    }
  }

  async getUploadHistory() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        console.error("ApperClient not available");
        return [];
      }

      const response = await apperClient.fetchRecords(this.tableName, {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "file_id_c"}},
          {"field": {"Name": "name_c"}},
          {"field": {"Name": "size_c"}},
          {"field": {"Name": "type_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "progress_c"}},
          {"field": {"Name": "upload_speed_c"}},
          {"field": {"Name": "uploaded_at_c"}},
          {"field": {"Name": "error_c"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}],
        pagingInfo: {"limit": 50, "offset": 0}
      });

      if (!response.success) {
        console.error("Failed to fetch upload history:", response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching upload history:", error);
      return [];
    }
  }

  async saveToHistory(uploadFile) {
    // Already saved to database in uploadFile method
    // This method is kept for API compatibility
  }

  async clearHistory() {
    try {
      const apperClient = getApperClient();
      if (!apperClient) {
        console.error("ApperClient not available");
        return;
      }

      const historyResponse = await apperClient.fetchRecords(this.tableName, {
        fields: [{"field": {"Name": "Id"}}],
        pagingInfo: {"limit": 1000, "offset": 0}
      });

      if (!historyResponse.success || !historyResponse.data?.length) {
        return;
      }

      const recordIds = historyResponse.data.map(record => record.Id);
      
      const deleteResponse = await apperClient.deleteRecord(this.tableName, {
        RecordIds: recordIds
      });

      if (!deleteResponse.success) {
        console.error("Failed to clear history:", deleteResponse.message);
        toast.error("Failed to clear upload history");
      } else {
        toast.success("Upload history cleared successfully");
      }

    } catch (error) {
      console.error("Error clearing upload history:", error);
      toast.error("Failed to clear upload history");
    }
  }
}

export default new UploadService();