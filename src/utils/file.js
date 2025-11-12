export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const formatUploadSpeed = (bytesPerSecond) => {
  return formatFileSize(bytesPerSecond) + "/s";
};

export const formatTimeRemaining = (seconds) => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${remainingMinutes}m`;
  }
};

export const isImageFile = (file) => {
  return file.type.startsWith("image/");
};

export const generateThumbnail = (file) => {
  return new Promise((resolve) => {
    if (!isImageFile(file)) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const maxSize = 100;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export const getFileIcon = (file) => {
  const type = file.type;
  
  if (type.startsWith("image/")) return "Image";
  if (type.startsWith("video/")) return "Video";
  if (type.startsWith("audio/")) return "Music";
  if (type.includes("pdf")) return "FileText";
  if (type.includes("word") || type.includes("document")) return "FileText";
  if (type.includes("excel") || type.includes("spreadsheet")) return "Table";
  if (type.includes("powerpoint") || type.includes("presentation")) return "Presentation";
  if (type.includes("zip") || type.includes("rar") || type.includes("7z")) return "Archive";
  if (type.includes("text")) return "FileText";
  
  return "File";
};

export const validateFile = (file, config) => {
  const errors = [];
  
  if (file.size > config.maxFileSize) {
    errors.push(`File size exceeds ${formatFileSize(config.maxFileSize)} limit`);
  }
  
  if (config.allowedTypes.length > 0) {
    const isAllowed = config.allowedTypes.some(type => {
      if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      return file.type.includes(type);
    });
    
    if (!isAllowed) {
      errors.push("File type not allowed");
    }
  }
  
  return errors;
};

export const generateFileId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};