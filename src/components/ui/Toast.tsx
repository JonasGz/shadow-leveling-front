import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { View, Text } from "react-native";
import { cn } from "../../lib/cn";

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

// PULSE semantic colours drive the left border + tint. Container stays on the
// neutral surface so the toast reads as a system message, not a banner.
const typeStyles: Record<ToastType, string> = {
  success: "bg-gray-500 border-l-4 border-success",
  error: "bg-gray-500 border-l-4 border-error",
  warning: "bg-gray-500 border-l-4 border-warning",
  info: "bg-gray-500 border-l-4 border-info",
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        3500,
      );
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Acima da tab bar (60px + 32px de margem), fora do caminho da app bar. */}
      <View
        pointerEvents="none"
        className="absolute bottom-[112px] left-4 right-4 z-50 gap-2"
      >
        {toasts.map((t) => (
          <View
            key={t.id}
            className={cn("rounded-lg px-4 py-3", typeStyles[t.type])}
          >
            <Text className="text-base font-normal text-white">
              {t.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
