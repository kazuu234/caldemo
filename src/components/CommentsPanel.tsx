import { useEffect, useState } from 'react';
import { CommentsAPI, type CommentItem } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface CommentsPanelProps {
  tripId: string;
  userDiscordId: string;
  userName: string;
}

export function CommentsPanel({ tripId, userDiscordId, userName }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await CommentsAPI.list(tripId);
        setComments(data);
      } catch (e) {
        // noop
      }
    })();
  }, [tripId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const created = await CommentsAPI.create({ trip: tripId, user_discord_id: userDiscordId, user_name: userName, content });
      setComments([...comments, created]);
      setContent('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CommentsAPI.remove(id);
      setComments(comments.filter(c => c.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {comments.map(c => (
          <div key={c.id} className="border rounded p-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{c.user_name}</div>
              {c.user_discord_id === userDiscordId && (
                <Button size="sm" variant="ghost" onClick={() => handleDelete(c.id)}>削除</Button>
              )}
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{c.content}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="text-sm text-gray-500">まだコメントはありません</div>
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="コメントを書く..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSubmit} disabled={submitting || !content.trim()}>
            送信
          </Button>
        </div>
      </div>
    </div>
  );
}
