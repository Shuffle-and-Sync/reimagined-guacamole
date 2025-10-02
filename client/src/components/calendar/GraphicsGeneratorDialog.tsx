import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface GraphicsGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}

const TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
  { id: 'classic', name: 'Classic', description: 'Traditional event poster style' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  { id: 'square', name: 'Square', description: 'Perfect for Instagram' },
];

export function GraphicsGeneratorDialog({
  isOpen,
  onClose,
  eventId,
  eventTitle,
}: GraphicsGeneratorDialogProps) {
  const [template, setTemplate] = useState('modern');
  const [includeQR, setIncludeQR] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/graphics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          eventId,
          template,
          includeQR,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate graphic');
      }

      const data = await response.json();
      setGeneratedImage(data.dataUrl);

      toast({
        title: 'Graphic Generated!',
        description: 'Your promotional graphic is ready to download',
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate graphic',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${eventTitle.replace(/\s+/g, '-')}-${template}.svg`;
    link.click();
  };

  const handleClose = () => {
    setGeneratedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Promotional Graphic</DialogTitle>
          <DialogDescription>
            Create a custom promotional graphic for {eventTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template Style</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QR Code Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include QR Code</Label>
              <div className="text-sm text-muted-foreground">
                Add a scannable QR code for easy RSVP
              </div>
            </div>
            <Switch checked={includeQR} onCheckedChange={setIncludeQR} />
          </div>

          {/* Preview */}
          {generatedImage && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <Label className="mb-2 block">Preview</Label>
              <img
                src={generatedImage}
                alt="Generated graphic"
                className="w-full rounded border"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {generatedImage ? (
              <Button onClick={handleDownload}>
                <i className="fas fa-download mr-2"></i>
                Download
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-wand-magic-sparkles mr-2"></i>
                    Generate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
