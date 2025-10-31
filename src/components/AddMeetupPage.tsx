import { useState, useEffect } from 'react';
import { Trip } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { type AuthUser } from '../utils/auth';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useGeoData } from '../hooks/useGeoData';

interface AddMeetupPageProps {
  onAdd: (trip: Omit<Trip, 'id'>) => void;
  onCancel: () => void;
  authUser: AuthUser | null;
}

export function AddMeetupPage({ onAdd, onCancel, authUser }: AddMeetupPageProps) {
  const [userName, setUserName] = useState(authUser?.displayName || '');
  const [country, setCountry] = useState('日本');
  const [city, setCity] = useState('');
  const [title, setTitle] = useState(''); // オフ会タイトル
  const [recruitmentDetails, setRecruitmentDetails] = useState(''); // 募集内容
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('18:00');
  const [minParticipants, setMinParticipants] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [useCandidateDates, setUseCandidateDates] = useState(false);
  const [candidateDates, setCandidateDates] = useState<Date[]>([]);
  const [showCandidateDateCalendar, setShowCandidateDateCalendar] = useState(false);
  const [candidateTime, setCandidateTime] = useState('12:00');

  const { regions: REGIONS, countriesByRegion: COUNTRIES_BY_REGION, countriesCities: COUNTRIES_CITIES } = useGeoData();

  // 認証ユーザーが変わったら名前を更新
  useEffect(() => {
    if (authUser) {
      setUserName(authUser.displayName);
    } else {
      setUserName('');
    }
  }, [authUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 国、都市、タイトルは必須
    if (!country || !city || !title) {
      alert('国、都市、オフ会タイトルは必須です');
      return;
    }

    // 認証が必要
    if (!authUser) {
      alert('オフ会を追加するには認証が必要です');
      return;
    }

    // 候補日を使用する場合は候補日が必須
    if (useCandidateDates && candidateDates.length === 0) {
      alert('候補日を少なくとも1つ追加してください');
      return;
    }

    // 通常の日付を使用する場合のバリデーション
    if (!useCandidateDates && startDate && endDate && endDate < startDate) {
      alert('終了日は開始日以降にしてください');
      return;
    }

    // 人数設定のバリデーション
    const min = minParticipants ? parseInt(minParticipants) : undefined;
    const max = maxParticipants ? parseInt(maxParticipants) : undefined;

    if (min !== undefined && max !== undefined && min > max) {
      alert('最小人数は最大人数以下にしてください');
      return;
    }

    // 開始日・終了日に時間を適用
    const finalStartDate = startDate ? new Date(startDate) : new Date();
    const finalEndDate = endDate ? new Date(endDate) : (startDate ? new Date(startDate) : new Date());
    
    if (startDate && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      finalStartDate.setHours(hours, minutes, 0, 0);
    }
    
    if (endDate && endTime) {
      const [hours, minutes] = endTime.split(':').map(Number);
      finalEndDate.setHours(hours, minutes, 0, 0);
    }

    const newTrip: Omit<Trip, 'id'> = {
      type: 'meetup',
      userDiscordId: authUser.discordId,
      userName: authUser.displayName,
      userAvatar: authUser.avatar,
      country,
      city,
      startDate: finalStartDate,
      endDate: finalEndDate,
      description: title, // タイトルをdescriptionに格納
      isOwn: true,
      isRecruitment: true, // オフ会は常に募集
      recruitmentDetails: recruitmentDetails || undefined,
      discordLinked: false,
      isHidden: false, // オフ会は常に表示
      minParticipants: minParticipants ? parseInt(minParticipants) : undefined,
      maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
      participants: [],
      candidateDates: useCandidateDates ? candidateDates : undefined,
      dateVotes: useCandidateDates ? {} : undefined,
    };

    onAdd(newTrip);
  };

  const isJapan = country === '日本';
  
  // 日本の場合はJapanCity[]、海外の場合はstring[]
  const availableCitiesRaw = COUNTRIES_CITIES[country] || [];
  
  // 統一されたフォーマットに変換
  const availableCities = availableCitiesRaw.map(name => ({ name, region: '', emoji: '' }));
  
  const filteredCities = citySearch
    ? availableCities.filter(c => c.name.includes(citySearch))
    : availableCities;

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setCity(''); // 国を変更したら都市をリセット
    setShowCountrySheet(false);
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

  const handleRemoveCandidateDate = (index: number) => {
    setCandidateDates(candidateDates.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="flex-1">オフ会を追加</h1>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 国選択 */}
        <div className="space-y-2">
          <Label htmlFor="country">開催国 *</Label>
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

        {/* 都市選択 */}
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

        {/* オフ会タイトル */}
        <div className="space-y-2">
          <Label htmlFor="title">オフ会タイトル *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：渋谷でアニメ好きオフ会"
          />
        </div>

        {/* 募集内容 */}
        <div className="space-y-2">
          <Label htmlFor="recruitmentDetails">募集内容</Label>
          <Textarea
            id="recruitmentDetails"
            value={recruitmentDetails}
            onChange={(e) => setRecruitmentDetails(e.target.value)}
            placeholder="どんな人と何をしたいか詳しく書いてください（例：アニメやゲームが好きな方、一緒にカフェでお話しませんか？初心者でも大歓迎です！）"
            rows={4}
          />
        </div>

        {/* 日程設定 */}
        <div className="space-y-3 p-4 border rounded-lg bg-white">
          <div className="flex items-center gap-2">
            <Checkbox
              id="useCandidateDates"
              checked={useCandidateDates}
              onCheckedChange={(checked) => setUseCandidateDates(!!checked)}
            />
            <Label htmlFor="useCandidateDates" className="cursor-pointer">
              候補日を設定して投票で決める
            </Label>
          </div>

          {useCandidateDates ? (
            /* 候補日設定 */
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>候補日</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCandidateDateCalendar(!showCandidateDateCalendar)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    候補日を追加
                  </Button>
                </div>
                {showCandidateDateCalendar && (
                  <div className="border rounded-lg p-3 bg-white shadow-lg">
                    <div className="mb-3">
                      <Label htmlFor="candidateTime" className="text-sm text-gray-500">時間</Label>
                      <Input
                        id="candidateTime"
                        type="time"
                        value={candidateTime}
                        onChange={(e) => setCandidateTime(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Calendar
                      mode="single"
                      onSelect={handleAddCandidateDate}
                      locale={ja}
                    />
                  </div>
                )}
                {candidateDates.length > 0 && (
                  <div className="space-y-2">
                    {candidateDates.map((date, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">
                          {format(date, 'M月d日(E) HH:mm', { locale: ja })}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveCandidateDate(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 通常の日程設定 */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">開始日</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-start"
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {startDate ? format(startDate, 'M月d日', { locale: ja }) : '未定'}
                  </Button>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                {showStartCalendar && (
                  <div className="border rounded-lg p-3 bg-white shadow-lg absolute z-10">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setShowStartCalendar(false);
                      }}
                      locale={ja}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-gray-500">終了日</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 justify-start"
                    onClick={() => setShowEndCalendar(!showEndCalendar)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {endDate ? format(endDate, 'M月d日', { locale: ja }) : '未定'}
                  </Button>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                {showEndCalendar && (
                  <div className="border rounded-lg p-3 bg-white shadow-lg absolute z-10">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setShowEndCalendar(false);
                      }}
                      disabled={(date) => startDate ? date < startDate : false}
                      locale={ja}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 人数設定（オプション） */}
        <div className="space-y-4 p-4 border rounded-lg bg-white">
          <Label>募集人数（設定しなくてもOK）</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minParticipants" className="text-sm text-gray-500">最小人数</Label>
              <Input
                id="minParticipants"
                type="number"
                min="1"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
                placeholder="例: 3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxParticipants" className="text-sm text-gray-500">最大人数</Label>
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="例: 10"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            人数を設定すると、定員に達したときに自動的に募集終了になります
          </p>
        </div>
      </div>

      {/* 国選択シート */}
      <Sheet open={showCountrySheet} onOpenChange={setShowCountrySheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>国を選択</SheetTitle>
            <SheetDescription>オフ会を開催する国を選んでください</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <ScrollArea className="h-[calc(80vh-80px)]">
              {/* 日本 */}
              <div className="mb-4">
                <button
                  onClick={() => handleCountrySelect('日本')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    country === '日本' ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">🇯🇵</span>
                  日本
                </button>
              </div>

              {/* 海外の国 */}
              <div className="space-y-4">
                {REGIONS.map((region) => (
                  <div key={region}>
                    <h3 className="px-4 py-2 text-sm text-gray-500">{region}</h3>
                    <div className="space-y-1">
                      {COUNTRIES_BY_REGION[region].map((c) => (
                        <button
                          key={c.name}
                          onClick={() => handleCountrySelect(c.name)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            country === c.name ? 'bg-blue-100' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">{c.emoji}</span>
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
            <Input
              placeholder="都市を検索..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
            />
            <ScrollArea className="h-[calc(80vh-120px)]">
              {citySearch ? (
                <div className="space-y-1">
                  {filteredCities.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setCity(c.name);
                        setShowCitySheet(false);
                        setCitySearch('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {c.emoji && <span className="mr-2">{c.emoji}</span>}
                      {c.name}
                      {c.region && <span className="text-sm text-gray-500 ml-2">({c.region})</span>}
                    </button>
                  ))}
                </div>
              ) : isJapan ? (
                <div className="space-y-4">
                  {/* JAPAN_REGIONS is no longer imported, so this block will be removed or commented out */}
                  {/* {JAPAN_REGIONS.map((region) => ( */}
                  {/*   <div key={region}> */}
                  {/*     <h3 className="px-4 py-2 text-sm text-gray-500">{region}</h3> */}
                  {/*     <div className="space-y-1"> */}
                  {/*       {JAPAN_CITIES_BY_REGION[region].map((c) => ( */}
                  {/*         <button */}
                  {/*           key={c.name} */}
                  {/*           onClick={() => { */}
                  {/*             setCity(c.name); */}
                  {/*             setShowCitySheet(false); */}
                  {/*           }} */}
                  {/*           className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors" */}
                  {/*         > */}
                  {/*           <span className="mr-2">{c.emoji}</span> */}
                  {/*           {c.name} */}
                  {/*         </button> */}
                  {/*       ))} */}
                  {/*     </div> */}
                  {/*   </div> */}
                  {/* ))} */}
                </div>
              ) : (
                /* 海外の都市 */
                <div className="space-y-1">
                  {availableCities.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setCity(c.name);
                        setShowCitySheet(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
