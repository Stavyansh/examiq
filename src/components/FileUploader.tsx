"use client";

import { useState } from "react";
import Button from "./Button";
import { processMultipleFiles } from "@/lib/services/uploadService";
import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE, FILE_TYPE_DESCRIPTIONS } from "@/lib/services/uploadService";

interface FileUploaderProps {
  onUploadComplete?: (materialIds: string[]) => void;
  examId?: string;
  moduleId?: string;
  multiple?: boolean;
}

export default function FileUploader({
  onUploadComplete,
  examId,
  moduleId,
  multiple = false
}: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileList, setFileList] = useState<File[]>([]);
  const [uploadResults, setUploadResults] = useState<{
    successful: Array<{ materialId: string; fileName: string }>;
    failed: Array<{ fileName: string; error: string }>;
  } | null>(null);

  // Mock IDs - in real implementation, these would come from auth/session
  const MOCK_USER_ID = "user-123";
  const MOCK_EXAM_ID = examId || "exam-123";
  const MOCK_MODULE_ID = moduleId || "module-123";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Validate files first
    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of files) {
      // Check file type
      if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}": Unsupported file type`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        validationErrors.push(`"${file.name}": Exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB size limit`);
        continue;
      }

      validFiles.push(file);
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' | '));
      setTimeout(() => setError(null), 5000);
      return;
    }

    // If not multiple and we have more than one file, take only the first
    const filesToUpload = !multiple && validFiles.length > 1 ? [validFiles[0]] : validFiles;

    // Update file list for preview
    setFileList(filesToUpload);
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);
    setUploadResults(null);

    try {
      // Process files with progress tracking
      const results = await processMultipleFiles(
        MOCK_USER_ID,
        MOCK_EXAM_ID,
        filesToUpload,
        (progress) => {
          // Update progress based on completed files
          const percent = Math.round((progress.completed / progress.total) * 100);
          setUploadProgress(percent);
        }
      );

      // Store results
      setUploadResults({
        successful: results.successful.map(({ material, file }) => ({
          materialId: material.id as string,
          fileName: file.name
        })),
        failed: results.failed.map(({ error, file }) => ({
          fileName: file.name,
          error
        }))
      });

      // Set success/error messages
      if (results.successful.length > 0 && results.failed.length === 0) {
        setSuccess(`${results.successful.length} file${results.successful.length > 1 ? 's' : ''} uploaded successfully!`);
      } else if (results.failed.length > 0 && results.successful.length === 0) {
        setError(`${results.failed.length} file${results.failed.length > 1 ? 's' : ''} failed to upload`);
      } else {
        setSuccess(`${results.successful.length} file${results.successful.length > 1 ? 's' : ''} uploaded successfully`);
        setError(`${results.failed.length} file${results.failed.length > 1 ? 's' : ''} failed to upload`);
      }

      // Call completion callback
      if (onUploadComplete && uploadResults && uploadResults.successful.length > 0) {
        const materialIds = uploadResults.successful.map(item => item.materialId);
        onUploadComplete(materialIds);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload process failed");
    } finally {
      setIsUploading(false);
      // Reset after a delay to show results
      setTimeout(() => {
        setUploadProgress(0);
        setFileList([]);
      }, 3000);
    }

    // Clear input
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setFileList(prev => {
      const newList = [...prev];
      newList.splice(index, 1);
      return newList;
    });
  };

  const handleClearAll = () => {
    setFileList([]);
    setUploadResults(null);
    setError(null);
    setSuccess(null);
  };

  // Determine accepted types display text
  const acceptedTypesText = multiple
    ? 'PDF, Images (JPG/PNG/GIF/WebP/SVG), Text (TXT/MD/CSV/JSON), Office Documents'
    : 'PDF, JPG, PNG, GIF, WebP, TXT, MD';

  return (
    <div className="space-y-4">
      {/* File List Preview */}
      {fileList.length > 0 && !isUploading && (
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold">Selected Files ({fileList.length})</h3>
            {!multiple && fileList.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear
              </Button>
            )}
            {multiple && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {fileList.map((file, index) => (
              <div key={index} className="flex items-center justify-between px-3 py-2 border-b border-border/50 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 border rounded flex items-center justify-center text-xs">
                    {file.type.startsWith('image/') && '���������🖼������️'}
                    {file.type === 'application/pdf' && '���������📄'}
                    {file.type.startsWith('text/') && '���������📄'}
                    {!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.type.startsWith('text/') && '���������📎'}
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(file.size / 1024)} KB • {file.type}
                    </p>
                  </div>
                </div>
                {multiple && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveFile(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        <input
          type="file"
          accept={SUPPORTED_MIME_TYPES.join(',')}
          className="hidden"
          multiple={multiple}
          onChange={handleFileChange}
          id="file-uploader"
        />
        <label
          htmlFor="file-uploader"
          className="flex flex-col items-center gap-3 cursor-pointer"
        >
          {!isUploading && (
            <>
              <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16h4a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 002-2H7a2 2 0 00-2 2v8a2 2 0 002 2zM11 8a2 2 0 100-4 2 2 0 000 4zm0 10a2 2 0 1000-4 2 2 0 000 4zM8.5 5.5a.5.5 0 110-1h1a.5.5 0 1100 1h-1zM11 6a.5.5 0 1100-1h3a.5.5 0 1100 1h-1zM11.5 9a.5.5 0 1100-1h2a.5.5 0 1100 1h-2z" />
              </svg>
              <h3 className="font-medium">
                {multiple ? 'Click to upload or drag & drop' : 'Click to upload or drag & drop'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Supported: {acceptedTypesText} (Max ${MAX_FILE_SIZE / (1024 * 1024)}MB per file)
                {multiple ? ' • Select multiple files' : ''}
              </p>
            </>
          )}
          {isUploading && (
            <>
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 border border-primary/50 rounded-full">
                  <div className={`h-full w-${uploadProgress} bg-primary rounded-full transition_all duration-300`}></div>
                </div>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {fileList.length > 0
                  ? `Processing ${fileList.length} file${fileList.length > 1 ? 's' : ''}...`
                  : 'Uploading...'}
              </p>
            </>
          )}
        </label>
      </div>

      {/* Upload Results */}
      {uploadResults && (
        <div className="space-y-4">
          {uploadResults.successful.length > 0 && (
            <div className="bg-success/10 border border-success text-success rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.354 12.146a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L10 14.172l-3.293 3.293a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Upload Successful</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadResults.successful.length} file{uploadResults.successful.length > 1 ? 's' : ''} uploaded
                  </p>
                </div>
              </div>
            </div>
          )}

          {uploadResults.failed.length > 0 && (
            <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1000-16 8 8 0 0000 16zM8.707 7.293a1 1 0 00-1.414 1.414L6.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">Upload Failed</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadResults.failed.length} file{uploadResults.failed.length > 1 ? 's' : ''} failed to upload
                  </p>
                  {uploadResults.failed.map((failure, index) => (
                    <div key={index} className="mt-2 text-xs text-destructive/80 truncate">
                      • {failure.fileName}: {failure.error}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && !uploadResults && (
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1000-16 8 8 0 0000 16zM8.707 7.293a1 1 0 00-1.414 1.414L6.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message (for single upload backwards compatibility) */}
      {success && !uploadResults && fileList.length === 1 && (
        <div className="bg-success/10 border border-success text-success rounded-lg p-4">
          <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 1000-16 8 8 0 0000 16zM9.354 12.146a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L10 14.172l-3.293 3.293a1 1 0 01-1.414-1.414l2-2z" clipRule="evenodd" />
          </svg>
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}