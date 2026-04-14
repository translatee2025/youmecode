import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TENANT_ID } from '@/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Camera, Link, X, Video, Square } from 'lucide-react';

export type UploadMode = 'gallery_cam' | 'gallery_camera' | 'cam_only' | 'camera_only' | 'links_only';

interface MediaUploaderProps {
  onMediaReady: (result: { file?: File; url?: string; thumbnailUrl?: string; type: 'file' | 'recorded' | 'link' }) => void;
  accept?: string;
  mode?: UploadMode | string;
  photoOnly?: boolean; // For venue images — always allow file picker for photos
}

function normalizeMode(mode?: string): 'gallery_cam' | 'cam_only' | 'links_only' {
  if (!mode) return 'gallery_cam';
  if (mode === 'camera_only' || mode === 'cam_only') return 'cam_only';
  if (mode === 'links_only') return 'links_only';
  return 'gallery_cam';
}

export default function MediaUploader({ onMediaReady, accept = 'image/*,video/*', mode: rawMode, photoOnly }: MediaUploaderProps) {
  const mode = normalizeMode(rawMode);
  const [showCamera, setShowCamera] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [timer, setTimer] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPreview, setLinkPreview] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setRecordedBlob(null);
    setRecordedUrl('');
    setTimer(0);
    setRecording(false);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera access denied');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
      stopStream();
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleUseRecording = () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
    onMediaReady({ file, type: 'recorded' });
    setShowCamera(false);
    stopStream();
  };

  const handleReRecord = () => {
    setRecordedBlob(null);
    setRecordedUrl('');
    startCamera();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onMediaReady({ file, type: 'file' });
  };

  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) return;
    // Try to extract thumbnail from YouTube/TikTok
    let thumb = '';
    const ytMatch = linkUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) thumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
    onMediaReady({ url: linkUrl, thumbnailUrl: thumb || undefined, type: 'link' });
    setLinkUrl('');
    setLinkPreview('');
  };

  useEffect(() => {
    // Auto-fetch link preview
    if (!linkUrl) { setLinkPreview(''); return; }
    const ytMatch = linkUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) setLinkPreview(`https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`);
    else setLinkPreview('');
  }, [linkUrl]);

  // Cleanup on unmount
  useEffect(() => () => { stopStream(); }, [stopStream]);

  // For photoOnly mode (venue images), always show file picker regardless of mode
  if (photoOnly) {
    return (
      <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
        <span className="text-xs text-muted-foreground">Upload photo</span>
        <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </label>
    );
  }

  return (
    <div className="space-y-2">
      {/* gallery_cam: both buttons */}
      {mode === 'gallery_cam' && (
        <div className="flex gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 p-3 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-sm text-muted-foreground">
            <Upload className="h-4 w-4" /> Upload from Gallery
            <input type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
          </label>
          <Button variant="outline" className="flex-1" onClick={startCamera}>
            <Camera className="h-4 w-4 mr-2" /> Record with Camera
          </Button>
        </div>
      )}

      {/* cam_only: camera button only */}
      {mode === 'cam_only' && (
        <Button variant="outline" className="w-full" onClick={startCamera}>
          <Camera className="h-4 w-4 mr-2" /> Record with Camera
        </Button>
      )}

      {/* links_only: URL input */}
      {mode === 'links_only' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste YouTube or TikTok URL" className="flex-1" />
            <Button onClick={handleLinkSubmit} disabled={!linkUrl.trim()}>
              <Link className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {linkPreview && <img src={linkPreview} alt="Preview" className="w-32 h-20 object-cover rounded" />}
        </div>
      )}

      {/* Camera modal */}
      <Dialog open={showCamera} onOpenChange={open => { if (!open) { stopStream(); setShowCamera(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Video</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {cameraError ? (
              <div className="text-center py-8">
                <p className="text-sm text-destructive mb-2">Camera Error</p>
                <p className="text-xs text-muted-foreground">{cameraError}</p>
              </div>
            ) : recordedUrl ? (
              <>
                <video src={recordedUrl} controls className="w-full aspect-video rounded-lg bg-black" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={handleReRecord}>Re-record</Button>
                  <Button className="flex-1" onClick={handleUseRecording}>Use This Video</Button>
                </div>
              </>
            ) : (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video rounded-lg bg-black" />
                {recording && (
                  <div className="text-center">
                    <span className="text-sm font-mono text-destructive animate-pulse">● REC </span>
                    <span className="text-sm font-mono text-muted-foreground">{Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
                <div className="flex justify-center">
                  {!recording ? (
                    <Button onClick={startRecording} size="lg" className="rounded-full">
                      <Video className="h-5 w-5 mr-2" /> Record
                    </Button>
                  ) : (
                    <Button onClick={stopRecording} size="lg" variant="destructive" className="rounded-full">
                      <Square className="h-5 w-5 mr-2" /> Stop
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
