import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Search, MessageCircle, CheckCircle2, Zap, User } from 'lucide-react';
import { searchDiscordUsers, requestDiscordAuth, setAuthUser, type AuthUser } from '../utils/auth';

interface DiscordAuthDialogProps {
  isOpen: boolean;
  onAuthSuccess: () => void;
}

type AuthStep = 'search' | 'confirm' | 'waiting';

export function DiscordAuthDialog({ isOpen, onAuthSuccess }: DiscordAuthDialogProps) {
  const [step, setStep] = useState<AuthStep>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    discordId: string;
    username: string;
    displayName: string;
    discriminator: string;
  }>>([]);
  const [selectedUser, setSelectedUser] = useState<typeof searchResults[0] | null>(null);
  const [isSendingDM, setIsSendingDM] = useState(false);
  const [error, setError] = useState<string>('');

  // 検索クエリが変更されたら自動検索
  useEffect(() => {
    // 半角英数字3文字以上20文字以下のバリデーション
    if (searchQuery.length < 3) {
      setSearchResults([]);
      if (searchQuery.length > 0) {
        setError('3文字以上入力してください');
      } else {
        setError('');
      }
      return;
    }

    if (searchQuery.length > 20) {
      setSearchResults([]);
      setError('20文字以内で入力してください');
      return;
    }

    // 半角英数字のみ許可
    if (!/^[a-zA-Z0-9]+$/.test(searchQuery)) {
      setSearchResults([]);
      setError('半角英数字のみ入力できます');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setError('');
      try {
        const results = await searchDiscordUsers(searchQuery);
        setSearchResults(results);
        if (results.length === 0) {
          setError('一致するDiscordユーザーが見つかりませんでした');
        }
      } catch (err) {
        setError('検索中にエラーが発生しました');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectUser = (user: typeof searchResults[0]) => {
    setSelectedUser(user);
    setStep('confirm');
  };

  const handleSendDM = async () => {
    if (!selectedUser) return;

    setIsSendingDM(true);
    setError('');

    try {
      const result = await requestDiscordAuth(selectedUser.discordId);
      if (result.success) {
        setStep('waiting');
      } else {
        setError('DM送信に失敗しました。もう一度お試しください。');
      }
    } catch (err) {
      setError('DM送信中にエラーが発生しました');
    } finally {
      setIsSendingDM(false);
    }
  };

  const handleBack = () => {
    setStep('search');
    setSelectedUser(null);
    setError('');
  };

  const handleTestAuth = () => {
    if (!selectedUser) return;

    // テスト用: 選択したユーザーで認証を完了
    // 認証後にDiscordからアバターを取得する想定
    const user: AuthUser = {
      id: selectedUser.discordId,
      username: selectedUser.username,
      displayName: selectedUser.displayName,
      discordId: selectedUser.discordId,
      discordTag: `${selectedUser.username}#${selectedUser.discriminator}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`,
      authenticatedAt: new Date(),
    };

    setAuthUser(user);
    onAuthSuccess();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Discord認証
          </DialogTitle>
          <DialogDescription>
            Discordアカウントと連携してアプリを使用します
          </DialogDescription>
        </DialogHeader>

        {/* ステップ1: ユーザー検索 */}
        {step === 'search' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discord-username">Discordユーザー名</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="discord-username"
                  type="text"
                  placeholder="例: tanaka, alice123"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-gray-500">
                半角英数字3〜20文字で入力してください
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">検索結果</Label>
                <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.discordId}
                      onClick={() => handleSelectUser(user)}
                      className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{user.displayName}</div>
                        <div className="text-xs text-gray-500">
                          @{user.username}#{user.discriminator}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ステップ2: 確認 */}
        {step === 'confirm' && selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <Label className="text-xs text-gray-500 mb-2 block">
                選択されたアカウント
              </Label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm">{selectedUser.displayName}</div>
                  <div className="text-xs text-gray-500">
                    @{selectedUser.username}#{selectedUser.discriminator}
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <MessageCircle className="h-4 w-4" />
              <AlertDescription>
                このアカウントにDiscord DMを送信します。DMに記載されているURLをクリックして認証を完了してください。
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSendingDM}
                className="flex-1"
              >
                戻る
              </Button>
              <Button
                onClick={handleSendDM}
                disabled={isSendingDM}
                className="flex-1"
              >
                {isSendingDM ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    送信中...
                  </>
                ) : (
                  'DMを送信'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ステップ3: DM待機 */}
        {step === 'waiting' && selectedUser && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center space-y-2 px-2">
                <h3 className="font-medium">DMを送信しました</h3>
                <p className="text-sm text-gray-600 break-words">
                  {selectedUser.displayName} (@{selectedUser.username}) のDiscordアカウントにDMを送信しました
                </p>
              </div>
            </div>

            <Alert>
              <MessageCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="space-y-2">
                <p className="break-words">Discordを開き、Botからのダイレクトメッセージを確認してください。</p>
                <p className="text-xs text-gray-600 break-words">
                  DMに記載されている認証URLをクリックすると、このアプリへの認証が完了します。
                </p>
              </AlertDescription>
            </Alert>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800 break-words">
                💡 DMが届かない場合は、サーバーのプライバシー設定で「ダイレクトメッセージを許可する」が有効になっているか確認してください。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 w-full"
              >
                別のアカウントを選択
              </Button>
              <Button
                onClick={handleTestAuth}
                className="flex-1 w-full bg-orange-600 hover:bg-orange-700"
              >
                <Zap className="w-4 h-4 mr-2" />
                テスト: 認証を完了
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
