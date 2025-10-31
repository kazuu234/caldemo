import { Trip } from '../App';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MapPin, Calendar, Users } from 'lucide-react';
import { getUserByDiscordId } from '../utils/users';

interface RecruitmentsViewProps {
  trips: Trip[];
}

export function RecruitmentsView({ trips }: RecruitmentsViewProps) {
  // 旅行予定の合流募集のみをフィルター（非表示の予定とオフ会は除外）
  const recruitmentTrips = trips.filter(trip => trip.isRecruitment && !trip.isHidden && trip.type !== 'meetup');

  if (recruitmentTrips.length === 0) {
    return (
      <div className="p-12 text-center bg-white">
        <p className="text-gray-500">現在、合流募集はありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 space-y-3">
      {recruitmentTrips.map((trip) => {
        const participantCount = trip.participants?.length || 0;
        const hasParticipantLimit = trip.minParticipants !== undefined || trip.maxParticipants !== undefined;
        
        return (
          <Card key={trip.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={trip.userAvatar} />
                <AvatarFallback>
                  {trip.userName?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-gray-900 mb-1">
                  {trip.userName}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{trip.country} - {trip.city}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(trip.startDate, 'M月d日(E)', { locale: ja })} - {format(trip.endDate, 'M月d日(E)', { locale: ja })}
                </span>
              </div>

              {hasParticipantLimit && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>
                    募集人数: 
                    {trip.minParticipants !== undefined && trip.maxParticipants !== undefined
                      ? ` ${trip.minParticipants}〜${trip.maxParticipants}名`
                      : trip.minParticipants !== undefined
                      ? ` ${trip.minParticipants}名以上`
                      : ` ${trip.maxParticipants}名まで`
                    }
                    {participantCount > 0 && (
                      <span className="text-green-600 ml-1">
                        （{participantCount}名参加予定）
                      </span>
                    )}
                  </span>
                </div>
              )}

              {trip.participants && trip.participants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">参加者</div>
                  <div className="flex flex-wrap gap-2">
                    {trip.participants.map((participantId) => {
                      const participant = getUserByDiscordId(participantId);
                      if (!participant) return null;
                      
                      return (
                        <div
                          key={participantId}
                          className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-2 py-1"
                        >
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="text-xs">
                              {participant.displayName?.[0] || participant.username?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-700">{participant.displayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {trip.recruitmentDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">募集内容</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {trip.recruitmentDetails}
                  </p>
                </div>
              )}

            </div>
          </Card>
        );
      })}
    </div>
  );
}
