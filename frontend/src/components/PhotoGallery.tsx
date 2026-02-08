import React, { useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { getPhotoUrl } from "@/services/api";

interface PhotoGalleryProps {
  photos: string[];
  thumbSize?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, thumbSize = 60 }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!photos.length) return null;

  const navigate = (dir: -1 | 1) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + photos.length) % photos.length);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
        {photos.map((photo, i) => (
          <Box
            key={photo}
            component="img"
            src={getPhotoUrl(photo)}
            alt=""
            onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
            sx={{
              width: thumbSize,
              height: thumbSize,
              borderRadius: 1,
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          />
        ))}
      </Box>

      {/* Lightbox */}
      <Dialog
        open={lightbox !== null}
        onClose={(e) => { (e as React.SyntheticEvent).stopPropagation?.(); setLightbox(null); }}
        maxWidth={false}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: 'black', maxWidth: '95vw', maxHeight: '95vh', overflow: 'hidden' } }}
      >
        {lightbox !== null && (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1 }}
            >
              <Close />
            </IconButton>

            {photos.length > 1 && (
              <>
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{ position: 'absolute', left: 8, color: 'white', zIndex: 1 }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => navigate(1)}
                  sx={{ position: 'absolute', right: 8, color: 'white', zIndex: 1 }}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}

            <Box
              component="img"
              src={getPhotoUrl(photos[lightbox])}
              alt=""
              sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            />

            <Typography
              variant="caption"
              sx={{ position: 'absolute', bottom: 8, color: 'grey.400' }}
            >
              {lightbox + 1} / {photos.length}
            </Typography>
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default PhotoGallery;
