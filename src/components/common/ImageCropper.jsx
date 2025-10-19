import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, X as CloseIcon, Download, RefreshCw, Move } from 'lucide-react';
import Button from './Button';

const ImageCropper = ({ 
  imageFile, 
  onCropComplete, 
  onCancel, 
  aspectRatio = null, // Allow free-form cropping by default
  minWidth = 50,
  minHeight = 50,
  maxWidth = 2000,
  maxHeight = 2000
}) => {
  const [crop, setCrop] = useState({
    unit: 'px',
    width: 200,
    height: 200,
    x: 0,
    y: 0
  });
  const [imageSrc, setImageSrc] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [cropMode, setCropMode] = useState('free'); // 'free', 'square', 'custom'
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setImageLoaded(false);
        setCompletedCrop(null);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoad = useCallback((e) => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    
    setImageDimensions({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);
    
    // Calculate optimal initial crop size and position
    const containerWidth = containerRef.current?.clientWidth || 400;
    const containerHeight = 400;
    
    // Calculate scale to fit image in container
    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    // Calculate initial crop size (centered, reasonable size)
    const cropSize = Math.min(300, Math.min(naturalWidth, naturalHeight) * scale);
    
    // Center the crop area
    const x = (containerWidth - cropSize) / 2;
    const y = (containerHeight - cropSize) / 2;
    
    setCrop({
      unit: 'px',
      width: cropSize,
      height: cropSize,
      x: Math.max(0, x),
      y: Math.max(0, y)
    });
    
    setScale(scale);
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current || !completedCrop || !imageLoaded) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const image = imgRef.current;
    const { width: cropWidth, height: cropHeight, x: cropX, y: cropY } = completedCrop;

    // Validate crop values
    if (!cropWidth || !cropHeight || cropWidth <= 0 || cropHeight <= 0) {
      console.error('Invalid crop dimensions:', { cropWidth, cropHeight });
      return null;
    }

    // Convert display coordinates to natural image coordinates
    const displayScale = scale;
    const naturalCropX = cropX / displayScale;
    const naturalCropY = cropY / displayScale;
    const naturalCropWidth = cropWidth / displayScale;
    const naturalCropHeight = cropHeight / displayScale;

    // Set canvas size to the desired output size
    canvas.width = naturalCropWidth;
    canvas.height = naturalCropHeight;

    // Apply rotation transformation
    if (rotation !== 0) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw the cropped image
    ctx.drawImage(
      image,
      naturalCropX,
      naturalCropY,
      naturalCropWidth,
      naturalCropHeight,
      0,
      0,
      naturalCropWidth,
      naturalCropHeight
    );

    if (rotation !== 0) {
      ctx.restore();
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now(),
          });
          resolve(croppedFile);
        } else {
          resolve(null);
        }
      }, imageFile.type, 0.95);
    });
  }, [completedCrop, rotation, scale, imageFile, imageLoaded]);

  const handleCropComplete = async () => {
    try {
      const croppedFile = await getCroppedImg();
      if (croppedFile) {
        onCropComplete(croppedFile);
      } else {
        console.error('Failed to create cropped image');
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  const handleRotate = (direction) => {
    setRotation(prev => {
      const newRotation = prev + (direction === 'right' ? 90 : -90);
      return newRotation % 360;
    });
  };

  const handleZoom = (direction) => {
    setScale(prev => {
      const newScale = direction === 'in' ? prev * 1.2 : prev * 0.8;
      return Math.max(0.3, Math.min(3, newScale));
    });
  };

  const resetCrop = () => {
    if (imageLoaded && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = 400;
      
      const scaleX = containerWidth / imageDimensions.width;
      const scaleY = containerHeight / imageDimensions.height;
      const scale = Math.min(scaleX, scaleY, 1);
      
      const cropSize = Math.min(300, Math.min(imageDimensions.width, imageDimensions.height) * scale);
      const x = (containerWidth - cropSize) / 2;
      const y = (containerHeight - cropSize) / 2;
      
      setCrop({
        unit: 'px',
        width: cropSize,
        height: cropSize,
        x: Math.max(0, x),
        y: Math.max(0, y)
      });
      
      setScale(scale);
      setRotation(0);
      setCropMode('free');
    }
  };

  const changeCropMode = (mode) => {
    setCropMode(mode);
    if (mode === 'square') {
      // Force square aspect ratio
      const currentCrop = crop;
      const size = Math.min(currentCrop.width, currentCrop.height);
      setCrop({
        ...currentCrop,
        width: size,
        height: size
      });
    } else if (mode === 'free') {
      // Remove aspect ratio constraint
      setCrop(crop);
    }
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Crop Profile Photo</h3>
            <p className="text-sm text-gray-600 mt-1">Drag to adjust crop area, resize corners, or use controls below</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Image Cropper */}
        <div className="p-6">
          <div 
            ref={containerRef}
            className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden flex justify-center items-center border-2 border-dashed border-gray-300"
            style={{ minHeight: '500px', maxHeight: '600px' }}
          >
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={cropMode === 'square' ? 1 : cropMode === 'custom' ? aspectRatio : undefined}
                minWidth={minWidth}
                minHeight={minHeight}
                maxWidth={maxWidth}
                maxHeight={maxHeight}
                className="max-h-full object-contain"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                  margin: '0 auto'
                }}
                ruleOfThirds
                showGrid
                keepSelection
                disabled={false}
                locked={false}
                cropSize={{ width: 200, height: 200 }}
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${scale})`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onLoad={onImageLoad}
                  className="select-none"
                  draggable={false}
                />
              </ReactCrop>
            )}
            
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading image...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {/* Crop Mode Selection */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 text-sm mb-3">Crop Mode</h4>
            <div className="flex items-center space-x-3">
              <Button
                variant={cropMode === 'free' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => changeCropMode('free')}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <Move className="w-4 h-4" />
                <span>Free Form</span>
              </Button>
              <Button
                variant={cropMode === 'square' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => changeCropMode('square')}
                className="flex items-center space-x-2 px-4 py-2"
              >
                <span>Square</span>
              </Button>
              {aspectRatio && (
                <Button
                  variant={cropMode === 'custom' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => changeCropMode('custom')}
                  className="flex items-center space-x-2 px-4 py-2"
                >
                  <span>Custom Ratio</span>
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Rotation Controls */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Rotation</h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate('left')}
                  className="flex items-center space-x-2 px-4 py-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Left</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRotate('right')}
                  className="flex items-center space-x-2 px-4 py-2"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Right</span>
                </Button>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Zoom</h4>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('out')}
                  className="flex items-center space-x-2 px-4 py-2"
                >
                  <ZoomOut className="w-4 h-4" />
                  <span>Out</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoom('in')}
                  className="flex items-center space-x-2 px-4 py-2"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span>In</span>
                </Button>
              </div>
            </div>

            {/* Reset Control */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-sm">Reset</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCrop}
                className="flex items-center space-x-2 px-4 py-2 w-full"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All</span>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {completedCrop && (
                <span>Selected area: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}px</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCropComplete}
                className="flex items-center space-x-2 px-6 py-2"
                disabled={!completedCrop}
              >
                <Check className="w-5 h-5" />
                <span>Apply Crop</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 