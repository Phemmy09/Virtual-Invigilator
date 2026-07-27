const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';

const FILES = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

function downloadFile(file) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(MODELS_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`[EXISTS] ${file}`);
      return resolve();
    }

    const url = BASE_URL + file;
    console.log(`[DOWNLOADING] ${file} from ${url}...`);

    const fileStream = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlinkSync(filePath);
        return reject(new Error(`Failed to download ${file}: Status ${response.statusCode}`));
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`[DONE] ${file}`);
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading face-api.js model weights...');
  for (const file of FILES) {
    try {
      await downloadFile(file);
    } catch (err) {
      console.error(`Error downloading ${file}:`, err.message);
    }
  }
  console.log('Model download phase completed.');
}

main();
