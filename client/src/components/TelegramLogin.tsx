import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Lock, KeyRound, Phone, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useTelegramLogin,
  useTelegramVerifyCode,
  useTelegramVerifyPassword,
} from "@/hooks/use-telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthStep = "PHONE" | "CODE" | "PASSWORD";

export function TelegramLogin() {
  const [step, setStep] = useState<AuthStep>("PHONE");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const { toast } = useToast();

  const loginMutation = useTelegramLogin();
  const verifyCodeMutation = useTelegramVerifyCode();
  const verifyPasswordMutation = useTelegramVerifyPassword();

  const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;
    if (!phone) return;

    try {
      const res = await loginMutation.mutateAsync(phone);
      setPhoneNumber(phone);
      setPhoneCodeHash(res.phoneCodeHash);
      setStep("CODE");
      toast({
        title: "تم الإرسال",
        description: "تم إرسال كود التحقق إلى حسابك في تيليجرام.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get("code") as string;
    if (!code) return;

    try {
      const res = await verifyCodeMutation.mutateAsync({
        phoneNumber,
        phoneCodeHash,
        code,
      });
      if (res.needsPassword) {
        setStep("PASSWORD");
        toast({
          title: "التحقق بخطوتين",
          description: "يرجى إدخال كلمة المرور الخاصة بحسابك.",
        });
      } else {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في لوحة التحكم.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    if (!password) return;

    try {
      await verifyPasswordMutation.mutateAsync(password);
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة التحكم.",
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-primary/20 relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <Send className="w-10 h-10 text-primary -ml-1 mt-1" />
        </div>
        <h1 className="text-3xl font-bold text-gradient mb-2">تسجيل الدخول</h1>
        <p className="text-muted-foreground">اربط حساب تيليجرام للبدء بإدارة البوت</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          {step === "PHONE" && (
            <motion.form
              key="phone"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handlePhoneSubmit}
              className="space-y-6 relative"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+96659xxxxxxx"
                    className="pl-4 pr-12 py-6 text-lg rounded-2xl bg-background/50 border-white/10 focus:ring-primary/50 transition-all"
                    required
                    dir="ltr"
                    disabled={loginMutation.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  يرجى إدخال الرقم متضمناً رمز الدولة
                </p>
              </div>
              <Button
                type="submit"
                className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/30 transition-all duration-300"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    متابعة
                    <ArrowRight className="w-5 h-5 mr-2 rotate-180" />
                  </>
                )}
              </Button>
            </motion.form>
          )}

          {step === "CODE" && (
            <motion.form
              key="code"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleCodeSubmit}
              className="space-y-6 relative"
            >
              <div className="space-y-2">
                <Label htmlFor="code">رمز التحقق</Label>
                <div className="relative">
                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="code"
                    name="code"
                    placeholder="12345"
                    className="pl-4 pr-12 py-6 text-2xl text-center tracking-widest rounded-2xl bg-background/50 border-white/10 focus:ring-primary/50 transition-all"
                    required
                    dir="ltr"
                    autoComplete="off"
                    disabled={verifyCodeMutation.isPending}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  أدخل الرمز المرسل لك عبر تطبيق تيليجرام
                </p>
              </div>
              <Button
                type="submit"
                className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/30 transition-all duration-300"
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "التحقق من الرمز"
                )}
              </Button>
            </motion.form>
          )}

          {step === "PASSWORD" && (
            <motion.form
              key="password"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-6 relative"
            >
              <div className="space-y-2">
                <Label htmlFor="password">التحقق بخطوتين (كلمة المرور)</Label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-4 pr-12 py-6 text-lg rounded-2xl bg-background/50 border-white/10 focus:ring-primary/50 transition-all"
                    required
                    dir="ltr"
                    disabled={verifyPasswordMutation.isPending}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full py-6 text-lg rounded-2xl bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/30 transition-all duration-300"
                disabled={verifyPasswordMutation.isPending}
              >
                {verifyPasswordMutation.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "تأكيد الدخول"
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
