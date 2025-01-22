import './styles/App.css';

import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import { useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

import {
  load as cocoSSDLoad,
  type ObjectDetection,
} from '@tensorflow-models/coco-ssd';

import { drawRect } from './utils/drawRect';

let detectInterval: NodeJS.Timer;

const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load the audio files
  const audioMap: { [key: string]: HTMLAudioElement } = {
    person: new Audio('/audio/person.mp3'),
    "cell phone": new Audio('/audio/cellphone.mp3'),
    bottle: new Audio('/audio/bottle.mp3'),
    chair: new Audio('/audio/chair.mp3'),
    // Add more objects and their respective audio files as needed
  };

  // Function to play audio based on detected object
  function playAudio(label: string) {
    const audio = audioMap[label.toLowerCase()];
    if (audio) {
      audio.play();

      // Log to console for which object and audio is playing
      console.log(`Playing audio for: ${label}`);
    }
  }

  async function runCoco() {
    // Load network
    const net = await cocoSSDLoad();

    // Loop to detect objects every 1 second
    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 1000); // Deteksi objek setiap 1 detik
  }

  function showMyVideo() {
    if (
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      // Get video properties
      const myVideoWidth = webcamRef.current.video.videoWidth;
      const myVideoHeight = webcamRef.current.video.videoHeight;

      // Set video width and height
      webcamRef.current.video.width = myVideoWidth;
      webcamRef.current.video.height = myVideoHeight;
    }
  }

  async function runObjectDetection(net: ObjectDetection) {
    if (
      canvasRef.current &&
      webcamRef.current !== null &&
      webcamRef.current.video?.readyState === 4
    ) {
      // Set canvas height and width
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;

      // Make detections
      const detectedObjects = await net.detect(
        webcamRef.current.video,
        undefined,
        0.5,
      );

      console.log('Detect data: ', detectedObjects);

      // Draw mesh
      const context = canvasRef.current.getContext('2d');

      if (context) {
        // Update drawing utility
        drawRect(detectedObjects, context);

        // Log and play audio for detected objects
        detectedObjects.forEach((object) => {
          const label = object.class.toLowerCase();
          const confidence = (object.score * 100).toFixed(2); // Confidence in percentage

          // Log to console
          console.log(`Detected: ${label}, Confidence: ${confidence}%`);

          // Play audio for the detected object
          if (audioMap[label]) {
            console.log(`Audio for ${label} is now playing.`);
            playAudio(label);
          }
        });
      }
    }
  }

  useEffect(() => {
    showMyVideo();
    runCoco();

    return () => clearInterval(detectInterval); // Cleanup when component unmounts
  }, []);

  return (
    <div className="wrapper">
      <div className="container">
        <Webcam ref={webcamRef} className="my-video" muted />
        <canvas ref={canvasRef} className="object-detection" />
      </div>
    </div>
  );
};

export default App;
