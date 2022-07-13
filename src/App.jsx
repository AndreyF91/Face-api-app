import { useRef, useState, useEffect } from "react";
import "./App.css";

import * as faceapi from "face-api.js";

function App() {
  const [camStatus, setCamStatus] = useState(false);

  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadModels = () => {
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ])
        .then(startVideo())
        .catch((e) => console.log(e));
    };

    streamRef.current && loadModels();
  }, []);

  const startVideo = () => {
    setCamStatus(true);
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current.srcObject = stream;
      } catch (err) {
        console.log(err);
      }
    };

    const handleStream = async () => {
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(
            streamRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();
        canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
          streamRef.current
        );
        const displaySize = {
          width: streamRef.current.offsetWidth,
          height: streamRef.current.height,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      }, 100);
    };
    getUserMedia();
    handleStream();
  };

  const stopVideo = () => {
    setCamStatus(false);
    streamRef.current.srcObject.getTracks()[0].stop();
    // clearInterval(intervalId);
  };

  return (
    <div className="app">
      <div className="webcam__container">
        <video ref={streamRef} height={480} weight={640} muted autoPlay></video>
      </div>
      <canvas ref={canvasRef}></canvas>
      <div className="webcam__button">
        {camStatus ? (
          <button onClick={stopVideo}>STOP</button>
        ) : (
          <button onClick={startVideo}>START</button>
        )}
      </div>
    </div>
  );
}

export default App;
