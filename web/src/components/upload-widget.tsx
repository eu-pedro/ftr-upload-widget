import { Header } from "./header";
import { UploadWidgetDropzone } from "./upload-widget-dropzone";
import { UploadWidgetUploadList } from "./upload-widget-upload-list";
import * as Collapsible from "@radix-ui/react-collapsible";
import { UploadWidgetMinimizeButton } from "./upload-widget-minimize-button";
import { motion, useCycle } from "motion/react";
import { usePendingUploads } from "../store/uploads";

export function UploadWidget() {
  const { isThereAnyPendingUploads } = usePendingUploads();

  const [isWidgetOpen, toggleWidgetOpen] = useCycle(false, true);

  return (
    <Collapsible.Root onOpenChange={() => toggleWidgetOpen()} asChild>
      <motion.div
        data-progress={isThereAnyPendingUploads}
        animate={isWidgetOpen ? "open" : "closed"}
        variants={{
          closed: {
            width: "max-content",
            height: 44,
            transition: {
              type: "inertia",
            },
          },
          open: {
            width: 360,
            height: "auto",
            transition: {
              duration: 0.1,
            },
          },
        }}
        className="bg-zinc-900 overflow-hidden w-[360px] rounded-xl data-[state=open]:shadow-shape border border-transparent animate-border data-[state=closed]:rounded-3xl data-[state=closed]:data-[progress=false]:shadow-shape  data-[state=closed]:data-[progress=true]:[background:linear-gradient(45deg,#09090B,--theme(--color-zinc-900)_50%,#09090B)_padding-box,conic-gradient(from_var(--border-angle),--theme(--color-zinc-700/.48)_80%,--theme(--color-indigo-500)_86%,--theme(--color-indigo-300)_90%,--theme(--color-indigo-500)_94%,--theme(--color-zinc-600/.48))_border-box]"
      >
        {!isWidgetOpen && <UploadWidgetMinimizeButton />}

        <Collapsible.CollapsibleContent>
          <Header />

          <div className="flex flex-col gap-4 py-3">
            <UploadWidgetDropzone />

            <div className="h-px bg-zinc-800 border-t border-black/50 box-content" />

            <UploadWidgetUploadList />
          </div>
        </Collapsible.CollapsibleContent>
      </motion.div>
    </Collapsible.Root>
  );
}
