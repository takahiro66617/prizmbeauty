import { useState } from "react";
import { HelpCircle, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HelpSection {
  title: string;
  content: string[];
}

interface HelpGuideModalProps {
  title: string;
  description: string;
  sections: HelpSection[];
  workflow?: string[];
}

export default function HelpGuideModal({ title, description, sections, workflow }: HelpGuideModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
        title="使い方ガイド"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-800">{title}</h3>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>

              {sections.map((section, i) => (
                <div key={i}>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{i + 1}</span>
                    {section.title}
                  </h4>
                  <ul className="space-y-1.5 ml-7">
                    {section.content.map((item, j) => (
                      <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                        <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-gray-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {workflow && workflow.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-blue-800 mb-2">📋 今後の進め方</h4>
                  <ol className="space-y-1.5">
                    {workflow.map((step, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="font-bold text-blue-500 flex-shrink-0">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>閉じる</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
