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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [couriersRes, pointsRes] = await Promise.all([
        supabase.from("users").select("*").eq("role", "courier").eq("status", "active"),
        supabase.from("delivery_points").select("*").eq("is_active", true)
      ]);

      if (couriersRes.data) setCouriers(couriersRes.data);
      if (pointsRes.data) setPoints(pointsRes.data);
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
      
      const { error } = await supabase.from("tasks").insert({
        courier_id: formData.courier_id,
        delivery_point_id: formData.delivery_point_id,
        address: selectedPoint?.address || "",
        latitude: selectedPoint?.latitude || 0,
        longitude: selectedPoint?.longitude || 0,
        box_count: formData.box_count,
        client_name: formData.client_name,
        client_phone: formData.client_phone,
        delivery_time: formData.delivery_time,
        notes: formData.notes,
        status: "pending"
      });

      if (error) throw error;

      toast.success("Задание успешно создано!");
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