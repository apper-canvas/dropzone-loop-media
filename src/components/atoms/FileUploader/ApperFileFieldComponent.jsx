import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";

/**
 * ApperFileFieldComponent - A React component that interfaces with ApperSDK for file upload functionality
 * 
 * This component provides database-integrated file upload capabilities with proper lifecycle management,
 * format conversion, and memory leak prevention.
 * 
 * @param {Object} props - Component props
 * @param {string} props.elementId - Unique identifier for this uploader instance (pattern: ${baseName}-${recordId})
 * @param {Object} props.config - Configuration object containing:
 *   @param {string} config.fieldKey - Unique field identifier
 *   @param {string} config.fieldName - Field name with type file
 *   @param {string} config.tableName - Table name with type file
 *   @param {string} config.apperProjectId - Apper project ID (from environment)
 *   @param {string} config.apperPublicKey - Apper public key (from environment)
 *   @param {Array} config.existingFiles - Previously uploaded files to display
 *   @param {number} config.fileCount - Number of existing files
 * @param {string} props.className - CSS class for styling
 * @param {Object} props.style - Inline styles object
 * 
 * @example
 * <ApperFileFieldComponent
 *   elementId="contact-files-123"
 *   config={{
 *     fieldKey: 'contact-attachments-field',
 *     fieldName: 'attachments',
 *     tableName: 'contacts',
 *     apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
 *     apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
 *     existingFiles: [],
 *     fileCount: 0
 *   }}
 *   className="custom-uploader-styles"
 * />
 */
const ApperFileFieldComponent = ({
  elementId,
  config,
  className = '',
  style = {},
  ...props
}) => {
  // State management for UI-driven values
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState(null);
  const [sdkAttempts, setSdkAttempts] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Refs for tracking lifecycle and preventing memory leaks
  const elementIdRef = useRef(null);
  const existingFilesRef = useRef(null);
  const mountedRef = useRef(false);
  const cleanupRef = useRef(null);
  const sdkCheckIntervalRef = useRef(null);

  // Validation and error handling
  if (!elementId) {
    throw new Error('ApperFileFieldComponent: elementId is required');
  }

  if (!config || typeof config !== 'object') {
    throw new Error('ApperFileFieldComponent: config object is required');
  }

  const {
    fieldKey,
    fieldName,
    tableName,
    apperProjectId,
    apperPublicKey,
    existingFiles = [],
    fileCount = 0
  } = config;

  // Validate required config properties
  if (!fieldKey) {
    throw new Error('ApperFileFieldComponent: config.fieldKey is required');
  }

  if (!fieldName) {
    throw new Error('ApperFileFieldComponent: config.fieldName is required');
  }

  if (!tableName) {
    throw new Error('ApperFileFieldComponent: config.tableName is required');
  }

  if (!apperProjectId) {
    console.warn('ApperFileFieldComponent: config.apperProjectId is missing - file operations may fail');
  }

  if (!apperPublicKey) {
    console.warn('ApperFileFieldComponent: config.apperPublicKey is missing - file operations may fail');
  }

  // Memoize existingFiles to prevent unnecessary re-renders
  // Only change when length changes or first file's ID changes (indicates different files)
  const memoizedExistingFiles = useMemo(() => {
    if (!existingFiles || !Array.isArray(existingFiles)) {
      return [];
    }

    if (existingFiles.length === 0) {
      return [];
    }

    return existingFiles;
  }, [
    existingFiles?.length,
    existingFiles?.[0]?.Id || existingFiles?.[0]?.id
  ]);

  // Update elementId ref when it changes
  useEffect(() => {
    elementIdRef.current = `file-uploader-${elementId}`;
  }, [elementId]);

  // Update existingFiles ref when memoized files change
  useEffect(() => {
    existingFilesRef.current = memoizedExistingFiles;
  }, [memoizedExistingFiles]);

  // SDK availability check with timeout logic
  useEffect(() => {
    let isCancelled = false;
    
    const checkSDKAvailability = () => {
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // Maximum 50 attempts
        const attemptInterval = 100; // Check every 100ms initially, then increase

        const checkInterval = setInterval(() => {
          if (isCancelled) {
            clearInterval(checkInterval);
            reject(new Error('SDK check cancelled'));
            return;
          }

          attempts++;
          setSdkAttempts(attempts);

          try {
            // Check if ApperSDK is available
            if (window.ApperSDK && window.ApperSDK.ApperFileUploader) {
              clearInterval(checkInterval);
              resolve(true);
              return;
            }

            // If we've reached max attempts, fail
            if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              reject(new Error(`ApperSDK not loaded after ${maxAttempts} attempts (${(maxAttempts * attemptInterval) / 1000}s)`));
              return;
            }
          } catch (error) {
            console.warn(`ApperFileFieldComponent: SDK check attempt ${attempts} failed:`, error);
          }
        }, Math.min(attemptInterval * Math.ceil(attempts / 10), 5000)); // Increase interval over time, max 5s

        sdkCheckIntervalRef.current = checkInterval;
      });
    };

    const initializeSDK = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        await checkSDKAvailability();
        
        if (!isCancelled) {
          setIsReady(true);
          setError(null);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('ApperFileFieldComponent: Failed to initialize SDK:', error);
          setError(error.message);
          setIsReady(false);
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false);
        }
      }
    };

    initializeSDK();

    return () => {
      isCancelled = true;
      if (sdkCheckIntervalRef.current) {
        clearInterval(sdkCheckIntervalRef.current);
      }
    };
  }, []);

  // Mount/unmount file field based on SDK availability and elementId changes
  useEffect(() => {
    if (!isReady || !elementIdRef.current) {
      return;
    }

    let isCancelled = false;

    const mountFileField = async () => {
      try {
        // Check if File Field is present before mounting
        const { ApperFileUploader } = window.ApperSDK;
        
        if (!ApperFileUploader || !ApperFileUploader.FileField) {
          throw new Error('ApperFileUploader.FileField not available in SDK');
        }

        const mountConfig = {
          ...config,
          existingFiles: memoizedExistingFiles
        };

        await ApperFileUploader.FileField.mount(elementIdRef.current, mountConfig);
        
        if (!isCancelled) {
          setIsMounted(true);
          setError(null);
          mountedRef.current = true;
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('ApperFileFieldComponent: Failed to mount file field:', error);
          setError(`Mount failed: ${error.message}`);
          setIsMounted(false);
          mountedRef.current = false;
        }
      }
    };

    mountFileField();

    // Store cleanup function for unmounting
    cleanupRef.current = async () => {
      if (mountedRef.current && window.ApperSDK?.ApperFileUploader?.FileField) {
        try {
          await window.ApperSDK.ApperFileUploader.FileField.unmount(elementIdRef.current);
        } catch (error) {
          console.warn('ApperFileFieldComponent: Error during unmount:', error);
        }
      }
      mountedRef.current = false;
      setIsMounted(false);
    };

    return () => {
      isCancelled = true;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [isReady, elementId, memoizedExistingFiles]);

  // Handle existingFiles changes and format conversion
  useEffect(() => {
    if (!isReady || !isMounted || !config.fieldKey) {
      return;
    }

    const updateFiles = async () => {
      try {
        const { ApperFileUploader } = window.ApperSDK;
        
        if (!ApperFileUploader || !ApperFileUploader.FileField) {
          return;
        }

        // Clear files if existingFiles is empty
        if (!memoizedExistingFiles || memoizedExistingFiles.length === 0) {
          await ApperFileUploader.FileField.clearField(config.fieldKey);
          return;
        }

        // Check if files need API to UI format conversion
        const firstFile = memoizedExistingFiles[0];
        let filesToUpdate = memoizedExistingFiles;

        // Convert from API format to UI format if needed
        if (firstFile && (firstFile.Id !== undefined || firstFile.Name !== undefined)) {
          // This looks like API format: { Id, Name, Size, Type, Url }
          // Convert to UI format: { id, name, size, type, url }
          filesToUpdate = ApperFileUploader.toUIFormat(memoizedExistingFiles);
        }

        await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate);
      } catch (error) {
        console.error('ApperFileFieldComponent: Failed to update files:', error);
        setError(`File update failed: ${error.message}`);
      }
    };

    updateFiles();
  }, [memoizedExistingFiles, isReady, isMounted, config.fieldKey]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      
      // Clear refs
      elementIdRef.current = null;
      existingFilesRef.current = null;
      mountedRef.current = false;
      
      // Clear any remaining intervals
      if (sdkCheckIntervalRef.current) {
        clearInterval(sdkCheckIntervalRef.current);
      }
    };
  }, []);

  // Render loading state during initialization
  if (isInitializing) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center p-6 border border-gray-200 rounded-lg bg-gray-50',
          className
        )}
        style={style}
        {...props}
      >
        <div className="flex items-center space-x-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-600">
            Initializing file uploader... ({sdkAttempts}/50)
          </span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50',
          className
        )}
        style={style}
        {...props}
      >
        <div className="text-red-600 text-sm font-medium mb-2">
          File Uploader Error
        </div>
        <div className="text-red-500 text-xs text-center mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Render main file uploader component
  return (
    <div 
      id={elementIdRef.current}
      className={cn(
        'apper-file-field-component min-h-[120px]',
        !isMounted && 'opacity-50',
        className
      )}
      style={style}
      data-field-key={config.fieldKey}
      data-element-id={elementId}
      {...props}
    >
      {!isMounted && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-gray-600">Mounting file field...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Static methods for external use
ApperFileFieldComponent.formatConversion = {
  /**
   * Convert files from API format to UI format
   * @param {Array} apiFiles - Files in API format { Id, Name, Size, Type, Url }
   * @returns {Array} Files in UI format { id, name, size, type, url }
   */
  toUI: (apiFiles) => {
    if (!window.ApperSDK?.ApperFileUploader?.toUIFormat) {
      console.warn('ApperFileFieldComponent: SDK not available for format conversion');
      return apiFiles || [];
    }
    return window.ApperSDK.ApperFileUploader.toUIFormat(apiFiles);
  },

  /**
   * Check if files are in API format
   * @param {Array} files - Files to check
   * @returns {boolean} True if files appear to be in API format
   */
  isAPIFormat: (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return false;
    }
    const firstFile = files[0];
    return firstFile && (firstFile.Id !== undefined || firstFile.Name !== undefined);
  },

  /**
   * Check if files are in UI format
   * @param {Array} files - Files to check
   * @returns {boolean} True if files appear to be in UI format
   */
  isUIFormat: (files) => {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return false;
    }
    const firstFile = files[0];
    return firstFile && (firstFile.id !== undefined || firstFile.name !== undefined);
  }
};

// Development helpers
if (import.meta.env.DEV) {
  ApperFileFieldComponent.displayName = 'ApperFileFieldComponent';
  
  // Add debugging helpers
  ApperFileFieldComponent.debug = {
    checkSDK: () => {
      console.log('ApperSDK availability:', {
        available: !!window.ApperSDK,
        fileUploader: !!window.ApperSDK?.ApperFileUploader,
        fileField: !!window.ApperSDK?.ApperFileUploader?.FileField,
        methods: window.ApperSDK?.ApperFileUploader ? Object.keys(window.ApperSDK.ApperFileUploader) : []
      });
    },
    
    getInstanceInfo: (elementId) => {
      const element = document.getElementById(`file-uploader-${elementId}`);
      return {
        element,
        mounted: !!element,
        fieldKey: element?.getAttribute('data-field-key'),
        elementId: element?.getAttribute('data-element-id')
      };
    }
  };
}

export default ApperFileFieldComponent;