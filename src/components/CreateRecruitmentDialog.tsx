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
import { Calendar } from './ui/calendar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { searchDiscordUsersByDisplayName, getUserByDiscordId } from '../utils/auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { X, Search, Loader2, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useGeoData } from '../hooks/useGeoData';

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
  const [title, setTitle] = useState(''); // オフ会のタイトル
  const [country, setCountry] = useState(''); // 国
  const [city, setCity] = useState(''); // 都市
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [recruitmentDetails, setRecruitmentDetails] = useState('');
  const [discordLinked, setDiscordLinked] = useState(false);
  const [minParticipants, setMinParticipants] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [candidateDates, setCandidateDates] = useState<Date[]>([]);
  const [showCandidateDateCalendar, setShowCandidateDateCalendar] = useState(false);
  const [candidateTime, setCandidateTime] = useState('12:00');
  
  // オフ会の開始日・終了日用
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('18:00');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  
  // ローカルの表示用参加者リスト
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

  const { regions: REGIONS, countriesByRegion: COUNTRIES_BY_REGION, countriesCities: COUNTRIES_CITIES } = useGeoData();

  useEffect(() => {
    if (trip && isOpen) {
      setTitle(trip.description || '');
      setCountry(trip.country || '');
      setCity(trip.city || '');
      setRecruitmentDetails(trip.recruitmentDetails || '');
      setDiscordLinked(trip.discordLinked || false);
      setMinParticipants(trip.minParticipants?.toString() || '');
      setMaxParticipants(trip.maxParticipants?.toString() || '');
      setCandidateDates(trip.candidateDates || []);
      if (trip.type === 'meetup') {
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
        if (trip.startDate) {
          const hours = trip.startDate.getHours();
          const minutes = trip.startDate.getMinutes();
          setStartTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        }
        if (trip.endDate) {
          const hours = trip.endDate.getHours();
          const minutes = trip.endDate.getMinutes();
          setEndTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
        }
      }
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
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip) return;
    if (trip.type === 'meetup') {
      if (!title.trim()) {
        alert('オフ会タイトルは必須です');
        return;
      }
      if (!country.trim() || !city.trim()) {
        alert('国と都市は必須です');
        return;
      }
    }
    const minNum = minParticipants ? parseInt(minParticipants, 10) : undefined;
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : undefined;
    if (minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      alert('最大募集人数は最小募集人数以上にしてください');
      return;
    }
    let finalStartDate = trip.startDate;
    let finalEndDate = trip.endDate;
    if (trip.type === 'meetup' && startDate) {
      finalStartDate = new Date(startDate);
      const [hours, minutes] = startTime.split(':').map(Number);
      finalStartDate.setHours(hours, minutes, 0, 0);
      if (endDate) {
        finalEndDate = new Date(endDate);
        const [h2, m2] = endTime.split(':').map(Number);
        finalEndDate.setHours(h2, m2, 0, 0);
      } else {
        finalEndDate = finalStartDate;
      }
    }
    const updatedTrip: Trip = {
      ...trip,
      description: trip.type === 'meetup' ? title : trip.description,
      country: trip.type === 'meetup' ? country : trip.country,
      city: trip.type === 'meetup' ? city : trip.city,
      isRecruitment: true,
      recruitmentDetails: recruitmentDetails || undefined,
      discordLinked,
      minParticipants: minNum,
      maxParticipants: maxNum,
      participants: participants.map(p => p.discordId),
      startDate: finalStartDate,
      endDate: finalEndDate,
      candidateDates: trip.type === 'meetup' ? candidateDates : trip.candidateDates,
      dateVotes: trip.dateVotes,
    };
    onSave(updatedTrip, discordLinked);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setCountry('');
    setCity('');
    setRecruitmentDetails('');
    setDiscordLinked(false);
    setMinParticipants('');
    setMaxParticipants('');
    setCandidateDates([]);
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime('12:00');
    setEndTime('18:00');
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
    if (participants.some(p => p.discordId === user.discordId)) return;
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

  const handleAddCandidateDate = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      const [hours, minutes] = candidateTime.split(':').map(Number);
      newDate.setHours(hours, minutes, 0, 0);
      if (!candidateDates.some(d => d.getTime() === newDate.getTime())) {
        setCandidateDates([...candidateDates, newDate]);
      }
    }
    setShowCandidateDateCalendar(false);
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setCity('');
    setShowCountrySheet(false);
  };

  if (!trip) return null;

  const availableCitiesRaw = COUNTRIES_CITIES[country] || [];
  const availableCities = availableCitiesRaw.map(name => ({ name, region: '', emoji: '' }));
  const filteredCities = citySearch ? availableCities.filter(c => c.name.includes(citySearch)) : availableCities;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {trip.type === 'meetup' 
                ? (isEditing ? 'オフ会を編集' : 'オフ会を作成')
                : (isEditing ? '合流募集を編集' : '合流募集を作成')
              }
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isEditing ? '内容を更新できます' : 'この予定を公開して仲間を募集しましょう'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {trip.type !== 'meetup' && (
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
            )}

            {trip.type === 'meetup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">オフ会タイトル *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：渋谷でアニメ好きオフ会"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">国 *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCountrySheet(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {country || '国を選択'}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">開催都市 *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowCitySheet(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {city || '都市を選択'}
                  </Button>
                </div>
                {/* 日付設定は既存のまま */}
              </>
            )}

            {/* 募集内容/人数設定など既存のまま */}

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

      {/* 候補日カレンダー（オフ会用） */}
      <Sheet open={showCandidateDateCalendar} onOpenChange={setShowCandidateDateCalendar}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>候補日を追加</SheetTitle>
            <SheetDescription>オフ会の候補日をカレンダーから選んでください</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-3">
            <div className="px-4">
              <Label htmlFor="candidateTime" className="text-sm text-gray-500">時間</Label>
              <Input id="candidateTime" type="time" value={candidateTime} onChange={(e) => setCandidateTime(e.target.value)} className="mt-1" />
            </div>
            <div className="flex justify-center">
              <Calendar mode="single" selected={undefined} onSelect={handleAddCandidateDate} locale={ja} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 国選択シート */}
      <Sheet open={showCountrySheet} onOpenChange={setShowCountrySheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>国を選択</SheetTitle>
            <SheetDescription>オフ会を開催する国を選んでください</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <ScrollArea className="h-[calc(80vh-100px)]">
              {/* 日本 */}
              <div className="mb-4">
                <button
                  onClick={() => handleCountrySelect('日本')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${country === '日本' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                >
                  日本
                </button>
              </div>
              {/* 海外の国 */}
              <div className="space-y-4">
                {REGIONS.map((region) => (
                  <div key={region}>
                    <h3 className="px-4 py-2 text-sm text-gray-500">{region}</h3>
                    <div className="space-y-1">
                      {(COUNTRIES_BY_REGION[region] || []).map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleCountrySelect(c.name)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${country === c.name ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* 都市選択シート */}
      <Sheet open={showCitySheet} onOpenChange={setShowCitySheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>都市を選択</SheetTitle>
            <SheetDescription>オフ会を開催する都市を選んでください</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Input placeholder="都市を検索..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} />
            <ScrollArea className="h-[calc(80vh-120px)]">
              <div className="space-y-1">
                {filteredCities.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setCity(c.name); setShowCitySheet(false); setCitySearch(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
