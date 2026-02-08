import React, { useState } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Close, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { getPhotoUrl } from "@/services/api";

interface PhotoGalleryProps {
  photos: string[];
  variant?: 'hero' | 'grid';
  thumbSize?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, variant = 'grid', thumbSize = 120 }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!photos.length) return null;

  const navigate = (dir: -1 | 1) => {
    if (lightbox === null) return;
    setLightbox((lightbox + dir + photos.length) % photos.length);
  };

  const openLightbox = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setLightbox(i);
  };

  const renderHero = () => {
    if (photos.length === 1) {
      return (
        <Box
          component="img"
          src={getPhotoUrl(photos[0])}
          alt=""
          onClick={(e) => openLightbox(e, 0)}
          sx={{
            width: '100%',
            maxHeight: 300,
            objectFit: 'cover',
            cursor: 'pointer',
            display: 'block',
          }}
        />
      );
    }

    return (
      <Box sx={{ display: 'flex', gap: '2px', overflow: 'hidden', maxHeight: 240 }}>
        {/* Main image takes 2/3 */}
        <Box
          component="img"
          src={getPhotoUrl(photos[0])}
          alt=""
          onClick={(e) => openLightbox(e, 0)}
          sx={{
            flex: 2,
            minWidth: 0,
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />
        {/* Side stack takes 1/3 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          {photos.slice(1, 3).map((photo, i) => (
            <Box key={photo} sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <Box
                component="img"
                src={getPhotoUrl(photo)}
                alt=""
                onClick={(e) => openLightbox(e, i + 1)}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  display: 'block',
                }}
              />
              {i === 1 && photos.length > 3 && (
                <Box
                  onClick={(e) => openLightbox(e, 2)}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Typography variant="h6" color="white">+{photos.length - 3}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderGrid = () => (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {photos.map((photo, i) => (
        <Box
          key={photo}
          component="img"
          src={getPhotoUrl(photo)}
          alt=""
          onClick={(e) => openLightbox(e, i)}
          sx={{
            width: thumbSize,
            height: thumbSize,
            borderRadius: 1.5,
            objectFit: 'cover',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover': { transform: 'scale(1.03)', boxShadow: 3 },
          }}
        />
      ))}
    </Box>
  );

  return (
    <>
      {variant === 'hero' ? renderHero() : renderGrid()}

      <Dialog
        open={lightbox !== null}
        onClose={(e) => { (e as React.SyntheticEvent).stopPropagation?.(); setLightbox(null); }}
        maxWidth={false}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: 'black', maxWidth: '95vw', maxHeight: '95vh', overflow: 'hidden', m: 1 } }}
      >
        {lightbox !== null && (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <IconButton
              onClick={() => setLightbox(null)}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 1, bgcolor: 'rgba(0,0,0,0.4)' }}
            >
              <Close />
            </IconButton>

            {photos.length > 1 && (
              <>
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{ position: 'absolute', left: 8, color: 'white', zIndex: 1, bgcolor: 'rgba(0,0,0,0.4)' }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => navigate(1)}
                  sx={{ position: 'absolute', right: 8, color: 'white', zIndex: 1, bgcolor: 'rgba(0,0,0,0.4)' }}
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

            {photos.length > 1 && (
              <Typography
                variant="caption"
                sx={{ position: 'absolute', bottom: 12, color: 'grey.400', bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.5, borderRadius: 2 }}
              >
                {lightbox + 1} / {photos.length}
              </Typography>
            )}
          </Box>
        )}
      </Dialog>
    </>
  );
};

export default PhotoGallery;
