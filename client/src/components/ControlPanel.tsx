import { Play, Square, Activity, Send, Link, Search, Copy, ExternalLink, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  useTelegramSender, 
  useTelegramMonitor, 
  useTelegramJoinLinks, 
  useTelegramSearch, 
  useTelegramJoinChat,
  useMessageText,
  useUpdateMessageText
} from "@/hooks/use-telegram";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ControlPanelProps {
  isSenderRunning: boolean;
  isMonitorRunning: boolean;
}

export function ControlPanel({ isSenderRunning, isMonitorRunning }: ControlPanelProps) {
  const senderMutation = useTelegramSender();
  const monitorMutation = useTelegramMonitor();
  const joinLinksMutation = useTelegramJoinLinks();
  const searchMutation = useTelegramSearch();
  const joinChatMutation = useTelegramJoinChat();
  const { data: messageSetting } = useMessageText();
  const updateMessageMutation = useUpdateMessageText();
  
  const { toast } = useToast();
  
  const [linksText, setLinksText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editingMessage, setEditingMessage] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (messageSetting?.value) {
      setEditingMessage(messageSetting.value);
    }
  }, [messageSetting]);

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

  const handleJoinLinks = async () => {
    try {
      const res = await joinLinksMutation.mutateAsync(linksText);
      toast({
        title: "تم بدء الانضمام",
        description: `تم العثور على ${res.linksFound.length} رابط وبدء عملية الانضمام.`,
      });
      setLinksText("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  const handleSearch = async () => {
    try {
      const results = await searchMutation.mutateAsync(searchKeyword);
      setSearchResults(results);
      if (results.length === 0) {
        toast({ title: "لا توجد نتائج", description: "لم يتم العثور على مجموعات تطابق الكلمة." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  const handleJoinChat = async (link: string) => {
    try {
      await joinChatMutation.mutateAsync(link);
      toast({ title: "تم بنجاح", description: "تم الانضمام للمجموعة بنجاح." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  const handleSaveMessage = async () => {
    try {
      await updateMessageMutation.mutateAsync(editingMessage);
      toast({ title: "تم الحفظ", description: "تم تحديث نص الرسالة بنجاح." });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ", description: error.message });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ", description: "تم نسخ الرابط للحافظة." });
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            لوحة التحكم والعمليات
          </h3>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                تعديل رسالة الإرسال
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-right">تعديل نص الرسالة التلقائية</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Textarea 
                  className="min-h-[300px] rounded-2xl text-right dir-rtl"
                  value={editingMessage}
                  onChange={(e) => setEditingMessage(e.target.value)}
                  placeholder="اكتب نص الرسالة هنا..."
                />
                <Button 
                  className="w-full rounded-xl flex items-center gap-2" 
                  onClick={handleSaveMessage}
                  disabled={updateMessageMutation.isPending}
                >
                  <Save className="w-4 h-4" />
                  حفظ التعديلات
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
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

      {/* New Features Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Join Links Section */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            انضمام جماعي للروابط
          </h3>
          <p className="text-sm text-muted-foreground">الصق نصاً يحتوي على روابط تليجرام وسيتم استخراجها والانضمام إليها تلقائياً.</p>
          <Textarea 
            placeholder="لصق الروابط هنا..."
            className="min-h-[150px] rounded-xl"
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
          />
          <Button 
            className="w-full rounded-xl"
            onClick={handleJoinLinks}
            disabled={joinLinksMutation.isPending || !linksText}
          >
            استخراج وانضمام للروابط
          </Button>
        </div>

        {/* Search Groups Section */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            البحث عن مجموعات عامة
          </h3>
          <p className="text-sm text-muted-foreground">ابحث عن مجموعات وقنوات جديدة باستخدام كلمات مفتاحية.</p>
          <div className="flex gap-2">
            <Input 
              placeholder="مثال: تعليم السعودية"
              className="rounded-xl"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searchMutation.isPending} className="rounded-xl">بحث</Button>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {searchResults.map((group, idx) => (
              <Card key={idx} className="p-4 bg-background/50 border-white/5 flex items-center justify-between gap-4">
                <div className="overflow-hidden">
                  <h4 className="font-bold truncate">{group.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{group.link}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(group.link)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => handleJoinChat(group.link)} disabled={joinChatMutation.isPending}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
