import { useEffect, useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Package, MapPin, Clock, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { notificationService } from "@/services/notificationService";

interface MyBox {
  id: string;
  task_id: string;
  tracking_number: string;
  pickup_address: string;
  delivery_address: string;
  recipient_name: string;
  recipient_phone: string;
  boxes_count: number;
  status: string;
  picked_up_at: string;
  expected_delivery: string;
  notes?: string;
}

export default function MyBoxes() {
  const { user } = useAuth();
  const [boxes, setBoxes] = useState<MyBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [problemText, setProblemText] = useState("");
  const [selectedBox, setSelectedBox] = useState<MyBox | null>(null);

  useEffect(() => {
    if (user) {
      fetchBoxes();
      
      const subscription = supabase
        .channel('my_boxes_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'my_boxes', filter: `courier_id=eq.${user.id}` },
          () => fetchBoxes()
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchBoxes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('my_boxes')
        .select(`
          *,
          tasks:task_id (*)
        `)
        .eq('courier_id', user.id)
        .eq('status', 'in_transit');

      if (error) throw error;
      
      const formattedBoxes: MyBox[] = (data || []).map((box: any) => {
        const task = Array.isArray(box.tasks) ? box.tasks[0] : box.tasks;
        return {
          id: box.id,
          task_id: box.task_id,
          tracking_number: `BOX-${box.id.substring(0, 6).toUpperCase()}`,
          pickup_address: "Главный склад",
          delivery_address: task?.address || "Нет адреса",
          recipient_name: task?.client_name || "Клиент",
          recipient_phone: task?.client_phone || "",
          boxes_count: box.box_count || 1,
          status: box.status,
          picked_up_at: box.picked_up_at,
          expected_delivery: task?.scheduled_time || box.picked_up_at,
          notes: box.notes
        };
      });
      
      setBoxes(formattedBoxes);
    } catch (error) {
      console.error("Error fetching boxes:", error);
      toast.error("Ошибка загрузки коробок");
    } finally {
      setLoading(false);
    }
  };

  const handleDelivered = async (boxId: string) => {
    try {
      const { error } = await supabase
        .from('my_boxes')
        .update({ 
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', boxId);

      if (error) throw error;

      toast.success("✅ Коробка доставлена!");
      notificationService.playSound("success");
      fetchBoxes();
    } catch (error) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const handleProblem = async () => {
    if (!selectedBox || !problemText.trim()) return;
    
    try {
      const { error } = await supabase
        .from('my_boxes')
        .update({ 
          status: 'problem',
          notes: problemText
        })
        .eq('id', selectedBox.id);

      if (error) throw error;

      toast.error("Проблема зафиксирована");
      notificationService.playSound("error");
      setProblemText("");
      setSelectedBox(null);
      fetchBoxes();
    } catch (error) {
      toast.error("Ошибка отправки");
    }
  };

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4">Загрузка коробок...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Мои коробки | КурьерПро PRO">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="p-4 max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" />
              Мои коробки
            </h1>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {boxes.length}
            </Badge>
          </div>

          {boxes.length > 0 ? (
            <div className="space-y-3">
              {boxes.map((box) => (
                <Card key={box.id} className="hover-lift card-appear">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{box.recipient_name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          #{box.tracking_number}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {box.boxes_count} кор.
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Откуда</p>
                          <p className="line-clamp-1">{box.pickup_address}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Куда</p>
                          <p className="line-clamp-1">{box.delivery_address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Взято: {formatTime(box.picked_up_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          До: {formatTime(box.expected_delivery)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDelivered(box.id)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Доставлено
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={() => setSelectedBox(box)}
                          >
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Проблема
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Сообщить о проблеме</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Textarea 
                              placeholder="Опишите проблему..."
                              value={problemText}
                              onChange={(e) => setProblemText(e.target.value)}
                              rows={4}
                            />
                            <Button 
                              className="w-full"
                              onClick={handleProblem}
                              disabled={!problemText.trim()}
                            >
                              Отправить
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Нет активных коробок</h3>
                <p className="text-muted-foreground text-sm">
                  У вас сейчас нет коробок в доставке
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}