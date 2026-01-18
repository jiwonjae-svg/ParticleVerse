'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { t } from '@/locales';
import {
  Video,
  Square,
  Download,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export default function RecordPanel() {
  const {
    recordingSettings,
    updateRecordingSettings,
    isRecording,
    setIsRecording,
  } = useAppStore();

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 녹화 시간 포맷
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 캔버스 찾기
  const findCanvas = useCallback((): HTMLCanvasElement | null => {
    // Three.js 캔버스 찾기
    const canvas = document.querySelector('canvas:not([class*="hidden"])') as HTMLCanvasElement;
    return canvas;
  }, []);

  // 녹화 시작
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const canvas = findCanvas();
      
      if (!canvas) {
        setError(t('canvasNotFound'));
        return;
      }

      canvasRef.current = canvas;

      // 캔버스 스트림 가져오기
      const stream = canvas.captureStream(recordingSettings.fps);

      // 오디오 스트림 추가 (선택적)
      if (recordingSettings.includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
        } catch (audioError) {
          console.warn('Audio capture failed:', audioError);
        }
      }

      // 코덱 지원 확인
      const mimeType = recordingSettings.format === 'webm' 
        ? 'video/webm;codecs=vp9'
        : 'video/mp4';
      
      // 폴백 코덱
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
        ? mimeType
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : '';

      if (!supportedMimeType) {
        setError(t('codecNotSupported'));
        return;
      }

      // MediaRecorder 생성
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: recordingSettings.quality * 10000000, // quality * 10 Mbps
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: supportedMimeType });
        setRecordedBlob(blob);
        setIsRecording(false);
      };

      mediaRecorder.onerror = (event) => {
        console.error('Recording error:', event);
        setError(t('recordingFailed'));
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);

      // 타이머 시작
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(t('startFailed'));
    }
  }, [findCanvas, recordingSettings, setIsRecording]);

  // 녹화 중지
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 다운로드
  const downloadRecording = useCallback(() => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `particleverse-${Date.now()}.${recordingSettings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedBlob, recordingSettings.format]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="space-y-6"
    >
      {/* 녹화 컨트롤 */}
      <div className="space-y-4">
        {/* 상태 표시 */}
        {isRecording && (
          <div className="flex items-center justify-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-medium">{t('recording')}</span>
            <span className="text-white font-mono text-lg">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* 녹화 버튼 */}
        <div className="flex gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Video className="w-5 h-5" />
              {t('startRecording')}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex-1 flex items-center justify-center gap-2 p-4 bg-dark-600 hover:bg-dark-500 text-white rounded-lg transition-colors"
            >
              <Square className="w-5 h-5" />
              {t('stopRecording')}
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-4 rounded-lg transition-colors ${
              showSettings 
                ? 'bg-primary-500/20 text-primary-400' 
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* 다운로드 버튼 */}
        {recordedBlob && !isRecording && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={downloadRecording}
            className="w-full flex items-center justify-center gap-2 p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            {t('downloadRecording')} ({(recordedBlob.size / 1024 / 1024).toFixed(2)} MB)
          </motion.button>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* 설정 */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 pt-4 border-t border-dark-600"
        >
          {/* 포맷 */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">{t('format')}</label>
            <div className="flex gap-2">
              {(['webm', 'mp4'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => updateRecordingSettings({ format })}
                  disabled={isRecording}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm transition-colors ${
                    recordingSettings.format === format
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 품질 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-400">{t('recordQuality')}</label>
              <span className="text-sm text-white">{Math.round(recordingSettings.quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              value={recordingSettings.quality}
              onChange={(e) => updateRecordingSettings({ quality: parseFloat(e.target.value) })}
              disabled={isRecording}
              className="w-full accent-primary-500"
            />
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-gray-400 light:text-slate-600">{t('recordFps')}</label>
              <span className="text-sm text-white light:text-slate-800">{recordingSettings.fps} FPS</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={recordingSettings.fps}
              onChange={(e) => updateRecordingSettings({ fps: parseInt(e.target.value) })}
              disabled={isRecording}
              className="w-full accent-primary-500"
            />
          </div>

          {/* 오디오 포함 */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400 light:text-slate-600">{t('includeAudio')}</label>
            <button
              onClick={() => updateRecordingSettings({ includeAudio: !recordingSettings.includeAudio })}
              disabled={isRecording}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                recordingSettings.includeAudio ? 'bg-primary-500' : 'bg-dark-600 light:bg-slate-300'
              } ${isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.div
                className="w-4 h-4 rounded-full bg-white"
                animate={{ x: recordingSettings.includeAudio ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </motion.div>
      )}

      {/* 법적 안내 */}
      <div className="p-3 bg-yellow-500/10 light:bg-blue-100/80 border border-yellow-500/30 light:border-blue-300/50 rounded-lg">
        <p className="text-xs text-yellow-400/80 light:!text-slate-900 leading-relaxed">
          {t('legalNotice')}
        </p>
      </div>
    </motion.div>
  );
}
