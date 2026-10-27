// import { Toaster as Sonner } from "sonner";

// type ToasterProps = React.ComponentProps<typeof Sonner>;

// const Toaster = ({ ...props }: ToasterProps) => {
//   return (
//     <Sonner
//       className="toaster group"
//       toastOptions={{
//         classNames: {
//           toast:
//             "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
//           description: "group-[.toast]:text-muted-foreground",
//           actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
//           cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
//         },
//       }}
//       {...props}
//     />
//   );
// };

// export { Toaster };


import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

// ✅ Helper Function
export function pushToast(
  type: "success" | "error" | "info" | "warning",
  message: string
) {
  switch (type) {
    case "success":
      return toast.success(message);

    case "error":
      return toast.error(message);

    case "warning":
      return toast.warning(message);

    case "info":
    default:
      return toast(message);
  }
}

export { Toaster };