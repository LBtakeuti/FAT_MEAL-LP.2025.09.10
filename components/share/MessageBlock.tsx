'use client';

interface Props {
  title: string | null;
  bodyHtml: string;
}

/** タイトル + 本文HTML を表示。body_html はサーバー側で sanitize-html 済み */
export function MessageBlock({ title, bodyHtml }: Props) {
  if (!title && !bodyHtml) return null;

  return (
    <section className="text-center px-2 py-4 sm:py-6">
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      )}
      {bodyHtml && (
        <article
          className="prose prose-sm sm:prose-base mx-auto max-w-none text-gray-700 text-center [&_a]:text-orange-600 [&_a]:underline [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:inline-block [&_ul]:text-left [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:inline-block [&_ol]:text-left [&_ol]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:text-gray-600 [&_blockquote]:text-left [&_blockquote]:mx-auto [&_blockquote]:inline-block [&_p]:my-2"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}
    </section>
  );
}
