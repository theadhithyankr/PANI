import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import Button from './Button';

const FileUpload = ({
  label,
  accept,
  multiple = false,
  onFileSelect,
  disabled = false,
  progress = 0,
  maxSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return false;
    }
    return true;
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setError(null);

    if (multiple) {
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    } else {
      const file = files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    }

    // Reset the input
    event.target.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    if (multiple) {
      const validFiles = files.filter(validateFile);
      if (validFiles.length > 0) {
        onFileSelect(validFiles);
      }
    } else {
      const file = files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!disabled ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-2">
          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            {accept ? `Accepted formats: ${accept}` : 'All file types accepted'}
          </p>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
