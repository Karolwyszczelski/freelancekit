// components/TagList.tsx
'use client';

interface TagListProps {
  tags: string[];
  onRemove: (tag: string) => void;
}

export default function TagList({ tags, onRemove }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="
            inline-flex items-center 
            bg-purple-500/20 text-purple-300 
            px-3 py-1 rounded-full 
            text-sm font-medium
          "
        >
          {tag}
          <button
            onClick={() => onRemove(tag)}
            className="ml-2 text-purple-300 hover:text-white"
            title="Usuń"
          >
            &times;
          </button>
        </span>
      ))}
    </div>
  );
}
