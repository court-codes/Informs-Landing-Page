import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const BLOCK_STYLES = [
  { value: 'h1', label: 'Title', level: 1 },
  { value: 'h2', label: 'Heading', level: 2 },
  { value: 'h3', label: 'Subheading', level: 3 },
  { value: 'p', label: 'Normal text' },
];

export default function RichTextEditor({ value, onChange, label }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: false,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? '' : ed.getHTML()),
    editorProps: { attributes: { class: 'rte-content rich-text', 'aria-label': label || 'Text editor' } },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => {
      if (!ed) return null;
      const heading = BLOCK_STYLES.find((s) => s.level && ed.isActive('heading', { level: s.level }));
      return {
        block: heading ? heading.value : 'p',
        bold: ed.isActive('bold'),
        italic: ed.isActive('italic'),
        bulletList: ed.isActive('bulletList'),
        orderedList: ed.isActive('orderedList'),
        canUndo: ed.can().undo(),
        canRedo: ed.can().redo(),
      };
    },
  });

  if (!editor || !state) return <div className="rte rte-loading" />;

  const setBlock = (value) => {
    const style = BLOCK_STYLES.find((s) => s.value === value);
    const chain = editor.chain().focus();
    if (style.level) chain.setHeading({ level: style.level }).run();
    else chain.setParagraph().run();
  };

  const toggle = (name) => () => editor.chain().focus()[name]().run();

  return (
    <div className="rte">
      <div className="rte-toolbar" role="toolbar" aria-label="Formatting">
        <select value={state.block} onChange={(e) => setBlock(e.target.value)} aria-label="Text style">
          {BLOCK_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="rte-sep" />
        <button type="button" className={state.bold ? 'active' : ''} onClick={toggle('toggleBold')} aria-label="Bold" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" className={state.italic ? 'active' : ''} onClick={toggle('toggleItalic')} aria-label="Italic" title="Italic">
          <em>I</em>
        </button>
        <span className="rte-sep" />
        <button type="button" className={state.bulletList ? 'active' : ''} onClick={toggle('toggleBulletList')} title="Bulleted list">
          • List
        </button>
        <button type="button" className={state.orderedList ? 'active' : ''} onClick={toggle('toggleOrderedList')} title="Numbered list">
          1. List
        </button>
        <span className="rte-sep" />
        <button type="button" onClick={toggle('undo')} disabled={!state.canUndo} title="Undo" aria-label="Undo">
          ↺
        </button>
        <button type="button" onClick={toggle('redo')} disabled={!state.canRedo} title="Redo" aria-label="Redo">
          ↻
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
