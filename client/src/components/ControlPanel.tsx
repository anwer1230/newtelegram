import { Play, Square, Activity, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTelegramSender, useTelegramMonitor } from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";

interface ControlPanelProps {
  isSenderRunning: boolean;
  isMonitorRunning: boolean;
}

export function ControlPanel({ isSenderRunning, isMonitorRunning }: ControlPanelProps) {
  const senderMutation = useTelegramSender();
  const monitorMutation = useTelegramMonitor();
  const { toast } = useToast();

  const handleSenderToggle = async () => {
    try {
      const action = isSenderRunning ? "stop" : "start";
      await senderMutation.mutateAsync(action);
      toast({
        title: isSenderRunning ? "تم إيقاف الإرسال" : "بدء الإرسال",
        description: `تم ${isSenderRunning ? "إيقاف" : "تشغيل"} مهمة الإرسال المجدول.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  const handleMonitorToggle = async () => {
    try {
      const action = isMonitorRunning ? "stop" : "start";
      await monitorMutation.mutateAsync(action);
      toast({
        title: isMonitorRunning ? "تم إيقاف المراقبة" : "بدء المراقبة",
        description: `تم ${isMonitorRunning ? "إيقاف" : "تشغيل"} مهمة مراقبة المجموعات.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        لوحة التحكم والعمليات
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sender Controls */}
        <div className="p-6 rounded-2xl bg-background/50 border border-white/5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">حملة الإرسال</h4>
              <p className="text-xs text-muted-foreground">الإرسال المجدول للمجموعات</p>
            </div>
          </div>
          
          <Button
            onClick={handleSenderToggle}
            disabled={senderMutation.isPending}
            variant={isSenderRunning ? "destructive" : "default"}
            className={`w-full py-6 text-lg rounded-xl shadow-lg transition-all duration-300 ${
              !isSenderRunning 
                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-blue-500/25" 
                : "hover:shadow-destructive/25"
            }`}
          >
            {isSenderRunning ? (
              <>
                <Square className="w-5 h-5 ml-2 fill-current" />
                إيقاف الإرسال
              </>
            ) : (
              <>
                <Play className="w-5 h-5 ml-2 fill-current" />
                بدء الإرسال
              </>
            )}
          </Button>
        </div>

        {/* Monitor Controls */}
        <div className="p-6 rounded-2xl bg-background/50 border border-white/5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold">المراقبة والاستماع</h4>
              <p className="text-xs text-muted-foreground">مراقبة الكلمات المفتاحية</p>
            </div>
          </div>
          
          <Button
            onClick={handleMonitorToggle}
            disabled={monitorMutation.isPending}
            variant={isMonitorRunning ? "destructive" : "default"}
            className={`w-full py-6 text-lg rounded-xl shadow-lg transition-all duration-300 ${
              !isMonitorRunning 
                ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:shadow-purple-500/25 text-white" 
                : "hover:shadow-destructive/25"
            }`}
          >
            {isMonitorRunning ? (
              <>
                <Square className="w-5 h-5 ml-2 fill-current" />
                إيقاف المراقبة
              </>
            ) : (
              <>
                <Play className="w-5 h-5 ml-2 fill-current" />
                بدء المراقبة
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
