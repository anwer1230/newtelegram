import { motion } from "framer-motion";
import { Loader2, Bot, Send, Activity } from "lucide-react";
import { useTelegramStatus } from "@/hooks/use-telegram";
import { TelegramLogin } from "@/components/TelegramLogin";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ControlPanel } from "@/components/ControlPanel";
import { GroupsManager } from "@/components/GroupsManager";

export default function Dashboard() {
  const { data: status, isLoading, error } = useTelegramStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-background">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <Bot className="w-16 h-16 text-primary relative z-10" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <h2 className="text-xl font-bold animate-pulse text-muted-foreground">جاري تحميل النظام...</h2>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl max-w-md text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">تعذر الاتصال بالخادم</h2>
          <p className="text-muted-foreground mb-6">يرجى التحقق من تشغيل الخادم وتحديث الصفحة.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }

  if (!status.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background ambient elements */}
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <TelegramLogin />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Background ambient elements */}
      <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex items-center gap-4 mb-10 pb-6 border-b border-white/10">
          <div className="w-14 h-14 bg-gradient-to-tr from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gradient">لوحة تحكم البوت</h1>
            <p className="text-muted-foreground mt-1">نظام المراقبة والإرسال الآلي</p>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <StatusIndicator
            title="حالة الإرسال"
            description="نظام البث الآلي للمجموعات"
            isActive={status.isSenderRunning}
            icon={Send}
          />
          <StatusIndicator
            title="حالة المراقبة"
            description="مراقبة الكلمات المفتاحية والاستماع"
            isActive={status.isMonitorRunning}
            icon={Activity}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 space-y-8"
          >
            <ControlPanel 
              isSenderRunning={status.isSenderRunning} 
              isMonitorRunning={status.isMonitorRunning} 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-5"
          >
            <GroupsManager />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
