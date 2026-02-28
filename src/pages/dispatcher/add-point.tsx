import { useState } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ArrowLeft, Save, MapPin } from "lucide-react";

export default function AddPoint() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    contact_person: "",
    contact_phone: "",
    working_hours: "",
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("delivery_points").insert({
        name: formData.name,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        working_hours: formData.working_hours || null,
        notes: formData.notes || null,
        is_active: true
      });

      if (error) throw error;

      toast.success("Точка доставки успешно добавлена!");
      router.push("/dispatcher");
    } catch (error) {
      console.error("Error creating point:", error);
      toast.error("Ошибка создания точки доставки");
    } finally {
      setLoading(false);
    }
  };

  const getCoordinatesFromAddress = async () => {
    if (!formData.address) {
      toast.error("Введите адрес");
      return;
    }

    toast.info("Поиск координат по адресу...");
    
    // В реальном приложении здесь будет использоваться Yandex Geocoder API
    // Для демонстрации используем фиксированные координаты Москвы
    toast.warning("Функция геокодирования в разработке. Введите координаты вручную.");
  };

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Добавить точку доставки
          </h1>
          <p className="text-muted-foreground">Создайте новую точку для заданий</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Информация о точке</CardTitle>
            <CardDescription>Укажите адрес и контактные данные</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Название точки *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Склад №1, Офис компании, Магазин..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Адрес *</Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="г. Москва, ул. Ленина, д. 1"
                    required
                  />
                  <Button type="button" variant="outline" onClick={getCoordinatesFromAddress}>
                    Найти
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Нажмите "Найти" для автоматического определения координат
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Широта *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="55.751244"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Долгота *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="37.618423"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact_person">Контактное лицо</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Телефон</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <Label htmlFor="working_hours">Часы работы</Label>
                <Input
                  id="working_hours"
                  value={formData.working_hours}
                  onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                  placeholder="Пн-Пт 9:00-18:00"
                />
              </div>

              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Дополнительная информация о точке"
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
                  Добавить точку
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