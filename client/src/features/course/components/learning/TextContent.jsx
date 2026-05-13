export default function TextContent({ content }) {
  if (!content) return null;

  return (
    <div className="card p-6">
      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}
