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
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { COUNTRIES_CITIES, REGIONS, COUNTRIES_BY_REGION } from './countries-data';
import { type AuthUser } from '../utils/auth';

interface AddTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trip: Omit<Trip, 'id'>) => void;
  initialDate?: Date;
  authUser: AuthUser | null;
}

export function AddTripDialog({ isOpen, onClose, onAdd, initialDate, authUser }: AddTripDialogProps) {
  const [userName, setUserName] = useState(authUser?.displayName || '');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isRecruitment, setIsRecruitment] = useState(false);
  const [recruitmentDetails, setRecruitmentDetails] = useState('');
  const [discordLinked, setDiscordLinked] = useState(false);
  const [minParticipants, setMinParticipants] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);

  const cities = country ? COUNTRIES_CITIES[country] || [] : [];

  // 初期日付を設定
  useEffect(() => {
    if (initialDate && isOpen) {
      setStartDate(initialDate);
    }
  }, [initialDate, isOpen]);

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

    if (
      !userName ||
      !country ||
      !city ||
      !startDate ||
      !endDate
    ) {
      alert('必須項目を入力してください');
      return;
    }

    if (startDate > endDate) {
      alert('終了日は開始日より後にしてください');
      return;
    }

    // 認証が必要
    if (!authUser) {
      alert('旅行予定を追加するには認証が必要です');
      return;
    }

    // 募集人数のバリデーション
    const minNum = minParticipants ? parseInt(minParticipants, 10) : undefined;
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : undefined;

    if (isRecruitment && minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      alert('最大人数は最小人数以上にしてください');
      return;
    }

    onAdd({
      type: 'trip',
      userDiscordId: authUser.discordId,
      userName: authUser.displayName,
      userAvatar: authUser.avatar,
      country,
      city,
      startDate,
      endDate,
      description: description || undefined,
      isRecruitment,
      recruitmentDetails: isRecruitment && recruitmentDetails ? recruitmentDetails : undefined,
      discordLinked: isRecruitment ? discordLinked : false,
      minParticipants: isRecruitment ? minNum : undefined,
      maxParticipants: isRecruitment ? maxNum : undefined,
      participants: [],
    });

    // フォームをリセット（認証ユーザー名は保持）
    setUserName(authUser?.displayName || '');
    setCountry('');
    setCity('');
    setDescription('');
    setStartDate(undefined);
    setEndDate(undefined);
    setIsRecruitment(false);
    setRecruitmentDetails('');
    setDiscordLinked(false);
    setMinParticipants('');
    setMaxParticipants('');

    onClose();
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setCity(''); // 国を変更したら都市をリセット
    setShowCountrySheet(false);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCitySheet(false);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '選択してください';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>旅行予定を追加</DialogTitle>
            <DialogDescription className="text-xs">
              あなたの海外旅行予定を共有しましょう
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="userName" className="text-xs">名前 *</Label>
              <Input
                id="userName"
                name="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="山田太郎"
                className="h-9 text-sm"
                required
                disabled={!!authUser}
              />
              {authUser && (
                <p className="text-xs text-gray-500">
                  認証済みユーザー名が自動入力されています
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">国 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-start text-left text-sm"
                  onClick={() => setShowCountrySheet(true)}
                >
                  {country || '国を選択'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">都市 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-start text-left text-sm"
                  onClick={() => {
                    if (!country) {
                      alert('まず国を選択してください');
                      return;
                    }
                    setShowCitySheet(true);
                  }}
                  disabled={!country}
                >
                  {city || '都市を選択'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">開始日 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-start text-left text-sm"
                  onClick={() => setShowStartCalendar(true)}
                >
                  {formatDate(startDate)}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">終了日 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 justify-start text-left text-sm"
                  onClick={() => setShowEndCalendar(true)}
                >
                  {formatDate(endDate)}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs">説明（任意）</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="旅行の目的や予定を書いてください"
                className="text-sm resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recruitment-dialog"
                  checked={isRecruitment}
                  onCheckedChange={(checked) => setIsRecruitment(checked as boolean)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="recruitment-dialog"
                    className="text-xs cursor-pointer"
                  >
                    <span className="text-gray-900">合流募集として追加</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      この予定を公開して仲間を募集
                    </p>
                  </label>
                </div>
              </div>

              {isRecruitment && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="recruitmentDetails" className="text-xs">募集内容</Label>
                    <Textarea
                      id="recruitmentDetails"
                      name="recruitmentDetails"
                      value={recruitmentDetails}
                      onChange={(e) => setRecruitmentDetails(e.target.value)}
                      placeholder="例：一緒に観光したい方募集！美術館巡りやカフェ探索が好きです。"
                      className="text-sm resize-none bg-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="minParticipants" className="text-xs text-gray-600">最小人数（任意）</Label>
                      <Input
                        id="minParticipants"
                        type="number"
                        min="1"
                        value={minParticipants}
                        onChange={(e) => setMinParticipants(e.target.value)}
                        placeholder="例: 2"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="maxParticipants" className="text-xs text-gray-600">最大人数（任意）</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        min="1"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        placeholder="例: 5"
                        className="h-9 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <Checkbox
                      id="discord-linked-dialog"
                      checked={discordLinked}
                      onCheckedChange={(checked) => setDiscordLinked(checked as boolean)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="discord-linked-dialog"
                        className="text-xs cursor-pointer"
                      >
                        <span className="text-gray-900">Discord連携</span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          コミュニティサロンに募集を投稿します
                        </p>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                キャンセル
              </Button>
              <Button type="submit" size="sm">追加</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 開始日カレンダー */}
      <Sheet open={showStartCalendar} onOpenChange={setShowStartCalendar}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>開始日を選択</SheetTitle>
            <SheetDescription>旅行の開始日をカレンダーから選んでください</SheetDescription>
          </SheetHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                setStartDate(date);
                setShowStartCalendar(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 終了日カレンダー */}
      <Sheet open={showEndCalendar} onOpenChange={setShowEndCalendar}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>終了日を選択</SheetTitle>
            <SheetDescription>旅行の終了日をカレンダーから選んでください</SheetDescription>
          </SheetHeader>
          <div className="flex justify-center py-4">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                setEndDate(date);
                setShowEndCalendar(false);
              }}
              disabled={(date) => startDate ? date < startDate : false}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 国選択 */}
      <Sheet open={showCountrySheet} onOpenChange={setShowCountrySheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>国を選択</SheetTitle>
            <SheetDescription>訪問する国を選んでください</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full mt-4">
            <div className="space-y-4 pb-8">
              {REGIONS.map((region) => {
                const countriesInRegion = COUNTRIES_BY_REGION[region];
                return (
                  <div key={region}>
                    <div className="text-xs text-gray-500 mb-2 px-2">
                      {region}
                    </div>
                    <div className="space-y-1">
                      {countriesInRegion.map((countryOption) => (
                        <Button
                          key={countryOption.name}
                          variant={country === countryOption.name ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handleCountrySelect(countryOption.name)}
                        >
                          {countryOption.emoji} {countryOption.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 都市選択 */}
      <Sheet open={showCitySheet} onOpenChange={setShowCitySheet}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{country}の都市を選択</SheetTitle>
            <SheetDescription>訪問する都市を選んでください</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-full mt-4">
            <div className="space-y-1 pb-8">
              {cities.map((cityOption) => (
                <Button
                  key={cityOption}
                  variant={city === cityOption ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleCitySelect(cityOption)}
                >
                  {cityOption}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
