import { NextRequest, NextResponse } from "next/server";
import { createUploadedFile, getUploadedFiles, deleteAllUploadedFiles } from "@/lib/db";
import { processUploadedFile } from "@/lib/file-processor";

const PERSONAL_USER_ID = "user-123";

// Store API key and model in memory (in real app, use proper storage)
let cachedApiKey = "";
let cachedModel = "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

    const results = [];
    for (const file of files) {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain", "application/json"];
      const maxSize = 50 * 1024 * 1024;
      if (!validTypes.includes(file.type) || file.size > maxSize) {
        results.push({ name: file.name, status: "error", message: "Invalid file type or size" });
        continue;
      }

      // Convert file to base64 for processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64}`;

      const uploadedFile = await createUploadedFile({
        userId: PERSONAL_USER_ID,
        fileName: file.name,
        fileUrl: dataUrl, // Store base64 data URL for processing
        fileType: file.type,
        fileSize: file.size,
      });

      results.push({ id: uploadedFile.id, name: file.name, status: "success", message: "Uploaded successfully" });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const files = await getUploadedFiles(PERSONAL_USER_ID);
    return NextResponse.json(files);
  } catch (error) {
    console.error("Get uploads error:", error);
    return NextResponse.json({ error: "Failed to fetch uploads" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteAllUploadedFiles(PERSONAL_USER_ID);
    return NextResponse.json({ success: true, message: "All materials cleared" });
  } catch (error) {
    console.error("Clear uploads error:", error);
    return NextResponse.json({ error: "Failed to clear materials" }, { status: 500 });
  }
}

// Process a specific file with AI
export async function PATCH(request: NextRequest) {
  try {
    const { fileId, apiKey, model } = await request.json();

    if (!fileId) return NextResponse.json({ error: "File ID required" }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "API key required" }, { status: 400 });
    if (!model) return NextResponse.json({ error: "Model required" }, { status: 400 });

    // Check if file exists
    const files = await getUploadedFiles(PERSONAL_USER_ID);
    const file = files.find(f => f.id === fileId);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Cache for subsequent requests
    cachedApiKey = apiKey;
    cachedModel = model;

    const result = await processUploadedFile(fileId, apiKey, model);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Process file error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}