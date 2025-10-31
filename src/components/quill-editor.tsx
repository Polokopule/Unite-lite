"use client";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import { useEffect, useState } from "react";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Start typing your magic here..."
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [mounted, setMounted] = useState(false);

  // Ensure the component only renders after client hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="text-gray-400">Loading editor...</div>;

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"]
    ],
  };

  const formats = [
    "header",
    "bold", "italic", "underline", "strike",
    "blockquote", "code-block",
    "list", "bullet",
    "link", "image"
  ];

  return (
    <div className="border border-gray-300 rounded-md">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
