// Browser Push Notifications Service
import { supabase } from "@/integrations/supabase/client";

export const notificationService = {
  // Request permission for browser notifications
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  },

  // Show a notification
  async showNotification(title: string, options?: NotificationOptions) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log("Notification permission denied");
      return;
    }

    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      // @ts-expect-error - vibrate is standard but missing in some TS definitions
      vibrate: [200, 100, 200],
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  },

  // Notify about new task
  async notifyNewTask(taskAddress: string, boxCount: number) {
    return this.showNotification("🚚 Новое задание!", {
      body: `📍 ${taskAddress}\n📦 Коробок: ${boxCount}`,
      tag: "new-task",
      requireInteraction: true,
    });
  },

  // Notify about task deadline
  async notifyTaskDeadline(taskAddress: string, minutesLeft: number) {
    return this.showNotification("⏰ Скоро дедлайн!", {
      body: `📍 ${taskAddress}\n⏱️ Осталось ${minutesLeft} минут`,
      tag: "deadline",
      requireInteraction: true,
    });
  },

  // Notify about all tasks completed
  async notifyAllTasksCompleted(totalTasks: number) {
    return this.showNotification("🎉 Все задания выполнены!", {
      body: `Отлично! Сегодня доставлено: ${totalTasks} заданий`,
      tag: "completed",
    });
  },

  // Subscribe to new tasks for courier
  subscribeToNewTasks(courierId: string, callback: (task: any) => void) {
    const channel = supabase
      .channel(`courier_tasks_${courierId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `courier_id=eq.${courierId}`,
        },
        (payload) => {
          const task = payload.new;
          this.notifyNewTask(task.address || "Новая точка", task.box_count || 0);
          callback(task);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // Play sound notification
  playSound(type: "success" | "error" | "info" = "info") {
    const audio = new Audio();
    
    // Simple beep sounds using data URLs
    const sounds = {
      success: "data:audio/wav;base64,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",
      error: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxHMpBSp+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAYuhM/z1YU2Bhxqvu7mnEoPD1Oo5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOAgZaLvt559NEAxPpuPwtmQcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7+OaSQ0PVqzn77BdGAg+ltryxHQpBSp9y/LaizsIGGS56+mjUREKTKXh8bllHAU1jdT0zn4wBSJ0xe/glEILElyx6OyrWRUIRJvd8sFuJAYuhM/z1YU2Bhxqvu7mnEoPDlOn5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMTC0mi4PK8aB8GM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYELH/O8diJOQgZZ7zs56BODwxPpuPwtmQcBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHW/A7+OaSQ0PVqvm77BeGQc9ltvyxHUpBSp9y/LajDsIGGS56+mjUhEKTKPi8LllHAU1jdT0zn4wBSJ0xe/glEMLEVux6eyrWRUJQ5vd88FwJAYug8/z1YY2Bhxqvu3mnEwODlOn5O+zYRsGPJLZ88p3LAUle8rx3I8+CRVht+rqpVMTC0mh4fK8aiAFM4nU8tGBMQYfccPu45ZGCxFYr+ftrVwWCECY3PLEciUELH/O8diJOQgZZ7zs56BODwxPpuPwtmQdBTiP1/PMeywGI3fH8d+RQQkUXrPq66hWEwlGnt/yv2wiBDCG0fPTgzQGHW/A7+OaSQ0PVqvm77BeGQc9ltvyxHUpBSp9y/LajDsIGGS56+mjUhEKTKPi8LllHAU1jdT0zn4wBSJ0xe/glEMLEVux6eyrWRUJQ5vd88FwJAYug8/z1YY2Bhxqvu3mnEwODlOn5O+zYRsGPJLZ88p3LAUle8rx3I8+",
      info: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxHMpBSp+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAYuhM/z1YU2Bhxqvu7mnEoPD1Oo5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOAgZaLvt559NEAxPpuPwtmQcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7+OaSQ0PVqzn77BdGAg+ltryxHQpBSp9y/LaizsIGGS56+mjUREKTKXh8bllHAU1jdT0zn4wBSJ0xe/glEILElyx6OyrWRUIRJvd8sFuJAYuhM/z1YU2Bhxqvu7mnEoPDlOn5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMTC0mi4PK8aB8GM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYELH/O8diJOQgZZ7zs56BODwxPpuPwtmQcBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHW/A7+OaSQ0PVqvm77BeGQc9ltvyxHUpBSp9y/LajDsIGGS56+mjUhEKTKPi8LllHAU1jdT0zn4wBSJ0xe/glEMLEVux6eyrWRUJQ5vd88FwJAYug8/z1YY2Bhxqvu3mnEwODlOn5O+zYRsGPJLZ88p3LAUle8rx3I8+",
    };

    audio.src = sounds[type];
    audio.play().catch(() => {
      console.log("Could not play sound");
    });
  },
};