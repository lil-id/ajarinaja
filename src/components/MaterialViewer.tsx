import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download, ExternalLink, X, FileText, File, Video, FileImage } from 'lucide-react';
import { getMaterialSignedUrl, extractYouTubeId } from '@/hooks/useCourseMaterials';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  material: {
    id: string;
    title: string;
    file_path: string | null;
    file_name: string | null;
    file_type: string | null;
    video_url: string | null;
  } | null;
}

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return File;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('image/')) return FileImage;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

export const MaterialViewer = ({ isOpen, onClose, material }: MaterialViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!material?.file_path) {
        setSignedUrl(null);
        return;
      }
      
      setIsLoading(true);
      const url = await getMaterialSignedUrl(material.file_path);
      setSignedUrl(url);
      setIsLoading(false);
    };

    if (isOpen && material) {
      fetchUrl();
    }

    return () => {
      setSignedUrl(null);
    };
  }, [isOpen, material?.file_path]);

  const handleDownload = async () => {
    if (!material?.file_path || !material.file_name) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .download(material.file_path);
      
      if (error) {
        toast.error('Failed to download material');
        return;
      }
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download material');
    }
  };

  if (!material) return null;

  const isVideo = !!material.video_url;
  const youtubeId = isVideo ? extractYouTubeId(material.video_url!) : null;
  const isPdf = material.file_type?.includes('pdf');
  const isImage = material.file_type?.startsWith('image/');
  const isVideoFile = material.file_type?.startsWith('video/');
  const FileIcon = isVideo ? Video : getFileIcon(material.file_type);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      );
    }

    // YouTube video
    if (youtubeId) {
      return (
        <div className="aspect-video w-full">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={material.title}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // PDF viewer
    if (isPdf && signedUrl) {
      return (
        <iframe
          src={`${signedUrl}#toolbar=1&navpanes=0`}
          title={material.title}
          className="w-full h-[70vh] rounded-lg border"
        />
      );
    }

    // Image viewer
    if (isImage && signedUrl) {
      return (
        <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
          <img
            src={signedUrl}
            alt={material.title}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
          />
        </div>
      );
    }

    // Video file
    if (isVideoFile && signedUrl) {
      return (
        <video
          src={signedUrl}
          controls
          autoPlay
          className="w-full max-h-[70vh] rounded-lg"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <FileIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-2">Preview not available</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This file type cannot be previewed in the browser.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {signedUrl && (
              <Button onClick={() => window.open(signedUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-row items-center justify-between pr-8">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon className="w-5 h-5 text-secondary" />
            {material.title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {material.file_path && (
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="overflow-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialViewer;
