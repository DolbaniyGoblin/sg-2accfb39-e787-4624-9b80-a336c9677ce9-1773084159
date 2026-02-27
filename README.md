# Е.Д.С. Личный кабинет 📦

Профессиональный веб-сервис личного кабинета курьера Единой Доставочной Службы.

## 🚀 Технологический стек

- **Frontend**: Next.js 15 (Pages Router), TypeScript, React 18
- **Styling**: Tailwind CSS, shadcn/ui компоненты
- **Backend**: Supabase (Authentication, Database, Storage, Realtime)
- **Maps**: Яндекс.Карты JS API 2.1
- **UI/UX**: Lucide Icons, Sonner (toast notifications)

## 📋 Функционал

### Для курьеров:
- ✅ Авторизация и регистрация
- ✅ Главный дашборд со статистикой
- ✅ Маршрутный лист с вкладками (Утро/День/Вечер)
- ✅ Интерактивная карта доставок с геолокацией
- ✅ Управление текущими коробками
- ✅ История доставок с фотоотчётами
- ✅ Профиль курьера со статистикой
- ✅ Realtime обновления заданий
- ✅ Отслеживание геолокации каждые 30 секунд

## 🛠 Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <your-repo>
cd courier-pro
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Yandex Maps
NEXT_PUBLIC_YANDEX_MAPS_KEY=your_yandex_maps_api_key
```

#### Как получить ключи:

**Supabase:**
1. Зарегистрируйтесь на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Перейдите в Settings → API
4. Скопируйте `Project URL` и `anon/public` ключ

**Yandex Maps:**
1. Перейдите на [developer.tech.yandex.ru](https://developer.tech.yandex.ru/services/3)
2. Зарегистрируйтесь и создайте приложение
3. Подключите JavaScript API и Maps API
4. Скопируйте полученный API ключ

### 4. Настройка базы данных

База данных уже настроена через миграции Supabase. Структура:

- `users` - данные курьеров
- `tasks` - задания на доставку
- `deliveries` - история выполненных доставок
- `locations` - текущая геолокация курьеров

### 5. Настройка Storage

В Supabase создайте bucket с именем `delivery-photos` для хранения фотоотчётов:

1. Storage → Create bucket
2. Имя: `delivery-photos`
3. Public bucket: Yes

### 6. Запуск проекта

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## 📱 Структура проекта

```
src/
├── components/
│   ├── ui/              # shadcn/ui компоненты
│   │   └── Layout.tsx   # Главный layout с навигацией
│   └── YandexMap.tsx    # Компонент карты
├── contexts/
│   ├── AuthContext.tsx  # Контекст авторизации
│   └── ThemeProvider.tsx
├── pages/
│   ├── auth/
│   │   ├── login.tsx    # Страница входа
│   │   └── register.tsx # Страница регистрации
│   ├── index.tsx        # Главная (дашборд)
│   ├── route.tsx        # Маршрутный лист
│   ├── boxes.tsx        # Мои коробки
│   ├── history.tsx      # История доставок
│   └── profile.tsx      # Профиль курьера
├── services/
│   ├── taskService.ts      # CRUD для заданий
│   ├── deliveryService.ts  # Работа с доставками
│   └── locationService.ts  # Геолокация
├── types/
│   └── index.ts         # TypeScript типы
└── lib/
    ├── supabase.ts      # Supabase клиент
    └── utils.ts         # Утилиты

```

## 🎨 Особенности UI/UX

- **Мобильный-first дизайн** - оптимизировано для смартфонов курьеров
- **Тёмная тема по умолчанию** - снижает нагрузку на глаза
- **Нижняя навигация** - удобный доступ одной рукой
- **Плавные анимации** - приятные переходы между состояниями
- **Toast уведомления** - мгновенная обратная связь

## 🔐 Безопасность

- Row Level Security (RLS) политики на всех таблицах
- Защита роутов через middleware
- Безопасное хранение credentials в environment variables
- Валидация данных на клиенте и сервере

## 🚀 Деплой на Vercel

1. Подключите репозиторий к Vercel
2. Добавьте environment variables в настройках проекта
3. Разверните проект

## 📝 Roadmap

- [ ] Push-уведомления при новых заданиях
- [ ] Роль диспетчера с админ-панелью
- [ ] Построение оптимального маршрута
- [ ] Интеграция с платёжными системами
- [ ] Экспорт отчётов в PDF/Excel
- [ ] Мобильное приложение (React Native)

## 🤝 Вклад в проект

Contributions welcome! Пожалуйста, создайте issue или pull request.

## 📄 Лицензия

MIT License

---

Сделано с ❤️ для курьеров