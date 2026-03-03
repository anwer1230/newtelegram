import { motion } from "framer-motion";
import { CheckCircle2, XCircle, LucideIcon } from "lucide-react";

interface StatusIndicatorProps {
  title: string;
  isActive: boolean;
  icon: LucideIcon;
  description: string;
}

export function StatusIndicator({ title, isActive, icon: Icon, description }: StatusIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-500 border ${
        isActive 
          ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.15)]' 
          : 'bg-card/40 border-white/5 shadow-lg backdrop-blur-md'
      }`}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8">
            {isActive ? (
              <>
                <div className="absolute inset-0 bg-green-500 rounded-full pulse-ring" />
                <CheckCircle2 className="w-6 h-6 text-green-500 relative z-10" />
              </>
            ) : (
              <XCircle className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            isActive ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
          }`}>
            {isActive ? 'نشط' : 'متوقف'}
          </span>
        </div>
      </div>
      
      {/* Decorative gradient for active state */}
      {isActive && (
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/20 blur-3xl rounded-full" />
      )}
    </motion.div>
  );
}
