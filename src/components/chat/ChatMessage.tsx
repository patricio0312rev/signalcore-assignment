import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div data-testid="chat-message" className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          isUser
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div
          className="prose prose-sm prose-invert max-w-none [&_strong]:text-foreground [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0.5"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
      </div>
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMarkdown(text: string): string {
  const escaped = escapeHtml(text);

  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n- /g, '</p><ul><li>')
    .replace(/\n/g, '<br>')
    .replace(/<\/li>(?=<ul>)/g, '</li>')
    .replace(/<ul><li>(.*?)(?=<\/p>|$)/g, (_match, items: string) => {
      const listItems = items.split('<br>- ').map((item: string) => `<li>${item}</li>`).join('');
      return `<ul>${listItems}</ul>`;
    });
}
