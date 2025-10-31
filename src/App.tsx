import { useState, useEffect, useRef } from 'react';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { MyTripsView } from './components/MyTripsView';
import { RecruitmentsView } from './components/RecruitmentsView';
import { MeetupsView } from './components/MeetupsView';
import { SearchDrawer } from './components/SearchDrawer';
import { CountryFilter, CountryFilter as CountryFilterType } from './components/CountryFilter';
import { AddTripPage } from './components/AddTripPage';
import { AddMeetupPage } from './components/AddMeetupPage';
import { AddTripDialog } from './components/AddTripDialog';
import { EditTripDialog } from './components/EditTripDialog';
import { CreateRecruitmentDialog } from './components/CreateRecruitmentDialog';
import { DiscordAuthDialog } from './components/DiscordAuthDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { COUNTRIES_BY_REGION } from './components/countries-data';
import { Users, User, UserPlus, Search, LogOut, Coffee } from 'lucide-react';
import { 
  requestNotificationPermission, 
  showTripNotification, 
  showRecruitmentNotification,
  getUnreadCount,
  clearUnreadCount,
  checkTripNotifications
} from './utils/notifications';
import { isAuthenticated, getAuthUser, verifyAuthToken, setAuthUser, clearAuthUser, type AuthUser } from './utils/auth';
import { getUserByDiscordId, initUsers } from './utils/users';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover';

export interface Trip {
  id: string;
  type: 'trip' | 'meetup'; // 旅行予定 or オフ会
  userDiscordId: string; // ユーザーのDiscord ID（マスターデータから取得）
  userName: string; // 表示用（後方互換性のため残す）
  userAvatar: string; // 表示用（後方互換性のため残す）
  country: string;
  city: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  isOwn?: boolean; // 自分の予定かどうか
  isRecruitment?: boolean; // 合流募集かどうか
  recruitmentDetails?: string; // 合流募集の詳細
  discordLinked?: boolean; // Discord連携済みかどうか
  isHidden?: boolean; // みんなの予定に非表示かどうか
  minParticipants?: number; // 最小募集人数
  maxParticipants?: number; // 最大募集人数
  participants?: string[]; // 参加者のdiscord ID配列
  candidateDates?: Date[]; // 候補日（オフ会用）
  dateVotes?: { [dateString: string]: string[] }; // 日付ごとの投票者のdiscordId配列
}

/**
 * userDiscordIdからユーザー情報を取得してTripデータを正規化
 * authUserが渡された場合、isOwnフラグも設定する
 */
function normalizeTrip(trip: Trip, authUser?: AuthUser | null): Trip {
  const userData = getUserByDiscordId(trip.userDiscordId);
  const normalized = {
    ...trip,
    userName: userData?.displayName || trip.userName,
    userAvatar: userData?.avatar || trip.userAvatar,
  };
  
  // authUserが渡された場合、isOwnフラグを設定
  if (authUser) {
    normalized.isOwn = trip.userDiscordId === authUser.discordId;
  }
  
  return normalized;
}

// モックデータ
const initialTrips: Trip[] = [
  {
    id: '1',
    type: 'trip',
    userDiscordId: '123456789012345678',
    userName: '田中太郎',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanaka',
    country: '日本',
    city: '東京',
    startDate: new Date(2025, 10, 5),
    endDate: new Date(2025, 10, 10),
    description: '紅葉シーズンの京都観光',
  },
  {
    id: '2',
    type: 'trip',
    userDiscordId: '234567890123456789',
    userName: '佐藤花子',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
    country: 'タイ',
    city: 'バンコク',
    startDate: new Date(2025, 10, 15),
    endDate: new Date(2025, 10, 20),
    description: 'タイ料理とナイトマーケット巡り',
    isRecruitment: true,
    recruitmentDetails: '初めてのバンコクなので、一緒に観光できる方を募集しています！ナイトマーケットやタイ料理を楽しみたいです。女性の方大歓迎です。',
    minParticipants: 2,
    maxParticipants: 4,
    participants: ['456789012345678901'], // 高橋健太
  },
  {
    id: '3',
    type: 'trip',
    userDiscordId: '345678901234567890',
    userName: '鈴木一郎',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suzuki',
    country: 'フランス',
    city: 'パリ',
    startDate: new Date(2025, 10, 8),
    endDate: new Date(2025, 10, 15),
    description: '美術館巡りとカフェ探索',
  },
  {
    id: '4',
    type: 'trip',
    userDiscordId: '567890123456789012',
    userName: '山田美咲',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamada',
    country: 'アメリカ',
    city: 'ニューヨーク',
    startDate: new Date(2025, 10, 12),
    endDate: new Date(2025, 10, 18),
    description: 'ブロードウェイと美術館巡り',
    isRecruitment: true,
    recruitmentDetails: 'ブロードウェイのミュージカル鑑賞とMoMAやメトロポリタン美術館巡りを予定しています。アート好きな方、ご一緒しませんか？',
    minParticipants: 1,
    maxParticipants: 3,
    participants: ['678901234567890123', '345678901234567890'], // 伊藤さくら、鈴木一郎
  },
  {
    id: '5',
    type: 'trip',
    userDiscordId: '456789012345678901',
    userName: '高橋健太',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takahashi',
    country: 'タイ',
    city: 'バンコク',
    startDate: new Date(2025, 10, 16),
    endDate: new Date(2025, 10, 21),
    description: '寺院巡りとタイマッサージ',
  },
  {
    id: '6',
    type: 'trip',
    userDiscordId: '678901234567890123',
    userName: '伊藤さくら',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ito',
    country: 'イタリア',
    city: 'ローマ',
    startDate: new Date(2025, 10, 20),
    endDate: new Date(2025, 10, 27),
    description: '古代遺跡とイタリア料理を堪能',
    isRecruitment: true,
    recruitmentDetails: 'コロッセオやトレヴィの泉など、定番スポットを巡ります。本格的なイタリア料理も楽しみたいです。写真好きな方歓迎！',
    maxParticipants: 5,
  },
  {
    id: '7',
    type: 'trip',
    userDiscordId: '789012345678901234',
    userName: '渡辺隆',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Watanabe',
    country: 'スペイン',
    city: 'バルセロナ',
    startDate: new Date(2025, 11, 1),
    endDate: new Date(2025, 11, 7),
    description: 'サグラダファミリアとビーチ',
  },
  {
    id: '8',
    type: 'trip',
    userDiscordId: '890123456789012345',
    userName: '中村直樹',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakamura',
    country: 'タイ',
    city: 'プーケット',
    startDate: new Date(2025, 11, 5),
    endDate: new Date(2025, 11, 12),
    description: 'ビーチリゾートとダイビング',
    isRecruitment: true,
    minParticipants: 3,
  },
  // オフ会データ
  {
    id: 'meetup1',
    type: 'meetup',
    userDiscordId: '234567890123456789',
    userName: '佐藤花子',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
    country: '日本',
    city: '東京',
    startDate: new Date(2025, 10, 10),
    endDate: new Date(2025, 10, 10),
    description: '渋谷でアニメ・ゲーム好きのオフ会！カフェで楽しくお話しましょう',
    isRecruitment: true,
    recruitmentDetails: 'アニメやゲームが好きな方、一緒にカフェでお話しませんか？初心者でも大歓迎です！',
    minParticipants: 3,
    maxParticipants: 8,
    participants: [],
  },
  {
    id: 'meetup2',
    type: 'meetup',
    userDiscordId: '234567890123456789',
    userName: '佐藤花子',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
    country: '日本',
    city: '大阪',
    startDate: new Date(2025, 10, 15),
    endDate: new Date(2025, 10, 15),
    description: '梅田でランチオフ会！日程調整中',
    isRecruitment: true,
    recruitmentDetails: '美味しいランチを食べながら交流しましょう！20代〜30代の方歓迎です。下記の候補日から都合の良い日に投票してください。',
    minParticipants: 2,
    maxParticipants: 6,
    candidateDates: [
      new Date(2025, 10, 15, 12, 0),
      new Date(2025, 10, 22, 12, 0),
      new Date(2025, 10, 29, 13, 0),
    ],
    dateVotes: {
      [new Date(2025, 10, 15, 12, 0).toISOString()]: ['567890123456789012'],
      [new Date(2025, 10, 22, 12, 0).toISOString()]: ['567890123456789012', '456789012345678901'],
      [new Date(2025, 10, 29, 13, 0).toISOString()]: ['567890123456789012'],
    },
    participants: ['567890123456789012', '456789012345678901'], // 山田美咲、高橋健太
  },
  {
    id: 'meetup3',
    type: 'meetup',
    userDiscordId: '345678901234567890',
    userName: '鈴木一郎',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suzuki',
    country: '日本',
    city: '名古屋',
    startDate: new Date(2025, 10, 20),
    endDate: new Date(2025, 10, 20),
    description: 'ボードゲームオフ会@名古屋駅近く',
    isRecruitment: true,
    recruitmentDetails: 'ボードゲームカフェで遊びましょう！初心者も経験者も大歓迎です。',
    minParticipants: 4,
    maxParticipants: 10,
    participants: ['456789012345678901', '678901234567890123'], // 高橋健太、伊藤さくら
  },
];

export default function App() {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  
  // tripsデータを正規化（userDiscordIdからユーザー情報を取得 & isOwnフラグを設定）
  const normalizedTrips = trips.map(trip => normalizeTrip(trip, authUser));
  const [selectedFilters, setSelectedFilters] = useState<CountryFilterType[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddPage, setShowAddPage] = useState(false);
  const [showAddMeetupPage, setShowAddMeetupPage] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>(undefined);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [recruitmentTrip, setRecruitmentTrip] = useState<Trip | null>(null);
  const [showRecruitmentDialog, setShowRecruitmentDialog] = useState(false);
  const [isEditingRecruitment, setIsEditingRecruitment] = useState(false);
  const [showSearchDrawer, setShowSearchDrawer] = useState(false);
  const [activeView, setActiveView] = useState<'everyone' | 'mine' | 'recruitments' | 'meetups'>('everyone');
  const [unreadCount, setUnreadCountState] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(120);
  const isInitialMount = useRef(true);
  const headerRef = useRef<HTMLElement>(null);

  // 認証状態の確認とトークン検証
  useEffect(() => {
    // URLパラメータからトークンを取得
    const params = new URLSearchParams(window.location.search);
    const token = params.get('auth_token');

    if (token) {
      // トークンがある場合は検証
      verifyAuthToken(token).then((result) => {
        if (result.success && result.user) {
          setAuthUser(result.user);
          setAuthUserState(result.user);
          toast.success(`ようこそ、${result.user.displayName}さん！`, {
            description: '認証が完了しました',
          });
          // URLからトークンを削除
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          toast.error('認証に失敗しました。もう一度お試しください。');
        }
      });
    } else {
      // 既存の認証情報を確認（自動ログイン）
      if (isAuthenticated()) {
        const user = getAuthUser();
        setAuthUserState(user);
        // 自動ログイン成功（サイレント）
      }
      // 未認証でも閲覧は可能（予定追加時に認証を促す）
    }
  }, []);

  // 認証状態の変化を追跡（デバッグ用）
  useEffect(() => {
    console.log('🟢 認証状態が変更されました:', authUser ? authUser.displayName : '未認証');
    if (authUser) {
      initUsers().catch(() => {});
    }
  }, [authUser]);

  // 認証ユーザーが変わったら、自分の予定（isOwn: true）のデモデータを更新
  useEffect(() => {
    if (authUser) {
      setTrips(prevTrips => 
        prevTrips.map(trip => {
          if (trip.isOwn) {
            return {
              ...trip,
              userName: authUser.displayName,
              userAvatar: authUser.avatar,
            };
          }
          return trip;
        })
      );
    }
  }, [authUser]);

  // 初回マウント時に通知の許可をリクエストと未読数を取得、通知チェック
  useEffect(() => {
    if (authUser) {
      requestNotificationPermission();
      setUnreadCountState(getUnreadCount());
      // 予定の通知チェック（前日・当日通知）
      checkTripNotifications(trips);
    }
  }, [authUser, trips]);

  // 未読数を定期的に更新（他のタブで変更された場合も反映）
  useEffect(() => {
    const interval = setInterval(() => {
      setUnreadCountState(getUnreadCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 定期的に通知チェック（前日・当日通知）- 10分ごと
  useEffect(() => {
    const interval = setInterval(() => {
      checkTripNotifications(trips);
    }, 10 * 60 * 1000); // 10分

    return () => clearInterval(interval);
  }, [trips]);

  // ヘッダーの高さを動的に取得
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    // activeViewが変わったときにも高さを再計算
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      clearTimeout(timeoutId);
    };
  }, [activeView, selectedFilters]);

  // 他の人の予定が追加されたときに通知
  useEffect(() => {
    // 初回マウント時はスキップ（モックデータの通知を防ぐ）
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 最後に追加された予定をチェック
    const lastTrip = trips[trips.length - 1];
    if (lastTrip && !lastTrip.isOwn) {
      // 他の人の予定の場合、通知を表示
      if (lastTrip.isRecruitment) {
        showRecruitmentNotification(lastTrip);
      } else {
        showTripNotification(lastTrip);
      }
      // 未読数を更新
      setUnreadCountState(getUnreadCount());
    }
  }, [trips]);

  // 「みんなの予定」タブを見たら未読をクリア
  useEffect(() => {
    if (activeView === 'everyone') {
      clearUnreadCount();
      setUnreadCountState(0);
    }
  }, [activeView]);

  // フィルター済みの旅行予定（みんなの予定では非表示の予定を除外）
  const filteredTrips = (() => {
    // まず非表示の予定を除外（みんなの予定表示用）
    // また、オフ会も除外（オフ会は別タブで表示）
    let visibleTrips = activeView === 'everyone' 
      ? normalizedTrips.filter(trip => !trip.isHidden && trip.type !== 'meetup')
      : normalizedTrips.filter(trip => trip.type !== 'meetup');
    
    // 次にフィルターを適用
    if (selectedFilters.length === 0) {
      return visibleTrips;
    }
    
    return visibleTrips.filter((trip) => {
      return selectedFilters.some((filter) => {
        // 地域フィルター
        if (filter.type === 'region' && filter.region) {
          const countriesInRegion = COUNTRIES_BY_REGION[filter.region];
          return countriesInRegion.some(c => c.name === trip.country);
        }
        
        // 国フィルター
        if (filter.type === 'country' && filter.country) {
          return filter.country === trip.country;
        }
        
        // 都市フィルター
        if (filter.type === 'city' && filter.country && filter.city) {
          return filter.country === trip.country && filter.city === trip.city;
        }
        
        return false;
      });
    });
  })();

  const handleAddTrip = (newTrip: Omit<Trip, 'id'>) => {
    const trip: Trip = {
      ...newTrip,
      id: Date.now().toString(),
      isOwn: true, // 追加した予定は自分の予定
    };
    setTrips([...trips, trip]);
    setShowAddPage(false);
    setShowAddMeetupPage(false);
    setShowAddDialog(false);

    // Discord連携がある場合はトースト表示
    if (newTrip.discordLinked) {
      toast.success('サロンへの募集投稿が完了しました', {
        description: 'Discordに合流募集が投稿されました',
      });
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowEditDialog(true);
  };

  const handleSaveTrip = (updatedTrip: Trip) => {
    const originalTrip = trips.find(t => t.id === updatedTrip.id);
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setShowEditDialog(false);
    setEditingTrip(null);

    // Discord連携が新しく有効になった場合はトースト表示
    if (updatedTrip.discordLinked && !originalTrip?.discordLinked) {
      toast.success('サロンへの募集投稿が完了しました', {
        description: 'Discordに合流募集が投稿されました',
      });
    }
  };

  const handleDeleteTrip = (tripId: string) => {
    setTrips(trips.filter(t => t.id !== tripId));
  };

  const handleToggleHidden = (tripId: string) => {
    setTrips(trips.map(t => {
      if (t.id === tripId) {
        const newIsHidden = !t.isHidden;
        // 非表示にする場合は、合流募集も解除
        if (newIsHidden && t.isRecruitment) {
          return { 
            ...t, 
            isHidden: newIsHidden,
            isRecruitment: false,
            recruitmentDetails: undefined,
            discordLinked: false
          };
        }
        return { ...t, isHidden: newIsHidden };
      }
      return t;
    }));
  };

  const handleToggleRecruitment = (trip: Trip) => {
    if (trip.isRecruitment) {
      // 募集を終了
      setTrips(trips.map(t => 
        t.id === trip.id 
          ? { ...t, isRecruitment: false, recruitmentDetails: undefined, discordLinked: false } 
          : t
      ));
    } else {
      // 合流募集を作成
      setRecruitmentTrip(trip);
      setIsEditingRecruitment(false);
      setShowRecruitmentDialog(true);
    }
  };

  const handleEditRecruitment = (trip: Trip) => {
    setRecruitmentTrip(trip);
    setIsEditingRecruitment(true);
    setShowRecruitmentDialog(true);
  };

  const handleSaveRecruitment = (updatedTrip: Trip, discordLinked: boolean) => {
    const originalTrip = trips.find(t => t.id === updatedTrip.id);
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setShowRecruitmentDialog(false);
    setRecruitmentTrip(null);
    setIsEditingRecruitment(false);

    // Discord連携が新しく有効になった場合のみトースト表示（編集時も考慮）
    if (discordLinked && !originalTrip?.discordLinked) {
      toast.success('サロンへの募集投稿が完了しました', {
        description: 'Discordに合流募集が投稿されました',
      });
    }
  };

  const handleJoinRecruitment = (trip: Trip) => {
    if (!authUser) {
      toast.error('参加するにはログインが必要です');
      return;
    }

    setTrips(trips.map(t => {
      if (t.id === trip.id) {
        const participants = t.participants || [];
        return {
          ...t,
          participants: [...participants, authUser.discordId],
        };
      }
      return t;
    }));

    toast.success('参加しました！');
  };

  const handleLeaveRecruitment = (trip: Trip) => {
    if (!authUser) return;

    setTrips(trips.map(t => {
      if (t.id === trip.id) {
        const participants = t.participants || [];
        return {
          ...t,
          participants: participants.filter(id => id !== authUser.discordId),
        };
      }
      return t;
    }));

    toast.success('参加をキャンセルしました');
  };

  const handleAddParticipant = (trip: Trip, participantDiscordId: string) => {
    setTrips(trips.map(t => {
      if (t.id === trip.id) {
        const participants = t.participants || [];
        // 既に参加している場合は追加しない
        if (participants.includes(participantDiscordId)) {
          toast.info('既に参加しています');
          return t;
        }
        return {
          ...t,
          participants: [...participants, participantDiscordId],
        };
      }
      return t;
    }));

    const userData = getUserByDiscordId(participantDiscordId);
    toast.success(`${userData?.displayName || '参加者'}さんを追加しました`);
  };

  const handleRemoveParticipant = (trip: Trip, participantId: string) => {
    setTrips(trips.map(t => {
      if (t.id === trip.id) {
        const participants = t.participants || [];
        return {
          ...t,
          participants: participants.filter(id => id !== participantId),
        };
      }
      return t;
    }));

    toast.success('参加者を削除しました');
  };

  const handleVoteDate = (trip: Trip, date: Date) => {
    if (!authUser) {
      toast.error('投票するにはログインが必要です');
      return;
    }

    const dateString = date.toISOString();

    setTrips(trips.map(t => {
      if (t.id === trip.id) {
        const dateVotes = t.dateVotes || {};
        const voters = dateVotes[dateString] || [];
        
        // 既に投票している場合は取り消し、していない場合は投票
        const hasVoted = voters.includes(authUser.discordId);
        const newVoters = hasVoted
          ? voters.filter(id => id !== authUser.discordId)
          : [...voters, authUser.discordId];

        return {
          ...t,
          dateVotes: {
            ...dateVotes,
            [dateString]: newVoters,
          },
        };
      }
      return t;
    }));

    toast.success('投票しました');
  };

  const handleDateClick = (date: Date) => {
    setDialogInitialDate(date);
    setShowAddDialog(true);
  };

  const handleLogout = () => {
    console.log('🔴 ログアウト処理開始');
    console.log('🔴 現在の認証状態:', authUser);
    clearAuthUser();
    setAuthUserState(null);
    console.log('🔴 認証状態クリア完了');
    console.log('🔴 LocalStorage確認:', localStorage.getItem('travel_app_auth_user'));
    toast.success('ログアウトしました');
  };

  const handleLogin = () => {
    setShowAuthDialog(true);
  };

  const handleAddClick = () => {
    // 認証チェック（オプショナル - 未認証でも追加可能）
    if (!authUser) {
      toast.info('ログインすると予定管理が便利になります', {
        description: 'ログインしなくても予定は追加できます',
        action: {
          label: 'ログイン',
          onClick: handleLogin,
        },
      });
    }
    // オフ会タブの場合はオフ会追加、それ以外は旅行予定追加
    if (activeView === 'meetups') {
      setShowAddMeetupPage(true);
    } else {
      setShowAddPage(true);
    }
  };


  // 追加ページを表示中
  if (showAddPage) {
    return (
      <AddTripPage
        onAdd={handleAddTrip}
        onCancel={() => setShowAddPage(false)}
        authUser={authUser}
      />
    );
  }

  // オフ会追加ページを表示中
  if (showAddMeetupPage) {
    return (
      <AddMeetupPage
        onAdd={handleAddTrip}
        onCancel={() => setShowAddMeetupPage(false)}
        authUser={authUser}
      />
    );
  }

  // 未認証の場合はログイン画面のみ表示
  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              海外旅行コミュニティ
            </h1>
            <p className="text-gray-600">
              世界中の旅行者と繋がり、一緒に旅をしませんか
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">旅行予定を共有</h3>
                <p className="text-sm text-gray-600">あなたの旅行計画を投稿して、同じ場所に行く仲間を見つけよう</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">合流募集</h3>
                <p className="text-sm text-gray-600">現地で合流したい人を募集して、思い出に残る旅を</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Search className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">かんたん検索</h3>
                <p className="text-sm text-gray-600">国・地域・日付で、あなたにぴったりの旅仲間を探せます</p>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full" 
            onClick={handleLogin}
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Discordでログイン
          </Button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Discordアカウントでログインして、コミュニティに参加しましょう
          </p>
        </div>

        {/* Discord認証ダイアログ */}
        <DiscordAuthDialog
          isOpen={showAuthDialog}
          onAuthSuccess={() => {
            setShowAuthDialog(false);
            // 認証後にユーザー情報を再取得
            const user = getAuthUser();
            setAuthUserState(user);
          }}
        />

        {/* トースト通知 */}
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header ref={headerRef} className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-gray-900">
                {activeView === 'everyone' ? '旅行予定' : activeView === 'mine' ? '自分の旅行予定' : activeView === 'recruitments' ? '合流募集' : 'オフ会、イベント'}
              </h1>
              <p className="text-gray-600 text-sm">
                {activeView === 'everyone' ? '仲間と合流しよう' : activeView === 'mine' ? '予定を管理しましょう' : activeView === 'recruitments' ? '一緒に旅行しませんか' : 'オフ会に参加しよう！'}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowSearchDrawer(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleAddClick}>
                追加
              </Button>
              
              {/* 認証状態表示 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={authUser.avatar} alt={authUser.displayName} />
                      <AvatarFallback>{authUser.displayName?.[0] || authUser.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="flex flex-col">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium leading-none">{authUser.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">
                        {authUser.discordTag}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      ログアウト
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 国・都市フィルター（旅行予定のみ） */}
          {activeView === 'everyone' && (
            <CountryFilter
              selectedFilters={selectedFilters}
              onSelectionChange={setSelectedFilters}
            />
          )}
        </div>
      </header>

      {/* カレンダー/リストタブ（旅行予定のみ、画面上部に固定） */}
      {activeView === 'everyone' && (
        <Tabs defaultValue="calendar" className="w-full">
          <div 
            className="bg-white border-b border-gray-200 sticky z-20"
            style={{ top: `${headerHeight}px` }}
          >
            <TabsList className="w-full rounded-none h-10 bg-gray-50 border-0 p-0">
              <TabsTrigger 
                value="calendar" 
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                カレンダー
              </TabsTrigger>
              <TabsTrigger 
                value="list"
                className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                リスト
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="m-0">
            <CalendarView
              trips={filteredTrips}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDateClick={handleDateClick}
            />
          </TabsContent>

          <TabsContent value="list" className="m-0">
            <ListView trips={filteredTrips} onDateClick={handleDateClick} />
          </TabsContent>
        </Tabs>
      )}

      {/* 自分の旅行予定 */}
      {activeView === 'mine' && (
        <MyTripsView 
          trips={normalizedTrips}
          onEdit={handleEditTrip}
          onDelete={handleDeleteTrip}
          onToggleRecruitment={handleToggleRecruitment}
          onToggleHidden={handleToggleHidden}
          onEditRecruitment={handleEditRecruitment}
        />
      )}

      {/* 合流募集 */}
      {activeView === 'recruitments' && (
        <RecruitmentsView trips={filteredTrips} />
      )}

      {/* オフ会、イベント */}
      {activeView === 'meetups' && (
        <MeetupsView 
          trips={normalizedTrips}
          authUser={authUser}
          onEdit={handleEditTrip}
          onDelete={handleDeleteTrip}
          onToggleHidden={handleToggleHidden}
          onToggleRecruitment={handleToggleRecruitment}
          onEditRecruitment={handleEditRecruitment}
          onJoinRecruitment={handleJoinRecruitment}
          onLeaveRecruitment={handleLeaveRecruitment}
          onAddParticipant={handleAddParticipant}
          onRemoveParticipant={handleRemoveParticipant}
          onVoteDate={handleVoteDate}
        />
      )}

      {/* 下部ナビゲーション */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex">
          <button
            onClick={() => setActiveView('everyone')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 relative ${
              activeView === 'everyone'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <Users className="h-6 w-6" />
              {unreadCount > 0 && activeView !== 'everyone' && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs">旅行予定</span>
          </button>
          <button
            onClick={() => setActiveView('recruitments')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${
              activeView === 'recruitments'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <UserPlus className="h-6 w-6" />
            <span className="text-xs">合流募集</span>
          </button>
          <button
            onClick={() => setActiveView('meetups')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${
              activeView === 'meetups'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <Coffee className="h-6 w-6" />
            <span className="text-xs">オフ会、イベント</span>
          </button>
          <button
            onClick={() => setActiveView('mine')}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${
              activeView === 'mine'
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs">自分の旅行予定</span>
          </button>
        </div>
      </nav>

      {/* 日付から追加するダイアログ */}
      <AddTripDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddTrip}
        initialDate={dialogInitialDate}
        authUser={authUser}
      />

      {/* 編集ダイアログ */}
      <EditTripDialog
        trip={editingTrip}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingTrip(null);
        }}
        onSave={handleSaveTrip}
      />

      {/* 合流募集作成・編集ダイアログ */}
      <CreateRecruitmentDialog
        trip={recruitmentTrip}
        isOpen={showRecruitmentDialog}
        onClose={() => {
          setShowRecruitmentDialog(false);
          setRecruitmentTrip(null);
          setIsEditingRecruitment(false);
        }}
        onSave={handleSaveRecruitment}
        isEditing={isEditingRecruitment}
      />

      {/* 検索ドロワー */}
      <SearchDrawer
        trips={trips}
        isOpen={showSearchDrawer}
        onClose={() => setShowSearchDrawer(false)}
      />

      {/* Discord認証ダイアログ */}
      <DiscordAuthDialog
        isOpen={showAuthDialog}
        onAuthSuccess={() => {
          setShowAuthDialog(false);
          // 認証後にユーザー情報を再取得
          const user = getAuthUser();
          setAuthUserState(user);
        }}
      />

      {/* トースト通知 */}
      <Toaster />
    </div>
  );
}
