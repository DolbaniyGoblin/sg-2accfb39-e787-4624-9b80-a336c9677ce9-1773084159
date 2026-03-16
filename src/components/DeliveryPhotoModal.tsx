import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import confetti from "@/lib/confetti";

interface DeliveryPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  courierId: string;
  onSuccess: () => void;
}

export function DeliveryPhotoModal({
  isOpen,
  onClose,
  taskId,
  courierId,
  onSuccess,
}: DeliveryPhotoModalProps) {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Ошибка",
          description: "Размер фото не должен превышать 5 МБ",
          variant: "destructive",
        });
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast({
        title: "Ошибка",
        description: "Необходимо загрузить фото доставки",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload photo to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${courierId}/${taskId}/${timestamp}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("delivery-photos")
        .upload(fileName, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("delivery-photos")
        .getPublicUrl(fileName);

      // Update task status
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status: "delivered",
          photo_url: urlData.publicUrl,
          completed_at: new Date().toISOString(),
          comment: comment || null,
        })
        .eq("id", taskId);

      if (updateError) throw updateError;

      // Create notification for dispatcher
      await supabase.from("notifications").insert({
        user_id: courierId,
        type: "task_completed",
        title: "Доставка выполнена",
        message: `Задание завершено с фотоотчетом`,
        read: false,
      });

      // Show confetti animation
      confetti();

      toast({
        title: "✅ Доставка завершена!",
        description: "Фотоотчет успешно загружен",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setPhoto(null);
    setPreview(null);
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Подтверждение доставки
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Фото доставки *</label>
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border-2 border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Нажмите для загрузки фото
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Максимум 5 МБ
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Комментарий (опционально)</label>
            <Textarea
              placeholder="Добавьте комментарий к доставке..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={uploading || !photo}>
            {uploading ? "Загрузка..." : "✅ Подтвердить доставку"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}