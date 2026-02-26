import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Delivery } from "@/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Package, MapPin, Image as ImageIcon, FileText } from "lucide-react";
import { formatTime, formatDate } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function HistoryPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          tasks (
            client_name,
            address,
            boxes_count,
            scheduled_time
          )
        `)
        .eq("courier_id", user?.id)
        .order("delivered_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const todayDeliveries = deliveries.filter(
    (d) => new Date(d.delivered_at).toDateString() === new Date().toDateString()
  );

  const allDeliveries = deliveries;

  const DeliveryCard = ({ delivery }: { delivery: Delivery }) => {
    const task = (delivery as any).tasks;
    
    return (
      <Card className="mb-3 shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <Badge variant="secondary">{formatTime(delivery.delivered_at)}</Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {formatDate(delivery.delivered_at)}
            </span>
          </div>

          <h3 className="font-bold mb-1">{task?.client_name || "Клиент"}</h3>
          
          <div className="flex items-start text-sm text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 mr-1 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{task?.address || "Адрес не указан"}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Package className="w-4 h-4 mr-1" />
              <span>{task?.boxes_count || 0} коробок</span>
            </div>

            <div className="flex gap-2">
              {delivery.photo_url && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="w-4 h-4 mr-1" />
                      Фото
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Фото доставки</DialogTitle>
                    </DialogHeader>
                    <img
                      src={delivery.photo_url}
                      alt="Delivery proof"
                      className="w-full rounded-lg"
                    />
                  </DialogContent>
                </Dialog>
              )}
              
              {delivery.notes && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Заметка
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Комментарий к доставке</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm">{delivery.notes}</p>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="История | КурьерПро">
      <div className="p-4 space-y-4">
        <h1 className="text-xl font-bold mb-4">История доставок</h1>

        <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="today">
              <Calendar className="w-4 h-4 mr-2" />
              Сегодня
            </TabsTrigger>
            <TabsTrigger value="all">Всё время</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayDeliveries.length > 0 ? (
              <>
                <div className="bg-primary/10 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{todayDeliveries.length}</p>
                    <p className="text-sm text-muted-foreground">доставок завершено сегодня</p>
                  </div>
                </div>
                {todayDeliveries.map((delivery) => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">Сегодня доставок ещё не было</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allDeliveries.length > 0 ? (
              <>
                <div className="bg-primary/10 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{allDeliveries.length}</p>
                    <p className="text-sm text-muted-foreground">доставок за всё время</p>
                  </div>
                </div>
                {allDeliveries.map((delivery) => (
                  <DeliveryCard key={delivery.id} delivery={delivery} />
                ))}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">История доставок пуста</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}