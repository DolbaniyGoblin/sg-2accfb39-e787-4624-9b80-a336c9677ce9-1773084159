import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { MapPin, Phone, Package, Navigation, Camera, CheckCircle } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { YandexMap } from "@/components/YandexMap";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Mock data
const MOCK_TASKS: Task[] = [
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
    status: "pending",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    courier_id: "user1",
    client_name: "ИП Смирнов",
    client_phone: "+79007654321",
    address: "пр. Мира, 102",
    latitude: 55.796127,
    longitude: 37.638122,
    boxes_count: 1,
    time_slot: "day",
    scheduled_time: new Date().setHours(14, 30, 0, 0).toString(),
    status: "pending",
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
    status: "pending",
    created_at: new Date().toISOString(),
  },
];

export default function RoutePage() {
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [activeTab, setActiveTab] = useState("morning");

  // Filter tasks by time slot
  const morningTasks = tasks.filter((t) => t.time_slot === "morning");
  const dayTasks = tasks.filter((t) => t.time_slot === "day");
  const eveningTasks = tasks.filter((t) => t.time_slot === "evening");

  const handleDeliveryComplete = (taskId: string) => {
    // Logic to upload photo and update status in Supabase
    setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: "delivered" } : t)));
    toast.success("Доставка завершена!");
    setSelectedTask(null);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={`mb-3 ${task.status === "delivered" ? "opacity-60 bg-muted" : ""}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant={task.status === "delivered" ? "secondary" : "default"}>
            {formatTime(task.scheduled_time)}
          </Badge>
          <span className="text-sm font-medium">{task.boxes_count} кор.</span>
        </div>
        
        <h3 className="font-bold text-lg mb-1">{task.client_name}</h3>
        
        <div className="flex items-start text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
          <span>{task.address}</span>
        </div>

        {task.status !== "delivered" && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(`tel:${task.client_phone}`)}>
              <Phone className="w-4 h-4 mr-2" />
              Позвонить
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Вручить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Завершение доставки</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Фото подтверждение</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                      <Camera className="w-8 h-8 mb-2" />
                      <span>Нажмите для фото</span>
                      <Input type="file" accept="image/*" className="hidden" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Комментарий (опционально)</Label>
                    <Textarea 
                      placeholder="Оставил у консьержа..." 
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleDeliveryComplete(task.id)}>
                    Подтвердить доставку
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout title="Маршрут | КурьерПро">
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Toggle Map/List */}
        <div className="p-2 bg-background border-b z-10 flex justify-between items-center sticky top-0">
          <h1 className="font-bold text-lg px-2">Маршрутный лист</h1>
          <Button variant="ghost" size="sm" onClick={() => setIsMapOpen(!isMapOpen)}>
            {isMapOpen ? "Список" : "Карта"}
            <Navigation className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {isMapOpen ? (
          <div className="flex-1">
            <YandexMap tasks={tasks} />
          </div>
        ) : (
          <div className="p-4 pb-20 overflow-auto">
            <Tabs defaultValue="morning" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="morning">Утро</TabsTrigger>
                <TabsTrigger value="day">День</TabsTrigger>
                <TabsTrigger value="evening">Вечер</TabsTrigger>
              </TabsList>
              
              <TabsContent value="morning" className="space-y-4">
                {morningTasks.length > 0 ? (
                  morningTasks.map((task) => <TaskCard key={task.id} task={task} />)
                ) : (
                  <div className="text-center py-10 text-muted-foreground">Нет доставок на утро</div>
                )}
              </TabsContent>
              
              <TabsContent value="day" className="space-y-4">
                {dayTasks.length > 0 ? (
                  dayTasks.map((task) => <TaskCard key={task.id} task={task} />)
                ) : (
                  <div className="text-center py-10 text-muted-foreground">Нет доставок на день</div>
                )}
              </TabsContent>
              
              <TabsContent value="evening" className="space-y-4">
                {eveningTasks.length > 0 ? (
                  eveningTasks.map((task) => <TaskCard key={task.id} task={task} />)
                ) : (
                  <div className="text-center py-10 text-muted-foreground">Нет доставок на вечер</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  );
}