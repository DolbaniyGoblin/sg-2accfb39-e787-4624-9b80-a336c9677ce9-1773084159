import { Layout } from "@/components/ui/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Package, Users, Shield, MapPin, History, User } from "lucide-react";

export default function RoleSelector() {
  return (
    <Layout title="Выбор роли | КурьерПро PRO">
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              КурьерПро PRO
            </h1>
            <p className="text-muted-foreground">
              Демонстрация интерфейсов всех ролей
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold">
              ⚠️ Авторизация временно отключена
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Courier Role */}
            <Card className="border-2 hover:border-primary hover:shadow-xl transition-all hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-center">Курьер</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Интерфейс для курьеров доставки
                </p>
                <div className="space-y-2">
                  <Link href="/courier-dashboard" className="block">
                    <Button className="w-full" size="lg">
                      <MapPin className="w-4 h-4 mr-2" />
                      Дашборд курьера
                    </Button>
                  </Link>
                  <Link href="/route" className="block">
                    <Button variant="outline" className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Маршрут
                    </Button>
                  </Link>
                  <Link href="/boxes" className="block">
                    <Button variant="outline" className="w-full">
                      <Package className="w-4 h-4 mr-2" />
                      Мои коробки
                    </Button>
                  </Link>
                  <Link href="/history" className="block">
                    <Button variant="outline" className="w-full">
                      <History className="w-4 h-4 mr-2" />
                      История
                    </Button>
                  </Link>
                  <Link href="/profile" className="block">
                    <Button variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Профиль
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Dispatcher Role */}
            <Card className="border-2 hover:border-blue-500 hover:shadow-xl transition-all hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-center">Диспетчер</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Управление заданиями и курьерами
                </p>
                <div className="space-y-2">
                  <Link href="/dispatcher" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                      <Users className="w-4 h-4 mr-2" />
                      Панель диспетчера
                    </Button>
                  </Link>
                  <Link href="/dispatcher/add-task" className="block">
                    <Button variant="outline" className="w-full">
                      <Package className="w-4 h-4 mr-2" />
                      Добавить задание
                    </Button>
                  </Link>
                  <Link href="/dispatcher/live-map" className="block">
                    <Button variant="outline" className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      Карта курьеров
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Admin Role */}
            <Card className="border-2 hover:border-red-500 hover:shadow-xl transition-all hover-lift">
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-center">Администратор</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Управление системой и пользователями
                </p>
                <div className="space-y-2">
                  <Link href="/admin" className="block">
                    <Button className="w-full bg-red-600 hover:bg-red-700" size="lg">
                      <Shield className="w-4 h-4 mr-2" />
                      Панель админа
                    </Button>
                  </Link>
                  <Link href="/admin/reset-password-tool" className="block">
                    <Button variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Управление паролями
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Note */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <p className="text-sm text-center text-muted-foreground">
                💡 <strong>Подсказка:</strong> Все интерфейсы работают в демо-режиме без авторизации. 
                Данные загружаются из Supabase в реальном времени.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}