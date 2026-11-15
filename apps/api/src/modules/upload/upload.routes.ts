import { Router, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthRequest } from '../../types/express.js';
import { ApiError } from '../../utils/ApiError.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();
const uploadsDir = fs.existsSync(path.join(process.cwd(), 'apps', 'api'))
  ? path.join(process.cwd(), 'apps', 'api', 'public', 'uploads')
  : path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface UploadFilePayload {
  filename: string;
  data: string; // base64 or data URL
}

router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { filename, data, files } = req.body as {
      filename?: string;
      data?: string;
      files?: UploadFilePayload[];
    };

    const items: UploadFilePayload[] = files || (filename && data ? [{ filename, data }] : []);
    if (!items || items.length === 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'No image file data provided');
    }

    const uploadedUrls: string[] = [];

    for (const item of items) {
      if (!item.data || typeof item.data !== 'string') continue;

      const matches = item.data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = '.jpg';
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime === 'image/png') ext = '.png';
        else if (mime === 'image/webp') ext = '.webp';
        else if (mime === 'image/gif') ext = '.gif';
        else if (mime === 'image/svg+xml') ext = '.svg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(item.data, 'base64');
      }

      if (buffer.length > 5 * 1024 * 1024) {
        throw new ApiError(400, 'FILE_TOO_LARGE', 'Image must be under 5MB');
      }

      const randomId = crypto.randomBytes(8).toString('hex');
      const cleanName = (item.filename || 'snack')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFilename = `${Date.now()}-${randomId}-${cleanName}${ext}`;
      const filePath = path.join(uploadsDir, safeFilename);

      await fs.promises.writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${safeFilename}`);
    }

    res.status(201).json({
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
      message: 'Images uploaded successfully',
    });
  })
);

export default router;
