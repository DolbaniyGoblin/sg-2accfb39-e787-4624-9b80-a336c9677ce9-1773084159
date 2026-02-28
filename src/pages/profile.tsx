import { useState, useEffect } from "react";
import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { LogOut, Star, Calendar, Phone, Mail, Package, TrendingUp, Award, Shield, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    monthDeliveries: 0,
    monthEarnings: 0,
    avgRating: 5.0,
  });

  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchDbUser();
    }
  }, [user]);

  const fetchDbUser = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) setDbUser(data);
  };

  const fetchUserStats = async () => {
    // В реальном приложении здесь будет запрос к Supabase
    // Для демонстрации используем моковые данные
    setStats({
      totalDeliveries: 247,
      monthDeliveries: 42,
      monthEarnings: 18500,
      avgRating: user?.rating || 5.0,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Вы вышли из аккаунта");
      router.push("/auth/login");
    } catch (error) {
      toast.error("Ошибка при выходе");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Layout title="Профиль | КурьерПро">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card className="border-primary/20 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                <AvatarImage src={user?.photo_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {user?.full_name ? getInitials(user.full_name) : "КП"}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold mb-1">{user?.full_name}</h2>
              <p className="text-sm text-muted-foreground mb-4">ID: {user?.id.slice(0, 8)}</p>

              {dbUser?.role && (
                <Badge className="mb-4" variant={
                  dbUser.role === 'admin' ? 'destructive' : 
                  dbUser.role === 'dispatcher' ? 'default' : 'secondary'
                }>
                  {dbUser.role === 'admin' && '👑 Администратор'}
                  {dbUser.role === 'dispatcher' && '📋 Диспетчер'}
                  {dbUser.role === 'courier' && '🚚 Курьер'}
                </Badge>
              )}

              <div className="flex flex-col gap-2 w-full mb-4">
                {(dbUser?.role === 'admin' || dbUser?.role === 'dispatcher') && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-primary/50"
                    onClick={() => router.push('/dispatcher')}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Панель Диспетчера
                  </Button>
                )}
                
                {dbUser?.role === 'admin' && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-red-500/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => router.push('/admin')}
                  >
                    <Shield className="w-4 h-4 text-red-500" />
                    Панель Администратора
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 text-yellow-600 mr-1 fill-yellow-600" />
                  <span className="font-bold text-yellow-600">{user?.rating.toFixed(1)}</span>
                </div>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {user?.experience_months} мес. стажа
                </Badge>
              </div>

              <div className="flex flex-col gap-2 w-full text-left">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {user?.email}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  {user?.phone}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Статистика за месяц
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.monthDeliveries}</p>
                <p className="text-xs text-muted-foreground">Доставок</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.monthEarnings.toLocaleString()}₽</p>
                <p className="text-xs text-muted-foreground">Заработано</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Time Stats */}
        <Card>
          <CardHeader>
            <CardTitle>За всё время</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Всего доставок</span>
                <span className="font-bold text-lg">{stats.totalDeliveries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Средний рейтинг</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                  <span className="font-bold text-lg">{stats.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="destructive"
          className="w-full"
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    </Layout>
  );
}