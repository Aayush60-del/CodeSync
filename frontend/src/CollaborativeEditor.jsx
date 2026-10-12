import { useEffect, useRef } from 'react'
import { basicSetup, EditorView } from 'codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { tags } from '@lezer/highlight'
import { yCollab } from 'y-codemirror.next'

const accessibleHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: '#a8b1c0' },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName, tags.macroName], color: '#ff858e' },
])

export default function CollaborativeEditor({ ytext, awareness, label, accent }) {
  const editorHost = useRef(null)

  useEffect(() => {
    if (!editorHost.current) return undefined

    const view = new EditorView({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        syntaxHighlighting(accessibleHighlightStyle),
        EditorView.contentAttributes.of({ 'aria-label': label }),
        yCollab(ytext, awareness, { undoManager: false }),
      ],
      parent: editorHost.current,
    })

    return () => view.destroy()
  }, [ytext, awareness])

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#282c34] shadow-[0_18px_45px_-28px_rgba(0,0,0,0.7)]">
      <header className="flex h-11 items-center justify-between border-b border-white/10 bg-[#22262d] px-4">
        <div className="flex items-center gap-2.5">
          <span className={`h-2 w-2 rounded-full ${accent}`} />
          <span className="text-xs font-semibold tracking-wide text-slate-200">{label}</span>
          <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            index.js
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-300">JavaScript</span>
      </header>
      <div className="editor-surface h-[26rem] lg:h-[31rem]" ref={editorHost} />
    </section>
  )
}
