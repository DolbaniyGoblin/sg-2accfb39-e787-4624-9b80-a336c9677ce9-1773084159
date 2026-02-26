import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { Package, MapPin, AlertTriangle, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Mock data for boxes currently in possession (picked up but not delivered)
const MOCK_MY_BOXES: Task[] = [
  {
    id: "1",
    courier_id: "user1",
    client_name: "ООО 'ТехноМир'",
    client_phone: "+79001234567",
    address: "ул. Ленина, 45, оф. 203",
    latitude: 55.751244,
    longitude: 37.618423,
    boxes_count: 3,
    time_slot: "morning",
    scheduled_time: new Date().setHours(10, 0, 0, 0).toString(),
    status: "in_progress",
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    courier_id: "user1",
    client_name: "Кафе 'Уют'",
    client_phone: "+79005554433",
    address: "ул. Тверская, 12",
    latitude: 55.760221,
    longitude: 37.611311,
    boxes_count: 5,
    time_slot: "evening",
    scheduled_time: new Date().setHours(19, 0, 0, 0).toString(),
    status: "in_progress",
    created_at: new Date().toISOString(),
  },
];

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Task[]>(MOCK_MY_BOXES);
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const reportProblem = () => {
    if (!selectedTask) return;
    
    // Logic to report problem to Supabase
    setBoxes(boxes.map(b => b.id === selectedTask ? { ...b, status: "problem" } : b));
    toast.error("Проблема зафиксирована, диспетчер уведомлен");
    setProblemDescription("");
    setSelectedTask(null);
  };

  return (
    <Layout title="Мои коробки | КурьерПро">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold mb-4">Коробки на руках</h1>

        {boxes.length > 0 ? (
          boxes.map((task) => (
            <Card key={task.id} className="border-l-4 border-l-blue-500 shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-lg">{task.boxes_count} шт.</span>
                  </div>
                  <Badge variant="outline">{formatTime(task.scheduled_time)}</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-start text-sm">
                    <span className="font-semibold min-w-[60px]">Клиент:</span>
                    <span>{task.client_name}</span>
                  </div>
                  <div className="flex items-start text-sm">
                    <span className="font-semibold min-w-[60px]">Адрес:</span>
                    <span className="flex-1">{task.address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Проблема
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Сообщить о проблеме</DialogTitle>
                        <DialogDescription>
                          Опишите, что случилось с грузом или почему доставка невозможна
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Описание проблемы</Label>
                          <Textarea 
                            placeholder="Коробка повреждена / Клиент не выходит на связь..." 
                            value={problemDescription}
                            onChange={(e) => setProblemDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button variant="destructive" className="w-full" onClick={() => {
                          setSelectedTask(task.id);
                          reportProblem();
                        }}>
                          Отправить отчет
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <MapPin className="w-4 h-4 mr-2" />
                    Маршрут
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-80" />
            <h3 className="font-semibold text-lg">Все чисто!</h3>
            <p className="text-muted-foreground">У вас нет активных коробок на руках</p>
          </div>
        )}
      </div>
    </Layout>
  );
}