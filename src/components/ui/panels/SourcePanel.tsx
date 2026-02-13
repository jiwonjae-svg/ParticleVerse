'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, Type, Box, Upload, X, Grid3X3 } from 'lucide-react';
import { useAppStore, ParticleSourceType } from '@/store/useAppStore';
import { sanitizeInput } from '@/utils/security';
import { t } from '@/locales';

const sourceOptions: { type: ParticleSourceType; labelKey: string; icon: React.ElementType; descKey: string }[] = [
  { type: 'default', labelKey: 'default', icon: Box, descKey: 'defaultDesc' },
  { type: 'image', labelKey: 'singleImage', icon: Image, descKey: 'imageDesc' },
  { type: 'cubemap', labelKey: 'cubemap', icon: Grid3X3, descKey: 'cubemapDesc' },
  { type: 'text', labelKey: 'text', icon: Type, descKey: 'textDesc' },
  { type: 'model', labelKey: 'model3d', icon: Box, descKey: 'modelDesc' },
];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_MODEL_TYPES = ['.glb', '.gltf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function SourcePanel() {
  const { 
    sourceType, 
    setSourceType, 
    setSourceData, 
    sourceData,
    setError 
  } = useAppStore();

  const [textInput, setTextInput] = useState('');
  const [cubemapImages, setCubemapImages] = useState<string[]>([]);

  // File validation
  const validateFile = useCallback((file: File, allowedTypes: string[]): boolean => {
    // File size validation
    if (file.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge'));
      return false;
    }

    // MIME type validation
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      return file.type === type;
    });

    if (!isValidType) {
      setError(t('unsupportedFileType'));
      return false;
    }

    return true;
  }, [setError]);

  // Image dropzone
  const onImageDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!validateFile(file, ALLOWED_IMAGE_TYPES)) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSourceData(result);
    };
    reader.onerror = () => {
      setError(t('fileReadError'));
    };
    reader.readAsDataURL(file);
  }, [setSourceData, setError, validateFile]);

  // Cubemap image drop
  const onCubemapDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const validFiles = acceptedFiles.filter(f => validateFile(f, ALLOWED_IMAGE_TYPES));
    
    const newImages: string[] = [...cubemapImages];
    let processed = 0;

    validFiles.forEach((file, index) => {
      if (newImages.length >= 6) return;

      const reader = new FileReader();
      reader.onload = () => {
        newImages.push(reader.result as string);
        processed++;

        if (processed === validFiles.length || newImages.length >= 6) {
          setCubemapImages(newImages.slice(0, 6));
          if (newImages.length >= 6) {
            setSourceData(newImages.slice(0, 6));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }, [cubemapImages, setSourceData, validateFile]);

  // Model dropzone
  const onModelDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!validateFile(file, ALLOWED_MODEL_TYPES)) return;

    const url = URL.createObjectURL(file);
    // Revoke previous blob URL to prevent memory leaks
    if (typeof sourceData === 'string' && sourceData.startsWith('blob:')) {
      URL.revokeObjectURL(sourceData);
    }
    setSourceData(url);
  }, [setSourceData, validateFile, sourceData]);

  const imageDropzone = useDropzone({
    onDrop: onImageDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  const cubemapDropzone = useDropzone({
    onDrop: onCubemapDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 6,
    maxSize: MAX_FILE_SIZE,
  });

  const modelDropzone = useDropzone({
    onDrop: onModelDrop,
    accept: { 'model/gltf-binary': ['.glb'], 'model/gltf+json': ['.gltf'] },
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
  });

  // Text submit
  const handleTextSubmit = useCallback(() => {
    const sanitized = sanitizeInput(textInput);
    if (sanitized.length > 0 && sanitized.length <= 50) {
      setSourceData(sanitized);
    } else if (sanitized.length > 50) {
      setError(t('textTooLong'));
    }
  }, [textInput, setSourceData, setError]);

  // Remove cubemap image
  const removeCubemapImage = useCallback((index: number) => {
    const newImages = cubemapImages.filter((_, i) => i !== index);
    setCubemapImages(newImages);
    if (newImages.length < 6) {
      setSourceData(null);
    }
  }, [cubemapImages, setSourceData]);

  // Change source type
  const handleTypeChange = useCallback((type: ParticleSourceType) => {
    setSourceType(type);
    setSourceData(null);
    setCubemapImages([]);
    setTextInput('');
  }, [setSourceType, setSourceData]);

  return (
    <div className="space-y-4">
      {/* Source type selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-dark-300">{t('sourceType')}</label>
        <div className="grid grid-cols-2 gap-2 px-1">
          {sourceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.type}
                onClick={() => handleTypeChange(option.type)}
                className={`card flex flex-col items-center gap-2 p-3 text-center ${
                  sourceType === option.type ? 'ring-2 ring-primary-500 bg-primary-500/10' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${sourceType === option.type ? 'text-primary-400' : 'text-dark-400'}`} />
                <span className="text-xs font-medium">{t(option.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Single image upload */}
      {sourceType === 'image' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-dark-300">{t('uploadImage')}</label>
          <div
            {...imageDropzone.getRootProps()}
            className={`dropzone ${imageDropzone.isDragActive ? 'active' : ''}`}
          >
            <input {...imageDropzone.getInputProps()} />
            {sourceData && typeof sourceData === 'string' ? (
              <div className="relative">
                <img src={sourceData} alt={t('uploadedImage')} className="max-h-32 mx-auto rounded-lg" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSourceData(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-dark-400" />
                <p className="text-sm text-dark-400">
                  {t('dragOrClick')}
                </p>
                <p className="text-xs text-dark-500 mt-1">
                  {t('fileFormats')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cubemap upload */}
      {sourceType === 'cubemap' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-dark-300">
            {t('cubemapImages')} ({cubemapImages.length}/6)
          </label>
          
          {/* Uploaded images grid */}
          {cubemapImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {cubemapImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={img} alt={`Cubemap ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeCubemapImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                  >
                    <X className="w-2 h-2" />
                  </button>
                  <span className="absolute bottom-1 left-1 text-xs bg-black/50 px-1 rounded">
                    {['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'][index]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Dropzone */}
          {cubemapImages.length < 6 && (
            <div
              {...cubemapDropzone.getRootProps()}
              className={`dropzone ${cubemapDropzone.isDragActive ? 'active' : ''}`}
            >
              <input {...cubemapDropzone.getInputProps()} />
              <div className="text-center">
                <Grid3X3 className="w-8 h-8 mx-auto mb-2 text-dark-400" />
                <p className="text-sm text-dark-400">
                  {t('moreImages').replace('{count}', String(6 - cubemapImages.length))}
                </p>
                <p className="text-xs text-dark-500 mt-1">
                  {t('cubemapOrder')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text input */}
      {sourceType === 'text' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-dark-300">{t('textInput')}</label>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            placeholder={t('textPlaceholder')}
            maxLength={50}
            className="input"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-dark-500">{textInput.length}/50</span>
            <button
              onClick={handleTextSubmit}
              disabled={textInput.length === 0}
              className="btn btn-primary text-sm"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      )}

      {/* 3D model upload */}
      {sourceType === 'model' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-dark-300">{t('upload3dModel')}</label>
          <div
            {...modelDropzone.getRootProps()}
            className={`dropzone ${modelDropzone.isDragActive ? 'active' : ''}`}
          >
            <input {...modelDropzone.getInputProps()} />
            {sourceData ? (
              <div className="text-center">
                <Box className="w-8 h-8 mx-auto mb-2 text-primary-400" />
                <p className="text-sm text-white">{t('modelLoaded')}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSourceData(null);
                  }}
                  className="mt-2 text-xs text-red-400 hover:text-red-300"
                >
                  {t('remove')}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <Box className="w-8 h-8 mx-auto mb-2 text-dark-400" />
                <p className="text-sm text-dark-400">
                  {t('dragGltf')}
                </p>
                <p className="text-xs text-dark-500 mt-1">
                  {t('maxFileSize')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
