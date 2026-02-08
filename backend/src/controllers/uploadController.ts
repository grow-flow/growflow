import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { CONFIG } from '../config/settings';

const router = Router();

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const plantId = req.params.plantId;
    const dir = path.join(CONFIG.UPLOADS.PATH, plantId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: CONFIG.UPLOADS.MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (CONFIG.UPLOADS.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// POST /api/uploads/:plantId — upload multiple photos
router.post('/:plantId', upload.array('photos', CONFIG.UPLOADS.MAX_PER_EVENT), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files?.length) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const filenames = files.map(f => `${req.params.plantId}/${f.filename}`);
  res.json({ photos: filenames });
});

// DELETE /api/uploads/:plantId/:filename — remove a photo
router.delete('/:plantId/:filename', (req: Request, res: Response) => {
  const filePath = path.join(CONFIG.UPLOADS.PATH, req.params.plantId, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  fs.unlinkSync(filePath);
  res.status(204).send();
});

export { router as uploadRoutes };
