import { AvatarProvider } from "@/pages/home/model/avatar-context";

export default function TabsLayout({ children, sheet }: LayoutProps<"/">) {
  return (
    <AvatarProvider>
      {children} {sheet}
    </AvatarProvider>
  );
}
