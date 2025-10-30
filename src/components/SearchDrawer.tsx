import { useState, useMemo } from 'react';
import { Trip } from '../App';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './ui/drawer';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { MapPin, Calendar, Users, X, Check } from 'lucide-react';
import { REGIONS, COUNTRIES_BY_REGION, COUNTRIES_CITIES, Region } from './countries-data';

interface SearchDrawerProps {
  trips: Trip[];
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDrawer({ trips, isOpen, onClose }: SearchDrawerProps) {
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [userSearchInput, setUserSearchInput] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [recruitmentOnly, setRecruitmentOnly] = useState(false);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // ユニークなユーザー名リストを取得
  const userNames = useMemo(() => {
    const uniqueUsers = new Map<string, { name: string; avatar: string }>();
    trips.forEach(trip => {
      if (!trip.isHidden && !uniqueUsers.has(trip.userName)) {
        uniqueUsers.set(trip.userName, {
          name: trip.userName,
          avatar: trip.userAvatar
        });
      }
    });
    return Array.from(uniqueUsers.values()).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }, [trips]);

  // ユーザー名の前方一致フィルタリング
  const filteredUserNames = useMemo(() => {
    if (!userSearchInput) return userNames;
    return userNames.filter(user => 
      user.name.toLowerCase().startsWith(userSearchInput.toLowerCase())
    );
  }, [userNames, userSearchInput]);

  // 選択された地域に基づいて国をフィルタリング
  const availableCountries = useMemo(() => {
    if (!selectedRegion) {
      return Object.keys(COUNTRIES_CITIES).sort((a, b) => a.localeCompare(b, 'ja'));
    }
    return COUNTRIES_BY_REGION[selectedRegion as Region]?.map(c => c.name) || [];
  }, [selectedRegion]);

  // 選択された国に基づいて都市をフィルタリング
  const availableCities = useMemo(() => {
    if (!selectedCountry) {
      return [];
    }
    return COUNTRIES_CITIES[selectedCountry] || [];
  }, [selectedCountry]);

  // 地域変更時に国と都市をリセット
  const handleRegionChange = (value: string) => {
    setSelectedRegion(value === 'all' ? '' : value);
    setSelectedCountry('');
    setSelectedCity('');
  };

  // 国変更時に都市をリセット
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value === 'all' ? '' : value);
    setSelectedCity('');
  };

  // 検索フィルタリング
  const searchResults = trips.filter(trip => {
    // 非表示の予定は除外
    if (trip.isHidden) return false;

    // ユーザー名検索
    if (selectedUserName && trip.userName !== selectedUserName) {
      return false;
    }

    // 地域フィルター
    if (selectedRegion) {
      const countriesInRegion = COUNTRIES_BY_REGION[selectedRegion as Region];
      if (!countriesInRegion.some(c => c.name === trip.country)) {
        return false;
      }
    }

    // 国フィルター
    if (selectedCountry && trip.country !== selectedCountry) {
      return false;
    }

    // 都市フィルター
    if (selectedCity && trip.city !== selectedCity) {
      return false;
    }

    // 日付フィルター（開始日）
    if (startDate) {
      if (trip.endDate < startDate) return false;
    }

    // 日付フィルター（終了日）
    if (endDate) {
      if (trip.startDate > endDate) return false;
    }

    // 合流募集のみフィルター
    if (recruitmentOnly && !trip.isRecruitment) return false;

    return true;
  });

  const handleClear = () => {
    setSelectedUserName('');
    setUserSearchInput('');
    setSelectedRegion('');
    setSelectedCountry('');
    setSelectedCity('');
    setStartDate(undefined);
    setEndDate(undefined);
    setRecruitmentOnly(false);
  };

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleUserSelect = (userName: string) => {
    setSelectedUserName(userName);
    setUserSearchInput(userName);
    setShowUserDropdown(false);
  };

  // ドロップダウン外をクリックしたら閉じる
  const handleBlur = () => {
    setTimeout(() => setShowUserDropdown(false), 200);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle>予定を検索</DrawerTitle>
              <DrawerDescription className="text-xs">
                誰がどこに行っているか検索できます
              </DrawerDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* 検索フィールド */}
          <div className="space-y-3">
            <div className="space-y-2 relative">
              <Label htmlFor="user-search" className="text-xs">
                ユーザー名
              </Label>
              <div className="relative">
                <Input
                  id="user-search"
                  type="text"
                  placeholder="すべてのユーザー"
                  value={userSearchInput}
                  onChange={(e) => {
                    setUserSearchInput(e.target.value);
                    setShowUserDropdown(true);
                    if (!e.target.value) {
                      setSelectedUserName('');
                    }
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  onBlur={handleBlur}
                  className="pr-8"
                />
                {userSearchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearchInput('');
                      setSelectedUserName('');
                      setShowUserDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {showUserDropdown && filteredUserNames.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserName('');
                      setUserSearchInput('');
                      setShowUserDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    すべてのユーザー
                  </button>
                  {filteredUserNames.map((user) => (
                    <button
                      key={user.name}
                      type="button"
                      onClick={() => handleUserSelect(user.name)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{user.name}</span>
                      {selectedUserName === user.name && (
                        <Check className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-xs">
                地域
              </Label>
              <Select value={selectedRegion || 'all'} onValueChange={handleRegionChange}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="すべての地域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての地域</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-xs">
                国
              </Label>
              <Select 
                value={selectedCountry || 'all'} 
                onValueChange={handleCountryChange}
                disabled={!selectedRegion}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="すべての国" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての国</SelectItem>
                  {availableCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs">
                都市
              </Label>
              <Select 
                value={selectedCity || 'all'} 
                onValueChange={(value) => setSelectedCity(value === 'all' ? '' : value)}
                disabled={!selectedCountry}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="すべての都市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての都市</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">
                  開始日以降
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left h-9 text-sm"
                  onClick={() => setShowStartCalendar(true)}
                >
                  {startDate ? formatDate(startDate) : '日付を選択'}
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">
                  終了日以前
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left h-9 text-sm"
                  onClick={() => setShowEndCalendar(true)}
                >
                  {endDate ? formatDate(endDate) : '日付を選択'}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="recruitment-only"
                checked={recruitmentOnly}
                onCheckedChange={(checked) => setRecruitmentOnly(checked as boolean)}
              />
              <label htmlFor="recruitment-only" className="text-xs cursor-pointer">
                合流募集のみ表示
              </label>
            </div>

            {(selectedUserName || selectedRegion || selectedCountry || selectedCity || startDate || endDate || recruitmentOnly) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="w-full text-xs"
              >
                検索条件をクリア
              </Button>
            )}
          </div>

          {/* 検索結果 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs text-gray-500">
                検索結果：{searchResults.length}件
              </h3>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">該当する予定がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((trip) => (
                  <Card key={trip.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={trip.userAvatar} />
                        <AvatarFallback>
                          {trip.userName?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 mb-1">
                          {trip.userName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{trip.country} - {trip.city}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(trip.startDate, 'M/d', { locale: ja })} - {format(trip.endDate, 'M/d', { locale: ja })}
                          </span>
                        </div>
                        {trip.isRecruitment && (
                          <div className="flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600">合流募集中</span>
                          </div>
                        )}
                        {trip.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                            {trip.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 開始日カレンダー */}
        <Sheet open={showStartCalendar} onOpenChange={setShowStartCalendar}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>開始日を選択</SheetTitle>
              <SheetDescription>検索する開始日をカレンダーから選んでください</SheetDescription>
            </SheetHeader>
            <div className="flex justify-center py-4">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  setShowStartCalendar(false);
                }}
              />
            </div>
            <div className="pb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStartDate(undefined);
                  setShowStartCalendar(false);
                }}
              >
                クリア
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* 終了日カレンダー */}
        <Sheet open={showEndCalendar} onOpenChange={setShowEndCalendar}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>終了日を選択</SheetTitle>
              <SheetDescription>検索する終了日をカレンダーから選んでください</SheetDescription>
            </SheetHeader>
            <div className="flex justify-center py-4">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                  setShowEndCalendar(false);
                }}
              />
            </div>
            <div className="pb-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setEndDate(undefined);
                  setShowEndCalendar(false);
                }}
              >
                クリア
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </DrawerContent>
    </Drawer>
  );
}
