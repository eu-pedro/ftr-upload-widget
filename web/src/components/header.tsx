import { Minimize2 } from "lucide-react";
import { Button } from "./ui/button";
import * as Collapsible from "@radix-ui/react-collapsible";
import { UploadWidgetTitle } from "./upload-widget-title";

export function Header() {
  return (
    <div className="w-full p-4 py-2 bg-white/10 border-b border-zinc-200 flex items-center justify-between">
      <UploadWidgetTitle />

      <Collapsible.Trigger asChild>
        <Button size="icon" className="-mr-2">
          <Minimize2 className="size-4" strokeWidth={1.5} />
        </Button>
      </Collapsible.Trigger>
    </div>
  );
}
