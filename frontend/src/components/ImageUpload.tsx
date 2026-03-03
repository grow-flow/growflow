import React, { useCallback, useRef, useState } from "react";
import { Box, IconButton, Typography, CircularProgress, alpha } from "@mui/material";
import { AddAPhoto, Close } from "@mui/icons-material";
import { getPhotoUrl } from "@/services/api";
import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg" as const,
};

interface ImageUploadProps {
  photos: string[];
  pendingFiles: File[];
  onFilesAdd: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  onExistingRemove: (photo: string) => void;
}

const THUMB_SIZE = 80;

const ImageUpload: React.FC<ImageUploadProps> = ({
  photos,
  pendingFiles,
  onFilesAdd,
  onFileRemove,
  onExistingRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [previews] = useState<Map<File, string>>(new Map());

  const getPreview = (file: File) => {
    if (!previews.has(file)) {
      previews.set(file, URL.createObjectURL(file));
    }
    return previews.get(file)!;
  };

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || /heic|heif/i.test(f.name));
    if (!files.length) return;
    setCompressing(true);
    try {
      const compressed = await Promise.all(files.map(f => imageCompression(f, COMPRESSION_OPTIONS)));
      onFilesAdd(compressed);
    } finally {
      setCompressing(false);
    }
  }, [onFilesAdd]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const thumbSx = {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 1,
    objectFit: 'cover' as const,
  };

  const removeBtnSx = {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    bgcolor: 'error.main',
    color: 'white',
    width: 20,
    height: 20,
    '&:hover': { bgcolor: 'error.dark' },
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Photos</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Existing photos */}
        {photos.map((photo) => (
          <Box key={photo} sx={{ position: 'relative' }}>
            <Box component="img" src={getPhotoUrl(photo)} alt="" sx={thumbSx} />
            <IconButton size="small" onClick={() => onExistingRemove(photo)} sx={removeBtnSx}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}

        {/* Pending file previews */}
        {pendingFiles.map((file, i) => (
          <Box key={`pending-${i}`} sx={{ position: 'relative' }}>
            <Box component="img" src={getPreview(file)} alt="" sx={thumbSx} />
            <IconButton size="small" onClick={() => onFileRemove(i)} sx={removeBtnSx}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}

        {/* Add button / drop zone */}
        <Box
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          sx={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: 1,
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'divider',
            bgcolor: dragOver ? (t) => alpha(t.palette.primary.main, 0.08) : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.04) },
          }}
        >
          {compressing
            ? <CircularProgress size={24} />
            : <AddAPhoto sx={{ color: 'text.secondary', fontSize: 24 }} />
          }
        </Box>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />
    </Box>
  );
};

export default ImageUpload;
