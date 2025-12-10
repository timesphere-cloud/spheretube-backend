import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import cors from 'cors';
import fs from 'fs';

config(); // załaduj .env

const app = express();
app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Multer config (przechowywanie pliku tymczasowo)
const upload = multer({ dest: 'tmp/' });

// Endpoint do uploadu plików
app.post('/upload', upload.fields([{ name: 'video' }, { name: 'thumb' }]), async (req, res) => {
  try {
    const videoFile = req.files['video'] ? req.files['video'][0] : null;
    const thumbFile = req.files['thumb'] ? req.files['thumb'][0] : null;

    if (!videoFile) return res.status(400).json({ error: 'Brak pliku wideo' });

    // Upload video
    const videoResult = await cloudinary.uploader.upload(videoFile.path, {
      resource_type: 'video',
      folder: 'spheretube/videos'
    });

    // Upload thumbnail (opcjonalnie)
    let thumbResult = null;
    if (thumbFile) {
      thumbResult = await cloudinary.uploader.upload(thumbFile.path, {
        folder: 'spheretube/thumbnails'
      });
    }

    // Usuń pliki tymczasowe
    if (videoFile) fs.unlinkSync(videoFile.path);
    if (thumbFile) fs.unlinkSync(thumbFile.path);

    res.json({
      videoUrl: videoResult.secure_url,
      thumbUrl: thumbResult ? thumbResult.secure_url : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd uploadu' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
