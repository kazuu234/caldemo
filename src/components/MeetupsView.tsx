import { Trip } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MapPin, Calendar, Users, Eye, EyeOff, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { getUserByDiscordId } from '../utils/users';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { getUserByDiscordId } from '../utils/auth';

interface MeetupsViewProps {
  trips: Trip[];
  authUser: { displayName: string; username: string; discordId: string; avatar: string } | null;
  onEdit?: (trip: Trip) => void;
  onDelete?: (tripId: string) => void;
  onToggleHidden?: (tripId: string) => void;
  onToggleRecruitment?: (trip: Trip) => void;
  onEditRecruitment?: (trip: Trip) => void;
  onJoinRecruitment?: (trip: Trip) => void;
  onLeaveRecruitment?: (trip: Trip) => void;
  onAddParticipant?: (trip: Trip, participantDiscordId: string) => void;
  onRemoveParticipant?: (trip: Trip, participantId: string) => void;
  onVoteDate?: (trip: Trip, date: Date) => void;
}

export function MeetupsView({
  trips,
  authUser,
  onEdit,
  onDelete,
  onToggleHidden,
  onToggleRecruitment,
  onEditRecruitment,
  onJoinRecruitment,
  onLeaveRecruitment,
  onAddParticipant,
  onRemoveParticipant,
  onVoteDate,
}: MeetupsViewProps) {
  const [deleteConfirmTrip, setDeleteConfirmTrip] = useState<Trip | null>(null);
  const [hideConfirmTrip, setHideConfirmTrip] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showParticipantsSheet, setShowParticipantsSheet] = useState(false);
  const [participantSearch, setParticipantSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // オフ会のみをフィルター
  const meetups = trips.filter(trip => trip.type === 'meetup');

  // 日付順にソート
  const sortedMeetups = [...meetups].sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  const handleDeleteClick = (trip: Trip) => {
    setDeleteConfirmTrip(trip);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmTrip && onDelete) {
      onDelete(deleteConfirmTrip.id);
      setDeleteConfirmTrip(null);
    }
  };

  const isParticipant = (trip: Trip) => {
    if (!authUser) return false;
    return trip.participants?.includes(authUser.discordId) || false;
  };

  const isOwner = (trip: Trip) => {
    if (!authUser) return false;
    // userDiscordIdで正確に判定
    return trip.userDiscordId === authUser.discordId;
  };

  const isFull = (trip: Trip) => {
    if (!trip.maxParticipants) return false;
    const currentCount = trip.participants?.length || 0;
    return currentCount >= trip.maxParticipants;
  };

  const handleParticipantSearch = () => {
    // モック検索結果（実際はDiscord APIで検索）
    if (participantSearch) {
      setSearchResults([
        {
          username: 'user1',
          displayName: `${participantSearch}さん`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantSearch}`,
          discordId: Math.random().toString(),
        },
      ]);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddParticipantClick = (participantDiscordId: string) => {
    if (selectedTrip && onAddParticipant) {
      onAddParticipant(selectedTrip, participantDiscordId);
      setParticipantSearch('');
      setSearchResults([]);
    }
  };

  const handleShowParticipants = (trip: Trip) => {
    setSelectedTrip(trip);
    setShowParticipantsSheet(true);
  };

  if (meetups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-500 mb-2">オフ会はまだありません</h3>
          <p className="text-sm text-gray-400">
            初めてのオフ会を企画してみましょう！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {sortedMeetups.map((trip) => {
        const isOwnTrip = isOwner(trip);
        
        return (
          <Card key={trip.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={trip.userAvatar} alt={trip.userName} />
                    <AvatarFallback>{trip.userName?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">{trip.userName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {trip.country === '日本' ? trip.city : `${trip.country} - ${trip.city}`}
                      </span>
                    </div>
                  </div>
                </div>
                {isOwnTrip && (
                  <div className="flex gap-1">
                    {trip.isHidden && (
                      <Badge variant="secondary" className="text-xs">
                        <EyeOff className="h-3 w-3 mr-1" />
                        非表示
                      </Badge>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(trip)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteClick(trip)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* タイトル */}
              {trip.description && (
                <h3 className="text-gray-900">{trip.description}</h3>
              )}

              {/* 日程 または 候補日 */}
              {trip.candidateDates && trip.candidateDates.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>候補日（投票してください）</span>
                  </div>
                  <div className="space-y-2">
                    {trip.candidateDates.map((date, index) => {
                      const dateString = date.toISOString();
                      const voterIds = trip.dateVotes?.[dateString] || [];
                      const hasVoted = authUser ? voterIds.includes(authUser.discordId) : false;
                      
                      // 投票者の情報をユーザーマスターデータから取得
                      const voters = voterIds
                        .map(voterId => getUserByDiscordId(voterId))
                        .filter((v): v is NonNullable<typeof v> => v !== null);
                      
                      return (
                        <button
                          key={index}
                          onClick={() => onVoteDate && onVoteDate(trip, date)}
                          className={`w-full flex flex-col gap-2 p-3 rounded border transition-colors ${
                            hasVoted 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-sm">
                              {format(date, 'M月d日(E) HH:mm', { locale: ja })}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {voterIds.length}票
                              </span>
                              {hasVoted && (
                                <Badge variant="default" className="text-xs">投票済み</Badge>
                              )}
                            </div>
                          </div>
                          {voters.length > 0 && (
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-2">
                                {voters.slice(0, 5).map((voter, i) => (
                                  <Avatar key={i} className="h-6 w-6 border-2 border-white">
                                    <AvatarImage src={voter.avatar} alt={voter.displayName} />
                                    <AvatarFallback className="text-xs">{voter.displayName?.[0] || voter.username?.[0] || '?'}</AvatarFallback>
                                  </Avatar>
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {voters.slice(0, 3).map(v => v.displayName).join(', ')}
                                {voters.length > 3 && ` 他${voters.length - 3}名`}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {format(trip.startDate, 'M月d日(E)', { locale: ja })}
                    {trip.startDate.getTime() !== trip.endDate.getTime() && 
                      ` - ${format(trip.endDate, 'M月d日(E)', { locale: ja })}`
                    }
                  </span>
                </div>
              )}

              {/* 募集情報 */}
              {trip.isRecruitment && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                  {trip.recruitmentDetails && (
                    <p className="text-sm text-gray-700">{trip.recruitmentDetails}</p>
                  )}
                  
                  {/* 参加者情報 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">
                        {trip.participants?.length || 0}
                        {trip.maxParticipants && `/${trip.maxParticipants}`}人
                      </span>
                      {trip.minParticipants && (
                        <span className="text-xs text-gray-500">
                          (最小{trip.minParticipants}人)
                        </span>
                      )}
                      {isFull(trip) && (
                        <Badge variant="secondary" className="text-xs">満員</Badge>
                      )}
                    </div>
                    {trip.participants && trip.participants.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShowParticipants(trip)}
                      >
                        参加者を見る
                      </Button>
                    )}
                  </div>

                  {/* アクション */}
                  <div className="flex gap-2">
                    {isOwnTrip ? (
                      <>
                        {onEditRecruitment && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onEditRecruitment(trip)}
                          >
                            募集を編集
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowParticipants(trip)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {isParticipant(trip) ? (
                          onLeaveRecruitment && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => onLeaveRecruitment(trip)}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              参加をキャンセル
                            </Button>
                          )
                        ) : (
                          onJoinRecruitment && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => onJoinRecruitment(trip)}
                              disabled={isFull(trip)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              {isFull(trip) ? '満員' : '参加する'}
                            </Button>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 表示設定（自分のオフ会のみ） */}
              {isOwnTrip && onToggleHidden && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    if (trip.isHidden) {
                      onToggleHidden(trip.id);
                    } else {
                      setHideConfirmTrip(trip);
                    }
                  }}
                >
                  {trip.isHidden ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      みんなのオフ会に表示する
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      みんなのオフ会から非表示にする
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deleteConfirmTrip} onOpenChange={(open) => !open && setDeleteConfirmTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>オフ会を削除</AlertDialogTitle>
            <AlertDialogDescription>
              このオフ会を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 非表示確認ダイアログ */}
      <AlertDialog open={!!hideConfirmTrip} onOpenChange={(open) => !open && setHideConfirmTrip(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>オフ会を非表示にしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このオフ会は「みんなのオフ会」から非表示になります。いつでも再表示できます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (hideConfirmTrip && onToggleHidden) {
                  onToggleHidden(hideConfirmTrip.id);
                  setHideConfirmTrip(null);
                }
              }}
            >
              非表示にする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 参加者シート */}
      <Sheet open={showParticipantsSheet} onOpenChange={setShowParticipantsSheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>参加者一覧</SheetTitle>
            <SheetDescription>このオフ会の参加者を確認・管理できます</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {/* 主催者のみ：参加者追加 */}
            {selectedTrip && isOwner(selectedTrip) && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Discord表示名で検索..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleParticipantSearch()}
                  />
                  <Button onClick={handleParticipantSearch}>検索</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg p-2 space-y-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.discordId}
                        onClick={() => handleAddParticipantClick(user.discordId)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.displayName?.[0] || user.username?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 参加者リスト */}
            <ScrollArea className="h-[calc(80vh-200px)]">
              {selectedTrip?.participants && selectedTrip.participants.length > 0 ? (
                <div className="space-y-2">
                  {selectedTrip.participants.map((participantId) => {
                    const participant = getUserByDiscordId(participantId);
                    if (!participant) return null;
                    
                    return (
                      <div
                        key={participantId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={participant.avatar} alt={participant.displayName} />
                            <AvatarFallback>{participant.displayName?.[0] || participant.username?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{participant.displayName}</p>
                            <p className="text-xs text-gray-500">@{participant.username}</p>
                          </div>
                        </div>
                        {isOwner(selectedTrip) && onRemoveParticipant && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRemoveParticipant(selectedTrip, participantId)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  まだ参加者がいません
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
