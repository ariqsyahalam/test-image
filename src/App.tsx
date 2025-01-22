import './styles/App.css';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';

import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

import {
  load as cocoSSDLoad,
  type ObjectDetection,
} from '@tensorflow-models/coco-ssd';

import { drawRect } from './utils/drawRect';

let detectInterval: ReturnType<typeof setInterval>;

const App = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Audio map for detected objects
  const audioMap: { [key: string]: HTMLAudioElement } = {
    person: new Audio('/audio/person.mp3'),
    "cell phone": new Audio('/audio/cellphone.mp3'),
    bottle: new Audio('/audio/bottle.mp3'),
    chair: new Audio('/audio/chair.mp3'),
    // Add more objects and their respective audio files as needed
  };

  // State to manage which object was detected and if the audio is playing
  const [detectedObject, setDetectedObject] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Function to play audio based on detected object
  const playAudio = (label: string) => {
    const audio = audioMap[label.toLowerCase()];
    if (audio) {
      audio.play().then(() => {
        console.log(`Audio untuk ${label} berhasil diputar`);
      }).catch((error) => {
        console.error(`Gagal memutar audio untuk ${label}:`, error);
      });

      setAudioPlaying(true);  // Mark as playing audio
      console.log(`Playing audio for: ${label}`);

      // Listen for when the audio finishes playing
      audio.onended = () => {
        setAudioPlaying(false); // Audio has finished, set state to allow button to appear again
        setDetectedObject(null); // Hide the object label after audio finishes
      };
    }
  };

  async function runCoco() {
    // Load the coco-ssd model
    const net = await cocoSSDLoad();

    // Loop to detect objects every 1 second
    detectInterval = setInterval(() => {
      runObjectDetection(net);
    }, 1000);
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

        // Check detected objects and set state to show audio player
        detectedObjects.forEach((object) => {
          const label = object.class.toLowerCase();
          const confidence = (object.score * 100).toFixed(2); // Confidence in percentage

          // Log to console
          console.log(`Detected: ${label}, Confidence: ${confidence}%`);

          // Show the audio player if it's a specific object and not already playing
          if (audioMap[label] && !audioPlaying && !detectedObject) {
            setDetectedObject(label); // Update state to show the audio player for this object
          }
        });
      }
    }
  }

  useEffect(() => {
    showMyVideo();
    runCoco();

    return () => clearInterval(detectInterval);
  }, []);

  return (
    <div className="wrapper">
      <div className="container">
        <Webcam ref={webcamRef} className="my-video" muted />
        <canvas ref={canvasRef} className="object-detection" />
      </div>

      {/* Conditional rendering of the audio player */}
      {detectedObject && (
        <div className="audio-player-container">
          <audio
            id="audio-player"
            controls
            autoPlay
            onEnded={() => {
              setAudioPlaying(false);
              setDetectedObject(null); // Hide object label after audio finishes
            }}
          >
            <source src={audioMap[detectedObject]?.src} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default App;
