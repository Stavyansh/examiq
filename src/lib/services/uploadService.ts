/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced file upload service for handling educational materials
 * Supports PDF, image, and text files
 * Enhanced in Phase 6 with multiple file support, progress tracking, and enhanced validation
 */

import { v4 as uuidv4 } from 'uuid';
import { aiService, AI_CONFIG } from './aiService';

// Supported file types with enhanced categorization
export const SUPPORTED_FILE_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  text: ['text/plain', 'text/markdown', 'text/csv', 'application/json'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
             'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
             'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
};

// All supported MIME types
export const SUPPORTED_MIME_TYPES = [
  ...SUPPORTED_FILE_TYPES.pdf,
  ...SUPPORTED_FILE_TYPES.image,
  ...SUPPORTED_FILE_TYPES.text,
  ...SUPPORTED_FILE_TYPES.document
];

// File type descriptions for UI
export const FILE_TYPE_DESCRIPTIONS = {
  pdf: 'PDF Documents',
  image: 'Images (JPG, PNG, GIF, WebP, SVG)',
  text: 'Text Files (TXT, MD, CSV, JSON)',
  document: 'Office Documents (Word, Excel, PowerPoint)'
};

// Maximum file size (25MB increased from 10MB for Phase 6 enhancement)
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Chunk size for large file processing (1MB chunks)
export const CHUNK_SIZE = 1024 * 1024;

/**
 * Enhanced file validation with detailed feedback
 */
export function validateFile(file: File): { isValid: boolean; error?: string; warnings?: string[] } {
  const warnings: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
    };
  }

  // Warn about large files that might take longer to process
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push(`Large file (${Math.round(file.size / (1024 * 1024))}MB) may take longer to process`);
  }

  // Check file type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    // Provide more specific error messages
    let typeInfo = '';
    if (file.type.startsWith('image/')) {
      typeInfo = 'Image files must be JPG, PNG, GIF, WebP, or SVG';
    } else if (file.type === 'application/pdf') {
      typeInfo = 'Only PDF documents are supported';
    } else if (file.type.startsWith('text/')) {
      typeInfo = 'Text files must be TXT, MD, CSV, or JSON format';
    } else {
      typeInfo = 'Unsupported file format';
    }

    return {
      isValid: false,
      error: `${typeInfo}. Supported types: PDF, Images (JPG/PNG/GIF/WebP/SVG), Text (TXT/MD/CSV/JSON), Office Documents`
    };
  }

  // Additional validation for specific file types
  if (file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf')) {
    // PDF-specific validation could go here
  }

  return { isValid: true, warnings };
}

/**
 * Generate a unique filename for uploaded files
 */
export function generateFileName(originalName: string): string {
  // Handle files with no extension
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? parts.pop() || '' : '';
  const nameWithoutExt = parts.length > 0 ? parts.join('.') : originalName || 'file';

  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);

  return extension
    ? `${nameWithoutExt}_${timestamp}_${uniqueId}.${extension}`
    : `${nameWithoutExt}_${timestamp}_${uniqueId}`;
}

/**
 * Enhanced text extraction with better file type support and progress indication
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use AI service for complex files if configured and beneficial
  if (!AI_CONFIG.useMock &&
      (file.type.startsWith('image/') || file.type === 'application/pdf')) {
    try {
      const aiExtractedText = await aiService.extractTextFromDocument(buffer, file.type);
      if (aiExtractedText && aiExtractedText.trim().length > 50) {
        return aiExtractedText;
      }
    } catch (error) {
      console.warn('AI text extraction failed, falling back to basic extraction:', error);
      // Fall back to basic extraction
    }
  }

  // Enhanced basic extraction with support for more file types
  return extractTextFromFileEnhanced(buffer, file.type, file.name);
}

/**
 * Enhanced text extraction from file with support for more file types
 */
function extractTextFromFileEnhanced(buffer: Buffer, fileType: string, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // For image files, return mock OCR result
      if (fileType.startsWith('image/')) {
        resolve(`[OCR RESULT] Extracted text from ${fileName}\n\nThis is an enhanced mock OCR result. In production with AI configured, this would use actual AI-powered Optical Character Recognition to extract text from images with confidence scores and layout preservation.`);
        return;
      }

      // For PDF files, return mock PDF text extraction
      if (fileType === 'application/pdf') {
        resolve(`[PDF TEXT] Extracted content from ${fileName}\n\nThis is enhanced mock PDF text extraction. In production with AI configured, this would use actual AI-powered Document Understanding to extract text, tables, and structure from uploaded PDF documents.`);
        return;
      }

      // For text files, read actual content
      if (fileType.startsWith('text/')) {
        try {
          const text = buffer.toString('utf-8');
          resolve(`[TEXT FILE] ${fileName}\n\n${text.substring(0, 500)}${text.length > 500 ? '\n\n[Content truncated for preview...]' : ''}`);
          return;
        } catch (error) {
          reject(new Error('Failed to decode text file'));
        }
        return;
      }

      // For CSV files, provide structured preview
      if (fileType === 'text/csv') {
        try {
          const text = buffer.toString('utf-8');
          const lines = text.split('\n').slice(0, 5); // First 5 lines
          resolve(`[CSV DATA] ${fileName}\n\n${lines.join('\n')}${lines.length === 5 && text.split('\n').length > 5 ? '\n\n[Showing first 5 rows, use AI analysis for full insights...]' : ''}`);
          return;
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
        return;
      }

      // For JSON files, provide structured preview
      if (fileType === 'application/json') {
        try {
          const jsonText = buffer.toString('utf-8');
          const parsed = JSON.parse(jsonText);
          resolve(`[JSON DATA] ${fileName}\n\n${JSON.stringify(parsed, null, 2).substring(0, 500)}${JSON.stringify(parsed).length > 500 ? '\n\n[Content truncated for preview...]' : ''}`);
          return;
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
        return;
      }

      // For Office documents, provide enhanced mock extraction
      if (SUPPORTED_FILE_TYPES.document.includes(fileType)) {
        resolve(`[OFFICE DOC] Extracted content from ${fileName}\n\nThis is enhanced mock extraction for Office documents. In production with AI configured, this would extract text, tables, images, and formatting from Word, Excel, and PowerPoint files while preserving document structure.`);
        return;
      }

      // Fallback
      resolve(`[FILE CONTENT] Content extracted from ${fileName}\n\nMock extraction result. Actual implementation will vary by file type and AI configuration.`);
    } catch (error) {
      reject(new Error(`Failed to extract text from ${fileName}: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}

/**
 * Enhanced function to save file metadata to database with better tracking
 */
export async function saveFileMetadata(
  userId: string,
  examId: string,
  file: File,
  extractedText: string
) {
  // This would normally call the materialService.create() method
  // For now, we'll return a mock material object with enhanced metadata

  const fileUrl = `/uploads/${generateFileName(file.name || 'file')}`;

  // Determine processing status based on file type and size
  const processed = file.size < 100 * 1024; // Auto-process small files (<100KB)

  return {
    id: uuidv4(),
    examId,
    title: file.name || 'untitled',
    fileUrl,
    fileType: file.type,
    fileSize: file.size,
    uploadDate: new Date(),
    processed,
    processingTime: Math.floor(Math.random() * 3000) + 500, // Simulated processing time 0.5-3.5s
    // In a real implementation, we'd also save chunks and extractive summaries here
    extractedTextPreview: extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : ''),
    wordCount: extractedText.trim().split(/\s+/).length,
    characterCount: extractedText.length,
    uploadId: uuidv4(), // For tracking upload batches
    metadata: {
      isEncrypted: false,
      needsReview: file.size > 10 * 1024 * 1024, // Flag large files for review
      source: 'user-upload',
      uploadMethod: 'browser'
    }
  };
}

/**
 * Process uploaded file: validate, extract text, save metadata
 */
export async function processUploadedFile(
  userId: string,
  examId: string,
  file: File
) {
  // Step 1: Validate file
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Step 2: Extract text (enhanced with AI in Phase 4)
  const extractedText = await extractTextFromFile(file);

  // Step 3: Save metadata
  const material = await saveFileMetadata(userId, examId, file, extractedText);

  return {
    ...material,
    extractedText // Include full text for immediate use in topic extraction
  };
}

/**
 * Process multiple uploaded files with progress tracking
 */
export async function processMultipleFiles(
  userId: string,
  examId: string,
  files: File[],
  onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
): Promise<{ successful: Array<{ material: Record<string, unknown>; file: File }>; failed: Array<{ error: string; file: File }> }> {
  const results = {
    successful: [] as Array<{ material: Record<string, unknown>; file: File }>,
    failed: [] as Array<{ error: string; file: File }>
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Report progress
    if (onProgress) {
      onProgress({
        completed: i,
        total: files.length,
        currentFile: file.name
      });
    }

    try {
      const material = await processUploadedFile(userId, examId, file);
      results.successful.push({ material, file });
    } catch (error) {
      results.failed.push({
        error: error instanceof Error ? error.message : String(error),
        file
      });
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      completed: files.length,
      total: files.length,
      currentFile: ''
    });
  }

  return results;
}