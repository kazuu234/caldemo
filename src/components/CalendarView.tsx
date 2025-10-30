import { Trip } from '../App';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface CalendarViewProps {
  trips: Trip[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

export function CalendarView({
  trips,
  currentMonth,
  onMonthChange,
  onDateClick,
}: CalendarViewProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // カレンダーの日付を生成
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarDays: Date[] = [];
  const current = new Date(startDate);
  while (calendarDays.length < 42) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // 特定の日付に旅行予定がある人を取得（オフ会を除外）
  const getTripsForDate = (date: Date) => {
    return trips.filter((trip) => {
      // オフ会は除外
      if (trip.type === 'meetup') return false;
      const tripStart = new Date(trip.startDate);
      const tripEnd = new Date(trip.endDate);
      const checkDate = new Date(date);
      
      tripStart.setHours(0, 0, 0, 0);
      tripEnd.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate >= tripStart && checkDate <= tripEnd;
    });
  };

  const handlePrevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="bg-white">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
          ←
        </Button>
        <h2 className="text-gray-900">
          {year}年 {month + 1}月
        </h2>
        <Button variant="ghost" size="sm" onClick={handleNextMonth}>
          →
        </Button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* 曜日ヘッダー */}
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`bg-gray-50 py-2 text-center text-xs text-gray-600 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : ''
            }`}
          >
            {day}
          </div>
        ))}

        {/* 日付セル */}
        {calendarDays.map((date, index) => {
          const dayTrips = getTripsForDate(date);
          const isCurrent = isCurrentMonth(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`bg-white min-h-16 p-1 flex flex-col items-center relative group ${
                !isCurrent ? 'opacity-40' : ''
              }`}
            >
              <div className="flex items-center gap-0.5">
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                    isTodayDate
                      ? 'bg-blue-600 text-white'
                      : index % 7 === 0
                      ? 'text-red-600'
                      : index % 7 === 6
                      ? 'text-blue-600'
                      : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </div>
                {isCurrent && (
                  <button
                    onClick={() => onDateClick?.(date)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    title="予定を追加"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* 旅行予定がある場合 */}
              {dayTrips.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="w-full mt-1">
                      <div className="flex items-center justify-center">
                        <div className={`px-2 py-0.5 rounded-full text-[10px] ${
                          dayTrips.some(t => t.isRecruitment)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {dayTrips.length}人
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm" align="center">
                    <div className="space-y-2">
                      <div>
                        <h3 className="text-gray-900">
                          {date.getMonth() + 1}月{date.getDate()}日の予定
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {dayTrips.length}件の旅行予定
                        </p>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {dayTrips.map((trip) => (
                          <div
                            key={trip.id}
                            className="p-2 bg-gray-50 rounded space-y-1"
                          >
                            <div className="flex items-start gap-2">
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={trip.userAvatar} />
                                <AvatarFallback className="text-xs">
                                  {trip.userName?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-gray-900">
                                  {trip.userName}
                                  {trip.isRecruitment && (
                                    <span className="text-green-600 ml-1.5">
                                      （合流募集）
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {trip.country} - {trip.city}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {trip.startDate.getMonth() + 1}/
                                  {trip.startDate.getDate()} -{' '}
                                  {trip.endDate.getMonth() + 1}/
                                  {trip.endDate.getDate()}
                                </div>
                                {trip.description && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {trip.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
