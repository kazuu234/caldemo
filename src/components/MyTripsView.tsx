import { Trip } from '../App';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2, Users, EyeOff, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface MyTripsViewProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
  onToggleRecruitment: (trip: Trip) => void;
  onToggleHidden: (tripId: string) => void;
  onEditRecruitment?: (trip: Trip) => void;
}

export function MyTripsView({ trips, onEdit, onDelete, onToggleRecruitment, onToggleHidden, onEditRecruitment }: MyTripsViewProps) {
  // 自分の旅行予定のみ（オフ会を除外）
  const myTrips = trips.filter(trip => trip.isOwn && trip.type !== 'meetup').sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  if (myTrips.length === 0) {
    return (
      <div className="p-8 pt-12 text-center text-gray-500">
        <p>まだ予定がありません</p>
        <p className="text-sm mt-2">右上の「追加」ボタンから予定を追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 space-y-3">
      {myTrips.map((trip) => {
        const startDateStr = format(trip.startDate, 'M月d日(E)', { locale: ja });
        const endDateStr = format(trip.endDate, 'M月d日(E)', { locale: ja });
        const duration = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        return (
          <Card key={trip.id} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-gray-900">{trip.country}</h3>
                    <span className="text-gray-600">・</span>
                    <span className="text-gray-600">{trip.city}</span>
                    {trip.isRecruitment && (
                      <span className="text-sm text-green-600">
                        （合流募集）
                      </span>
                    )}
                    {trip.isHidden && (
                      <span className="text-sm text-gray-500">
                        （非表示）
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {startDateStr} 〜 {endDateStr}
                    <span className="text-gray-500 ml-2">({duration}日間)</span>
                  </div>

                  {trip.description && (
                    <p className="text-sm text-gray-700 mt-2">{trip.description}</p>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(trip)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm('この予定を削除しますか？')) {
                        onDelete(trip.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-full ${
                    trip.isHidden 
                      ? 'text-blue-600 border-blue-200 hover:bg-blue-50' 
                      : 'text-gray-600 border-gray-200'
                  }`}
                  onClick={() => onToggleHidden(trip.id)}
                >
                  {trip.isHidden ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      みんなの予定に表示
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      みんなの予定から非表示
                    </>
                  )}
                </Button>

                {!trip.isRecruitment && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => onToggleRecruitment(trip)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    合流募集を作成
                  </Button>
                )}

                {trip.isRecruitment && (
                  <>
                    {onEditRecruitment && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => onEditRecruitment(trip)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        募集内容を編集
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-gray-600 border-gray-200"
                      onClick={() => onToggleRecruitment(trip)}
                    >
                      募集を終了
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
