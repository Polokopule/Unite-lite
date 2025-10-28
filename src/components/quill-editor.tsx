
"use client";

import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // import styles

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'font': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
          ],
        },
      });

      quillRef.current.on('text-change', () => {
        onChange(quillRef.current?.root.innerHTML || '');
      });
    }

    // Set initial content if it's different from the current editor content
    const editor = quillRef.current;
    if (editor && editor.root.innerHTML !== value) {
        // Find the delta difference
        const delta = editor.clipboard.convert(value);
        editor.setContents(delta, 'silent');
    }

    // Cleanup function
    return () => {
      if (quillRef.current) {
        quillRef.current.off('text-change');
      }
    };
  }, [value, onChange]);

  return <div ref={editorRef} style={{ minHeight: '400px', backgroundColor: 'var(--card)' }} />;
};

export default QuillEditor;
