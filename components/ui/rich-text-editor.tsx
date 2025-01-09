import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from "@/lib/utils"
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading2, 
  Code,
  Undo,
  Redo
} from 'lucide-react'
import { Button } from './button'
import { Separator } from './separator'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function RichTextEditor({
  value,
  onChange,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base dark:prose-invert focus:outline-none max-w-none w-full rounded-b-md border-x border-b border-input bg-transparent px-4 py-3 text-sm ring-offset-background",
          "prose-headings:font-semibold prose-p:leading-relaxed",
          "prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic",
          "prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:font-mono prose-code:text-muted-foreground",
          "prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="w-full rounded-md border border-input bg-background shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/40 px-2 py-1.5">
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted", 
              editor.isActive('bold') && "bg-muted text-foreground"
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              editor.isActive('italic') && "bg-muted text-foreground"
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted",
            editor.isActive('heading', { level: 2 }) && "bg-muted text-foreground"
          )}
          title="Heading"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              editor.isActive('bulletList') && "bg-muted text-foreground"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              editor.isActive('orderedList') && "bg-muted text-foreground"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              editor.isActive('blockquote') && "bg-muted text-foreground"
            )}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              editor.isActive('codeBlock') && "bg-muted text-foreground"
            )}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 hover:bg-muted disabled:opacity-40"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 hover:bg-muted disabled:opacity-40"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
} 