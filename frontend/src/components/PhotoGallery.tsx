import React, { useState, useRef, useCallback, useEffect } from "react";
import { Box, Dialog, IconButton, Typography } from "@mui/material";
import { Close, ChevronLeft, ChevronRight, ZoomOut } from "@mui/icons-material";
import { getPhotoUrl } from "@/services/api";

const SCALE_MIN = 1;
const SCALE_MAX = 4;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface PhotoGalleryProps {
  photos: string[];
  variant?: 'hero' | 'grid';
  thumbSize?: number;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos, variant = 'grid', thumbSize = 120 }) => {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!photos.length) return null;

  const resetZoom = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const navigate = (dir: -1 | 1) => {
    if (lightbox === null) return;
    resetZoom();
    setLightbox((lightbox + dir + photos.length) % photos.length);
  };

  const openLightbox = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    resetZoom();
    setLightbox(i);
  };

  const closeLightbox = (e?: React.SyntheticEvent) => {
    e?.stopPropagation?.();
    resetZoom();
    setLightbox(null);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left - rect.width / 2;
    const cursorY = e.clientY - rect.top - rect.height / 2;
    setScale(prev => {
      const next = clamp(prev * (e.deltaY < 0 ? 1.12 : 0.9), SCALE_MIN, SCALE_MAX);
      if (next === SCALE_MIN) {
        setTranslate({ x: 0, y: 0 });
      } else {
        const factor = next / prev - 1;
        setTranslate(t => ({ x: t.x - cursorX * factor, y: t.y - cursorY * factor }));
      }
      return next;
    });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    setTranslate({
      x: dragStart.current.tx + e.clientX - dragStart.current.x,
      y: dragStart.current.ty + e.clientY - dragStart.current.y,
    });
  };

  const onMouseUp = () => { dragStart.current = null; };

  const getTouchDist = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: getTouchDist(e.touches), scale };
      dragStart.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: translate.x, ty: translate.y };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const next = clamp(pinchStart.current.scale * getTouchDist(e.touches) / pinchStart.current.dist, SCALE_MIN, SCALE_MAX);
      setScale(next);
      if (next === SCALE_MIN) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragStart.current) {
      setTranslate({
        x: dragStart.current.tx + e.touches[0].clientX - dragStart.current.x,
        y: dragStart.current.ty + e.touches[0].clientY - dragStart.current.y,
      });
    }
  };

  const onTouchEnd = () => {
    pinchStart.current = null;
    dragStart.current = null;
  };

  const renderHero = () => {
    if (photos.length === 1) {
      return (
        <Box
          component="img"
          src={getPhotoUrl(photos[0])}
          alt=""
          onClick={(e) => openLightbox(e, 0)}
          sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
        />
      );
    }
    return (
      <Box sx={{ display: 'flex', gap: '2px', overflow: 'hidden', maxHeight: 240 }}>
        <Box
          component="img"
          src={getPhotoUrl(photos[0])}
          alt=""
          onClick={(e) => openLightbox(e, 0)}
          sx={{ flex: 2, minWidth: 0, objectFit: 'cover', cursor: 'pointer' }}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          {photos.slice(1, 3).map((photo, i) => (
            <Box key={photo} sx={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <Box
                component="img"
                src={getPhotoUrl(photo)}
                alt=""
                onClick={(e) => openLightbox(e, i + 1)}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }}
              />
              {i === 1 && photos.length > 3 && (
                <Box
                  onClick={(e) => openLightbox(e, 2)}
                  sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
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
            width: thumbSize, height: thumbSize, borderRadius: 1.5, objectFit: 'cover', cursor: 'pointer',
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
        onClose={closeLightbox}
        maxWidth={false}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{ sx: { bgcolor: 'black', maxWidth: '95vw', maxHeight: '95vh', overflow: 'hidden', m: 1 } }}
      >
        {lightbox !== null && (
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <IconButton
              onClick={closeLightbox}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'white', zIndex: 2, bgcolor: 'rgba(0,0,0,0.4)' }}
            >
              <Close />
            </IconButton>

            {scale > 1 && (
              <IconButton
                onClick={resetZoom}
                sx={{ position: 'absolute', top: 8, right: 52, color: 'white', zIndex: 2, bgcolor: 'rgba(0,0,0,0.4)' }}
              >
                <ZoomOut />
              </IconButton>
            )}

            {photos.length > 1 && (
              <>
                <IconButton
                  onClick={() => navigate(-1)}
                  sx={{ position: 'absolute', left: 8, color: 'white', zIndex: 2, bgcolor: 'rgba(0,0,0,0.4)' }}
                >
                  <ChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => navigate(1)}
                  sx={{ position: 'absolute', right: 8, color: 'white', zIndex: 2, bgcolor: 'rgba(0,0,0,0.4)' }}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}

            <Box
              ref={containerRef}
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              sx={{
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: scale > 1 ? 'grab' : 'zoom-in',
                userSelect: 'none',
                touchAction: scale > 1 ? 'none' : 'auto',
              }}
            >
              <Box
                component="img"
                src={getPhotoUrl(photos[lightbox])}
                alt=""
                draggable={false}
                sx={{
                  maxWidth: '90vw',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                  transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
                  transformOrigin: 'center center',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            {photos.length > 1 && (
              <Typography
                variant="caption"
                sx={{ position: 'absolute', bottom: 12, color: 'grey.400', bgcolor: 'rgba(0,0,0,0.5)', px: 1.5, py: 0.5, borderRadius: 2, zIndex: 2 }}
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
