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
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EditTripDialogProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (trip: Trip) => void;
}

export function EditTripDialog({
  trip,
  isOpen,
  onClose,
  onSave,
}: EditTripDialogProps) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isRecruitment, setIsRecruitment] = useState(false);
  const [recruitmentDetails, setRecruitmentDetails] = useState('');
  const [discordLinked, setDiscordLinked] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [minParticipants, setMinParticipants] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<string>('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);

  const cities = country ? COUNTRIES_CITIES[country] || [] : [];

  useEffect(() => {
    if (trip && isOpen) {
      setCountry(trip.country);
      setCity(trip.city);
      setDescription(trip.description || '');
      setStartDate(trip.startDate);
      setEndDate(trip.endDate);
      setIsRecruitment(trip.isRecruitment || false);
      setRecruitmentDetails(trip.recruitmentDetails || '');
      setDiscordLinked(trip.discordLinked || false);
      setIsHidden(trip.isHidden || false);
      setMinParticipants(trip.minParticipants?.toString() || '');
      setMaxParticipants(trip.maxParticipants?.toString() || '');
    }
  }, [trip, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!trip || !country || !city || !startDate || !endDate) {
      alert('必須項目を入力してください');
      return;
    }

    if (startDate > endDate) {
      alert('終了日は開始日より後にしてください');
      return;
    }

    // 募集人数のバリデーション
    const minNum = minParticipants ? parseInt(minParticipants, 10) : undefined;
    const maxNum = maxParticipants ? parseInt(maxParticipants, 10) : undefined;

    if (isRecruitment && minNum !== undefined && maxNum !== undefined && minNum > maxNum) {
      alert('最大人数は最小人数以上にしてください');
      return;
    }

    const updatedTrip: Trip = {
      ...trip,
      // userDiscordId, userName, userAvatarは変更しない（ユーザーマスターから取得される）
      country,
      city,
      startDate,
      endDate,
      description,
      isRecruitment,
      recruitmentDetails: isRecruitment && recruitmentDetails ? recruitmentDetails : undefined,
      discordLinked: isRecruitment ? discordLinked : false,
      isHidden,
      minParticipants: isRecruitment ? minNum : undefined,
      maxParticipants: isRecruitment ? maxNum : undefined,
    };

    onSave(updatedTrip);
    onClose();
  };

  const handleCountrySelect = (selectedCountry: string) => {
    setCountry(selectedCountry);
    setCity('');
    setShowCountrySheet(false);
    setShowCitySheet(true);
  };

  const handleCitySelect = (selectedCity: string) => {
    setCity(selectedCity);
    setShowCitySheet(false);
  };

  if (!trip) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>予定を編集</DialogTitle>
            <DialogDescription>
              旅行予定の詳細を編集します
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="edit-country">国</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCountrySheet(true)}
              >
                {country || '国を選択'}
              </Button>
            </div>

            {country && (
              <div>
                <Label htmlFor="edit-city">都市</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowCitySheet(true)}
                >
                  {city || '都市を選択'}
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="edit-startDate">開始日</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowStartCalendar(true)}
              >
                {startDate
                  ? format(startDate, 'yyyy年M月d日(E)', { locale: ja })
                  : '日付を選択'}
              </Button>
            </div>

            <div>
              <Label htmlFor="edit-endDate">終了日</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowEndCalendar(true)}
              >
                {endDate
                  ? format(endDate, 'yyyy年M月d日(E)', { locale: ja })
                  : '日付を選択'}
              </Button>
            </div>

            <div>
              <Label htmlFor="edit-description">メモ（任意）</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例：紅葉シーズンの京都観光"
                rows={3}
              />
            </div>

            <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-hidden"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="edit-hidden"
                    className="text-xs cursor-pointer"
                  >
                    <span className="text-gray-900">みんなの予定に非表示</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      自分だけが見られる予定にする
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-recruitment"
                  checked={isRecruitment}
                  onCheckedChange={(checked) => setIsRecruitment(checked as boolean)}
                />
                <div className="flex-1">
                  <label
                    htmlFor="edit-recruitment"
                    className="text-xs cursor-pointer"
                  >
                    <span className="text-gray-900">合流募集</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      この予定を公開して仲間を募集
                    </p>
                  </label>
                </div>
              </div>

              {isRecruitment && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-recruitmentDetails" className="text-xs">募集内容</Label>
                    <Textarea
                      id="edit-recruitmentDetails"
                      value={recruitmentDetails}
                      onChange={(e) => setRecruitmentDetails(e.target.value)}
                      placeholder="例：一緒に観光したい方募集！美術館巡りやカフェ探索が好きです。"
                      className="text-sm resize-none bg-white"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-minParticipants" className="text-xs text-gray-600">最小人数（任意）</Label>
                      <Input
                        id="edit-minParticipants"
                        type="number"
                        min="1"
                        value={minParticipants}
                        onChange={(e) => setMinParticipants(e.target.value)}
                        placeholder="例: 2"
                        className="h-9 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-maxParticipants" className="text-xs text-gray-600">最大人数（任意）</Label>
                      <Input
                        id="edit-maxParticipants"
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
                      id="edit-discord-linked"
                      checked={discordLinked}
                      onCheckedChange={(checked) => setDiscordLinked(checked as boolean)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="edit-discord-linked"
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

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                キャンセル
              </Button>
              <Button type="submit" className="flex-1">
                保存
              </Button>
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
                          key={countryOption}
                          variant={country === countryOption ? "default" : "ghost"}
                          className="w-full justify-start"
                          onClick={() => handleCountrySelect(countryOption)}
                        >
                          {countryOption}
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
