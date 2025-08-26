import { useRef, useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3,
  Link,
  Code
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing...', 
  label,
  required = false,
  className = '',
  minHeight = '200px'
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    handleInput(); // Update the content after command execution
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      execCommand('indent');
    }
    
    // Handle Shift+Tab for outdent
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      execCommand('outdent');
    }
  };

  const insertLink = () => {
    const url = prompt('Enter the URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title, 
    isActive = false 
  }: { 
    onClick: () => void;
    icon: any;
    title: string;
    isActive?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={`h-8 w-8 p-0 ${isActive ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'}`}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label} {required && '*'} 
          <span className="text-sm text-gray-500 font-normal ml-2">✨ Rich Text Editor</span>
        </Label>
      )}
      
      <div className={`rich-text-editor-container border border-gray-300 rounded-md shadow-sm ${isFocused ? 'ring-2 ring-purple-500 border-transparent' : ''} ${className}`}>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-md">
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('bold')}
              icon={Bold}
              title="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => execCommand('italic')}
              icon={Italic}
              title="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => execCommand('underline')}
              icon={Underline}
              title="Underline (Ctrl+U)"
            />
          </div>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', '<h1>')}
              icon={Heading1}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() => execCommand('formatBlock', '<h2>')}
              icon={Heading2}
              title="Heading 2"
            />
            <ToolbarButton
              onClick={() => execCommand('formatBlock', '<h3>')}
              icon={Heading3}
              title="Heading 3"
            />
          </div>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              icon={List}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              icon={ListOrdered}
              title="Numbered List"
            />
          </div>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <div className="flex items-center gap-1">
            <ToolbarButton
              onClick={() => execCommand('formatBlock', '<blockquote>')}
              icon={Quote}
              title="Quote"
            />
            <ToolbarButton
              onClick={() => execCommand('formatBlock', '<pre>')}
              icon={Code}
              title="Code Block"
            />
            <ToolbarButton
              onClick={insertLink}
              icon={Link}
              title="Insert Link"
            />
          </div>
        </div>

        {/* Editor */}
        <div
          ref={editorRef}
          contentEditable
          className="rich-text-editor p-3 outline-none"
          style={{ minHeight }}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
}