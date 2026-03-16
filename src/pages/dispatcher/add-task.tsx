import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type DeliveryPoint = Database["public"]["Tables"]["delivery_points"]["Row"];

export default function AddTask() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [couriers, setCouriers] = useState<User[]>([]);
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [formData, setFormData] = useState({
    courier_id: "",
    delivery_point_id: "",
    box_count: 1,
    client_name: "",
    client_phone: "",
    delivery_time: "",
    notes: ""
  });

  // Mock data для тестирования
  const MOCK_COURIERS: User[] = [
    {
      id: "mock-courier-1",
      email: "courier1@test.com",
      full_name: "Иван Петров",
      role: "courier",
      status: "active",
      phone: "+7 (999) 111-22-33",
      rating: 4.8,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-courier-2",
      email: "courier2@test.com",
      full_name: "Мария Сидорова",
      role: "courier",
      status: "active",
      phone: "+7 (999) 222-33-44",
      rating: 4.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-courier-3",
      email: "courier3@test.com",
      full_name: "Алексей Козлов",
      role: "courier",
      status: "active",
      phone: "+7 (999) 333-44-55",
      rating: 4.7,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const MOCK_POINTS: DeliveryPoint[] = [
    {
      id: "mock-point-1",
      name: "Точка 1 - Центр",
      address: "ул. Ленина, 10",
      latitude: 55.751244,
      longitude: 37.618423,
      is_active: true,
      contact_person: "Иванов И.И.",
      contact_phone: "+7 (495) 111-22-33",
      working_hours: "9:00-18:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-point-2",
      name: "Точка 2 - Север",
      address: "пр. Мира, 25",
      latitude: 55.769123,
      longitude: 37.638456,
      is_active: true,
      contact_person: "Петрова М.А.",
      contact_phone: "+7 (495) 222-33-44",
      working_hours: "10:00-19:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "mock-point-3",
      name: "Точка 3 - Юг",
      address: "ул. Южная, 5",
      latitude: 55.732456,
      longitude: 37.598789,
      is_active: true,
      contact_person: "Сидоров А.В.",
      contact_phone: "+7 (495) 333-44-55",
      working_hours: "8:00-20:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // MOCK MODE: используем локальные данные вместо Supabase
      console.log("Loading data in MOCK MODE");
      setCouriers(MOCK_COURIERS);
      setPoints(MOCK_POINTS);
      toast.info("MOCK MODE: Загружены тестовые данные");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Ошибка загрузки данных");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courier_id || !formData.delivery_point_id) {
      toast.error("Выберите курьера и точку доставки");
      return;
    }

    setLoading(true);

    try {
      const selectedPoint = points.find(p => p.id === formData.delivery_point_id);
      const selectedCourier = couriers.find(c => c.id === formData.courier_id);
      
      // MOCK MODE: эмулируем создание задания
      console.log("Creating task in MOCK MODE:", {
        courier: selectedCourier?.full_name,
        point: selectedPoint?.name,
        ...formData
      });

      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success("✅ MOCK MODE: Задание успешно создано!");
      router.push("/dispatcher");
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Ошибка создания задания");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold">Создать новое задание</h1>
          <p className="text-muted-foreground">Назначьте доставку курьеру</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Детали задания</CardTitle>
            <CardDescription>Заполните все необходимые поля</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="courier">Курьер *</Label>
                <select
                  id="courier"
                  value={formData.courier_id}
                  onChange={(e) => setFormData({ ...formData, courier_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Выберите курьера</option>
                  {couriers.map((courier) => (
                    <option key={courier.id} value={courier.id}>
                      {courier.full_name || courier.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="point">Точка доставки *</Label>
                <select
                  id="point"
                  value={formData.delivery_point_id}
                  onChange={(e) => setFormData({ ...formData, delivery_point_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Выберите точку доставки</option>
                  {points.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.name} - {point.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="box_count">Количество коробок *</Label>
                <Input
                  id="box_count"
                  type="number"
                  min="1"
                  value={formData.box_count}
                  onChange={(e) => setFormData({ ...formData, box_count: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="client_name">Имя клиента</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <Label htmlFor="client_phone">Телефон клиента</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <Label htmlFor="delivery_time">Время доставки</Label>
                <Input
                  id="delivery_time"
                  type="datetime-local"
                  value={formData.delivery_time}
                  onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация о доставке"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 gap-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Создать задание
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}