// This is a utility script to generate sample audio files
// We're using Web Audio API to create brief tones

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateTone(frequency = 440, duration = 2, filename = 'sample.mp3') {
  // This would normally use Web Audio API but we can't in a Node.js environment
  // Instead, we'll create placeholder files for our audio samples
  
  const outputDir = path.join(__dirname, '../../public/assets/audio');
  const outputPath = path.join(outputDir, filename);
  
  fs.writeFileSync(outputPath, `Sample audio file at ${frequency}Hz`);
  console.log(`Created sample audio file: ${outputPath}`);
}

// Generate several sample files
generateTone(440, 2, 'sample1.mp3'); // A4 note
generateTone(523, 2, 'sample2.mp3'); // C5 note
generateTone(587, 2, 'sample3.mp3'); // D5 note
generateTone(659, 2, 'sample4.mp3'); // E5 note
generateTone(698, 2, 'sample5.mp3'); // F5 note
generateTone(784, 2, 'sample6.mp3'); // G5 note
generateTone(880, 2, 'sample7.mp3'); // A5 note
generateTone(988, 2, 'sample8.mp3'); // B5 note