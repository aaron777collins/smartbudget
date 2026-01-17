"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shake } from "@/components/ui/animated";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface AccountInfo {
  accountName?: string;
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  currency?: string;
}

export interface FilePreviewData {
  transactionCount?: number;
  fileName?: string;
  fileSize?: number;
  format?: string;
  transactions?: unknown[];
  validRows?: number;
  totalRows?: number;
  accountInfo?: AccountInfo;
  balance?: number;
  [key: string]: unknown;
}

export interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  previewData?: FilePreviewData;
}

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (fileId: string) => void;
  uploadedFiles?: UploadedFile[];
  acceptedFileTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
}

export function FileUpload({
  onFilesSelected,
  onFileRemove,
  uploadedFiles = [],
  acceptedFileTypes = [".csv", ".ofx", ".qfx"],
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadError(null);

      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map(f => {
          if (f.errors[0]?.code === 'file-too-large') {
            return `${f.file.name}: File too large (max ${formatFileSize(maxSize)})`;
          } else if (f.errors[0]?.code === 'file-invalid-type') {
            return `${f.file.name}: Invalid file type`;
          }
          return `${f.file.name}: ${f.errors[0]?.message || 'Upload failed'}`;
        });
        setUploadError(errors.join(', '));
      }

      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
      setDragActive(false);
    },
    [onFilesSelected, maxSize]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive, open: openFileDialog } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/x-ofx": [".ofx"],
      "application/vnd.intu.qfx": [".qfx"],
    },
    maxFiles,
    maxSize,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    noClick: false,
    noKeyboard: false,
  });

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-error" />;
      case "processing":
        return (
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {uploadError && (
        <Shake trigger={!!uploadError} duration={0.5} intensity={10}>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        </Shake>
      )}

      {/* Drop Zone */}
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed cursor-pointer transition-all
          ${
            isDragActive || dragActive
              ? "border-primary/20 bg-primary/10 dark:bg-primary/10"
              : "border-border hover:border-border"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="p-8 text-center">
          <Upload
            className={`mx-auto h-12 w-12 mb-4 ${
              isDragActive || dragActive
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive || dragActive
                ? "Drop files here..."
                : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse your computer
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: {acceptedFileTypes.join(", ")} (max {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(uploadedFile.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(uploadedFile.file.size)}</span>
                        {uploadedFile.status === "error" && uploadedFile.error && (
                          <>
                            <span>•</span>
                            <span className="text-error">{uploadedFile.error}</span>
                          </>
                        )}
                        {uploadedFile.status === "success" && uploadedFile.previewData && (
                          <>
                            <span>•</span>
                            <span className="text-success">
                              {uploadedFile.previewData.transactionCount || 0} transactions
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {onFileRemove && uploadedFile.status !== "processing" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(uploadedFile.id)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
