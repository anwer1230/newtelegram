import { useState } from "react";
import { Plus, Trash2, Link as LinkIcon, Loader2, Users } from "lucide-react";
import { useGroups, useCreateGroup, useDeleteGroup } from "@/hooks/use-groups";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function GroupsManager() {
  const [newGroupUrl, setNewGroupUrl] = useState("");
  const { data: groups = [], isLoading } = useGroups();
  const createMutation = useCreateGroup();
  const deleteMutation = useDeleteGroup();
  const { toast } = useToast();

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupUrl.trim()) return;

    try {
      await createMutation.mutateAsync(newGroupUrl);
      setNewGroupUrl("");
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة رابط المجموعة بنجاح.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "تم الحذف",
        description: "تم إزالة المجموعة من القائمة.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          المجموعات الإضافية
        </h3>
        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
          {groups.length} روابط
        </span>
      </div>

      <form onSubmit={handleAddGroup} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={newGroupUrl}
            onChange={(e) => setNewGroupUrl(e.target.value)}
            placeholder="https://t.me/example"
            className="pl-4 pr-10 py-5 rounded-xl bg-background/50 border-white/10 text-left"
            dir="ltr"
            disabled={createMutation.isPending}
          />
        </div>
        <Button
          type="submit"
          className="py-5 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95"
          disabled={!newGroupUrl.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 ml-1" />
              إضافة
            </>
          )}
        </Button>
      </form>

      <div className="flex-1 bg-background/30 rounded-2xl border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 opacity-50" />
            </div>
            <p>لا توجد روابط إضافية مسجلة</p>
            <p className="text-sm mt-1 opacity-70">أضف روابط لتوسيع نطاق الإرسال</p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 py-2">
            <div className="space-y-2 pb-4 pt-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-white/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group/item"
                >
                  <div className="flex-1 truncate dir-ltr text-left font-medium text-sm text-muted-foreground mr-4">
                    {group.url}
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-50 group-hover/item:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl" dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                        <AlertDialogDescription>
                          هل أنت متأكد من حذف الرابط {group.url}؟ لن يتم الإرسال إليه مجدداً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 sm:justify-start">
                        <AlertDialogAction
                          onClick={() => handleDeleteGroup(group.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          نعم، احذف
                        </AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl mt-0">إلغاء</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
