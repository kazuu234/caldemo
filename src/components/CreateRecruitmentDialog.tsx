import { useState, useEffect } from 'react';
import { Trip } from '../App';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { searchDiscordUsersByDisplayName, getUserByDiscordId } from '../utils/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X, Search, Loader2 } from 'lucide-react';

interface CreateRecruitmentDialogProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip, discordLinked: boolean) => void;
  isEditing?: boolean; // 編集モードかどうか
}

export function CreateRecruitmentDialog({
  trip,
  isOpen,
  onClose,
  onSave,
  isEditing = false,
}: CreateRecruitmentDialogProps) {
  const [recruitmentDetails, setRecruitmentDetails] = useState('');
  const [discordLinked, setDiscordLinked] = useState(false);
  const [minParticipants, setMinParticipants] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  // ローカルの表示用参加者リスト（discordIdと表示情報を保持）
  const [participants, setParticipants] = useState<Array<{
    discordId: string;
    username: string;
    displayName: string;
    avatar: string;
  }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    discordId: string;
    username: string;
    displayName: string;
    discriminator: string;
    avatar: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (trip && isOpen) {
      setRecruitmentDetails(trip.recruitmentDetails || '');
      setDiscordLinked(trip.discordLinked || false);
      setMinParticipants(trip.minParticipants?.toString() || '');
      setMaxParticipants(trip.maxParticipants?.toString() || '');
      
      // trip.participants（discordId配列）からユーザー情報を取得
      const participantDetails = (trip.participants || [])
        .map(discordId => {
          const userData = getUserByDiscordId(discordId);
          if (userData && userData.displayName) {
            return {
              discordId: userData.discordId,
              username: userData.username,
              displayName: userData.displayName,
              avatar: userData.avatar,
            };
          }
          return null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
      
      setParticipants(participantDetails);
    }
  }, [trip, isOpen]);

  // DisplayName検索
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchDiscordUsersByDisplayName(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('検索エラー:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip) return;

    // 募集人数のバリデーション
    const minNum = minParticipants ? parseInt(minParticipants, 10) : undefined;
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : undefined;

    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      alert('最大募集人数は最小募集人数以上にしてください');
      return;
    }

    const updatedTrip: Trip = {
      ...trip,
      isRecruitment: true,
      recruitmentDetails: recruitmentDetails || undefined,
      discordLinked,
      minParticipants: minNum,
      maxParticipants: maxNum,
      // discordIdの配列のみを保存
      participants: participants.map(p => p.discordId),
    };

    onSave(updatedTrip, discordLinked);
    onClose();
  };

  const handleClose = () => {
    setRecruitmentDetails('');
    setDiscordLinked(false);
    setMinParticipants('');
    setMaxParticipants('');
    setParticipants([]);
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const handleAddParticipant = (user: {
    discordId: string;
    username: string;
    displayName: string;
    avatar: string;
  }) => {
    // 既に追加されているかチェック
    if (participants.some(p => p.discordId === user.discordId)) {
      return;
    }

    setParticipants([...participants, {
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      discordId: user.discordId,
    }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveParticipant = (discordId: string) => {
    setParticipants(participants.filter(p => p.discordId !== discordId));
  };

  if (!trip) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '合流募集を編集' : '合流募集を作成'}</DialogTitle>
          <DialogDescription className="text-xs">
            {isEditing ? '募集内容を更新できます' : 'この予定を公開して仲間を募集しましょう'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-900 mb-1">
              {trip.country} - {trip.city}
            </div>
            {trip.description && (
              <div className="text-xs text-gray-600">
                {trip.description}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recruitmentDetails">募集内容</Label>
            <Textarea
              id="recruitmentDetails"
              value={recruitmentDetails}
              onChange={(e) => setRecruitmentDetails(e.target.value)}
              placeholder="例：一緒に観光したい方募集！美術館巡りやカフェ探索が好きです。"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>募集人数（任意）</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="minParticipants" className="text-xs text-gray-600">最小人数</Label>
                <Input
                  id="minParticipants"
                  type="number"
                  min="1"
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(e.target.value)}
                  placeholder="例: 2"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxParticipants" className="text-xs text-gray-600">最大人数</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="例: 5"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label>参加者を追加</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="表示名で検索..."
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.discordId}
                      type="button"
                      onClick={() => handleAddParticipant(user)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 text-left"
                      disabled={participants.some(p => p.discordId === user.discordId)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.displayName?.[0] || user.username?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900">{user.displayName}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </div>
                      {participants.some(p => p.discordId === user.discordId) && (
                        <span className="text-xs text-green-600">追加済み</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {participants.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">参加者 ({participants.length}名)</div>
                  <div className="space-y-1">
                    {participants.map((participant) => (
                      <div
                        key={participant.discordId}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>{participant.displayName?.[0] || participant.username?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900">{participant.displayName}</div>
                          <div className="text-xs text-gray-500">@{participant.username}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParticipant(participant.discordId)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-start space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <Checkbox
              id="discord-linked"
              checked={discordLinked}
              onCheckedChange={(checked) => setDiscordLinked(checked as boolean)}
            />
            <div className="flex-1">
              <label
                htmlFor="discord-linked"
                className="text-xs cursor-pointer"
              >
                <span className="text-gray-900">Discord連携</span>
                <p className="text-xs text-gray-600 mt-0.5">
                  コミュニティサロンに募集を投稿します
                </p>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              キャンセル
            </Button>
            <Button type="submit" className="flex-1">
              {isEditing ? '保存' : '作成'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
