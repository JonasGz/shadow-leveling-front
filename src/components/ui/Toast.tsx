import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import Check from "lucide-react-native/icons/check";
import TriangleAlert from "lucide-react-native/icons/triangle-alert";
import Info from "lucide-react-native/icons/info";
import X from "lucide-react-native/icons/x";
import { color } from "../../theme/palette";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const icons: Record<ToastType, LucideIcon> = {
  success: Check,
  error: TriangleAlert,
  warning: TriangleAlert,
  info: Info,
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback(
    (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute left-4 right-4 z-50 gap-2"
        style={{ bottom: insets.bottom + 16 }}
      >
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <View
              key={t.id}
              className="flex-row items-center gap-3 rounded-lg border border-white/7 bg-gray-600 p-4 shadow-high"
            >
              <Icon size={20} color={color[t.type]} strokeWidth={2.2} />
              <Text className="flex-1 text-sm font-semibold text-gray-50">
                {t.message}
              </Text>
              <Pressable
                onPress={() => dismiss(t.id)}
                hitSlop={14}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <X size={16} color={color["gray-200"]} strokeWidth={2} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
