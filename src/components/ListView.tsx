import { Trip } from '../App';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';

interface ListViewProps {
  trips: Trip[];
  onDateClick?: (date: Date) => void;
}

export function ListView({ trips, onDateClick }: ListViewProps) {
  // 旅行予定のみをフィルタ（オフ会を除外）
  const travelTrips = useMemo(() => {
    return trips.filter(trip => trip.type !== 'meetup');
  }, [trips]);

  // 日付範囲を取得（最小日付と最大日付から3ヶ月分）
  const dateRange = useMemo(() => {
    if (travelTrips.length === 0) {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      return { start, end };
    }

    const allDates = travelTrips.flatMap((trip) => [trip.startDate, trip.endDate]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // 開始日の月初めから終了日の月末まで
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    return { start, end };
  }, [travelTrips]);

  // 日付ごとの旅行者リストを生成
  const dailyTrips = useMemo(() => {
    const daily: { [key: string]: Trip[] } = {};
    const current = new Date(dateRange.start);

    while (current <= dateRange.end) {
      const dateKey = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
      const tripsForDay = travelTrips.filter((trip) => {
        const tripStart = new Date(trip.startDate);
        const tripEnd = new Date(trip.endDate);
        const checkDate = new Date(current);

        tripStart.setHours(0, 0, 0, 0);
        tripEnd.setHours(0, 0, 0, 0);
        checkDate.setHours(0, 0, 0, 0);

        return checkDate >= tripStart && checkDate <= tripEnd;
      });

      daily[dateKey] = tripsForDay;
      current.setDate(current.getDate() + 1);
    }

    return daily;
  }, [travelTrips, dateRange]);

  // 日付をフォーマット
  const formatDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month, day);
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
    return {
      month: month + 1,
      day,
      dayOfWeek,
      dateObj: date,
    };
  };

  // 月ごとにグループ化
  const groupedByMonth = useMemo(() => {
    const groups: { [key: string]: string[] } = {};
    Object.keys(dailyTrips).forEach((dateKey) => {
      const [year, month] = dateKey.split('-');
      const monthKey = `${year}-${month}`;
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(dateKey);
    });
    return groups;
  }, [dailyTrips]);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}年${parseInt(month) + 1}月`;
  };

  // 国ごとにグループ化
  const groupByCountry = (trips: Trip[]) => {
    const groups: { [key: string]: Trip[] } = {};
    trips.forEach((trip) => {
      if (!groups[trip.country]) {
        groups[trip.country] = [];
      }
      groups[trip.country].push(trip);
    });
    return groups;
  };

  if (trips.length === 0) {
    return (
      <div className="p-12 text-center bg-white">
        <p className="text-gray-500">表示する旅行予定がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {Object.entries(groupedByMonth).map(([monthKey, dateKeys]) => (
        <div key={monthKey} className="mb-4">
          <h3 className="text-gray-900 px-4 py-2 bg-gray-100 sticky top-[168px] z-[5]">
            {getMonthLabel(monthKey)}
          </h3>
          <div className="space-y-2 px-4 py-2">
            {dateKeys.map((dateKey) => {
              const { month, day, dayOfWeek, dateObj } = formatDate(dateKey);
              const dayTrips = dailyTrips[dateKey];
              const countryGroups = groupByCountry(dayTrips);

              // 今日かどうか
              const today = new Date();
              const isToday =
                dateObj.getDate() === today.getDate() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getFullYear() === today.getFullYear();

              return (
                <Card key={dateKey} className={`p-3 ${isToday ? 'border-blue-500 border-2' : ''}`}>
                  <div className="flex gap-3">
                    {/* 日付部分 */}
                    <div className="flex flex-col items-center justify-start min-w-[48px]">
                      <div className={`text-xs ${dayOfWeek === '日' ? 'text-red-600' : dayOfWeek === '土' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {dayOfWeek}
                      </div>
                      <div className="text-gray-900">
                        {day}
                      </div>
                      <button
                        onClick={() => onDateClick?.(dateObj)}
                        className="mt-1 w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="予定を追加"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 旅行者リスト */}
                    <div className="flex-1 min-w-0">
                      {dayTrips.length === 0 ? (
                        <p className="text-sm text-gray-400 py-1">予定なし</p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(countryGroups).map(([country, countryTrips]) => (
                            <div key={country} className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                {country}
                              </Badge>
                              <div className="space-y-1">
                                {countryTrips.map((trip) => (
                                  <div key={trip.id} className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={trip.userAvatar} />
                                      <AvatarFallback className="text-xs">
                                        {trip.userName?.[0] || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm text-gray-900 flex items-center gap-2">
                                        <span>{trip.userName}</span>
                                        <span className="text-xs text-gray-500">
                                          {trip.city}
                                        </span>
                                        {trip.isRecruitment && (
                                          <span className="text-xs text-green-600">
                                            合流募集
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
