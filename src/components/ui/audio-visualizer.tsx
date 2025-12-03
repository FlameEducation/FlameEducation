import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  width?: number;
  height?: number;
  barColorStart?: string;
  barColorEnd?: string;
  backgroundColor?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  analyser, 
  isRecording,
  width = 300,
  height = 60,
  barColorStart = '#60a5fa', // blue-400
  barColorEnd = '#3b82f6',   // blue-500
  backgroundColor = 'rgb(248, 250, 252)' // slate-50
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !isRecording || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // 渐变色
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, barColorStart);
        gradient.addColorStop(1, barColorEnd);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isRecording, backgroundColor, barColorStart, barColorEnd]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="w-full rounded-md border border-slate-100"
      style={{ backgroundColor }}
    />
  );
};
