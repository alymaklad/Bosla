import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="mb-2 mt-4 font-display text-[15px] font-semibold text-[#0F1115] first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-4 font-display text-[15px] font-semibold text-[#0F1115] first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 font-display text-[14px] font-semibold text-[#0F1115] first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-3 font-body text-[13px] font-semibold text-[#0F1115] first:mt-0">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-[#0F1115]">{children}</strong>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 marker:text-[#8A8F98]">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-[#5B6270]">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1E3A8A] underline underline-offset-2">{children}</a>,
  hr: () => <hr className="my-3 border-[#E6E7EA]" />,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-[#D8DCE3] pl-3 text-[#45474B]">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-[#F0F1F3] px-1 py-0.5 font-mono text-[12px]">{children}</code>,
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded-lg bg-[#F0F1F3] p-3 [&>code]:bg-transparent [&>code]:p-0">{children}</pre>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-[#E6E7EA]">
      <table className="w-full border-collapse text-left text-[12px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#F4F6FA]">{children}</thead>,
  th: ({ children }) => <th className="border-b border-[#E6E7EA] px-2.5 py-2 font-semibold text-[#0F1115]">{children}</th>,
  td: ({ children }) => <td className="border-b border-[#EEF0F3] px-2.5 py-2 align-top">{children}</td>,
}

/** Renders AI chat replies; raw HTML in the model's output is never rendered. */
export function ChatMarkdown({ content }: { content: string }) {
  return (
    <div className="min-w-0 break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
