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
import { TripsAPI, type Trip as ApiTrip } from './utils/api';
import { DateProposalsAPI } from './utils/api';

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
 * API Trip からフロント用 Trip への変換
 */
function mapApiTrip(api: ApiTrip): Trip {
  return {
    id: api.id,
    type: api.type,
    userDiscordId: api.user_discord_id,
    userName: api.user_name || '',
    userAvatar: api.user_avatar || '',
    country: api.country,
    city: api.city,
    startDate: new Date(api.start_date),
    endDate: new Date(api.end_date),
    description: api.description,
    isRecruitment: api.is_recruitment,
    recruitmentDetails: api.recruitment_details,
    isHidden: api.is_hidden,
    minParticipants: api.min_participants ?? undefined,
    maxParticipants: api.max_participants ?? undefined,
    participants: api.participants || [],
  };
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
  
  if (authUser) {
    normalized.isOwn = trip.userDiscordId === authUser.discordId;
  }
  
  return normalized;
}

// モックデータ
const initialTrips: Trip[] = [
  // 既存のモックは残すが、認証後にAPIで上書きする
];

export default function App() {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [proposalIdByDate, setProposalIdByDate] = useState<Record<string, Record<string, string>>>({});
  
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

  // 認証ユーザーが確定したらサーバからTripsを取得
  useEffect(() => {
    const loadTrips = async () => {
      if (!authUser) return;
      try {
        const data = await TripsAPI.list();
        const mapped = data.map(mapApiTrip);
        setTrips(mapped);
        // ミートアップの候補日・投票を読み込み
        const meetupTrips = mapped.filter(t => t.type === 'meetup');
        const proposalMapUpdates: Record<string, Record<string, string>> = {};
        const updatedTrips: Record<string, Trip> = Object.fromEntries(mapped.map(t => [t.id, t]));
        for (const mt of meetupTrips) {
          try {
            const proposals = await DateProposalsAPI.list(mt.id);
            const dateToId: Record<string, string> = {};
            const dateVotes: { [dateString: string]: string[] } = {};
            for (const p of proposals) {
              dateToId[p.date] = p.id;
              try {
                const votes = await DateProposalsAPI.votes(p.id);
                dateVotes[p.date] = votes.map(v => v.user_discord_id);
              } catch {}
            }
            proposalMapUpdates[mt.id] = dateToId;
            updatedTrips[mt.id] = {
              ...updatedTrips[mt.id],
              candidateDates: Object.keys(dateToId).map(d => new Date(d)),
              dateVotes,
            };
          } catch {}
        }
        if (Object.keys(proposalMapUpdates).length > 0) setProposalIdByDate(proposalMapUpdates);
        setTrips(Object.values(updatedTrips));
      } catch (e) {
        console.error(e);
        toast.error('予定の読み込みに失敗しました');
      }
    };
    loadTrips();
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
      (async () => {
        const c = await (await import('./utils/notifications')).fetchUnreadCount();
        setUnreadCountState(c);
      })();
      // 予定の通知チェック（前日・当日通知）
      checkTripNotifications(trips);
    }
  }, [authUser, trips]);

  // 未読数を定期的に更新（他のタブで変更された場合も反映）
  useEffect(() => {
    const interval = setInterval(async () => {
      const c = await (await import('./utils/notifications')).fetchUnreadCount();
      setUnreadCountState(c);
    }, 10000);

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
      // 未読数を更新（ローカル反映）
      (async () => {
        const c = await (await import('./utils/notifications')).fetchUnreadCount();
        setUnreadCountState(c);
      })();
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

  const handleAddTrip = async (newTrip: Omit<Trip, 'id'>) => {
    try {
      const created = await TripsAPI.create({
        type: newTrip.type,
        user_discord_id: newTrip.userDiscordId,
        user_name: newTrip.userName,
        user_avatar: newTrip.userAvatar,
        country: newTrip.country,
        city: newTrip.city,
        start_date: newTrip.startDate.toISOString().slice(0, 10),
        end_date: newTrip.endDate.toISOString().slice(0, 10),
        description: newTrip.description,
        is_recruitment: newTrip.isRecruitment,
        recruitment_details: newTrip.recruitmentDetails,
        min_participants: newTrip.minParticipants,
        max_participants: newTrip.maxParticipants,
        participants: newTrip.participants,
        is_hidden: newTrip.isHidden,
      } as any);
      const mapped = mapApiTrip(created);
      mapped.isOwn = true;
      setTrips([...trips, mapped]);
      setShowAddPage(false);
      setShowAddMeetupPage(false);
      setShowAddDialog(false);

      if (newTrip.discordLinked) {
        toast.success('サロンへの募集投稿が完了しました', {
          description: 'Discordに合流募集が投稿されました',
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('予定の作成に失敗しました');
    }
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setShowEditDialog(true);
  };

  const handleSaveTrip = async (updatedTrip: Trip) => {
    try {
      const saved = await TripsAPI.update(updatedTrip.id, {
        type: updatedTrip.type,
        user_discord_id: updatedTrip.userDiscordId,
        user_name: updatedTrip.userName,
        user_avatar: updatedTrip.userAvatar,
        country: updatedTrip.country,
        city: updatedTrip.city,
        start_date: updatedTrip.startDate.toISOString().slice(0, 10),
        end_date: updatedTrip.endDate.toISOString().slice(0, 10),
        description: updatedTrip.description,
        is_recruitment: updatedTrip.isRecruitment,
        recruitment_details: updatedTrip.recruitmentDetails,
        min_participants: updatedTrip.minParticipants,
        max_participants: updatedTrip.maxParticipants,
        participants: updatedTrip.participants,
        is_hidden: updatedTrip.isHidden,
      } as any);
      const mapped = mapApiTrip(saved);
      const originalTrip = trips.find(t => t.id === updatedTrip.id);
      setTrips(trips.map(t => t.id === updatedTrip.id ? mapped : t));
      setShowEditDialog(false);
      setEditingTrip(null);

      if (updatedTrip.discordLinked && !originalTrip?.discordLinked) {
        toast.success('サロンへの募集投稿が完了しました', {
          description: 'Discordに合流募集が投稿されました',
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('予定の更新に失敗しました');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await TripsAPI.remove(tripId);
      setTrips(trips.filter(t => t.id !== tripId));
    } catch (e) {
      console.error(e);
      toast.error('予定の削除に失敗しました');
    }
  };

  const handleToggleHidden = async (tripId: string) => {
    try {
      const current = trips.find(t => t.id === tripId);
      const res = await TripsAPI.toggleHidden(tripId, current ? !current.isHidden : undefined);
      const mapped = mapApiTrip(res);
      setTrips(trips.map(t => t.id === tripId ? { ...mapped } : t));
    } catch (e) {
      console.error(e);
      toast.error('表示設定の更新に失敗しました');
    }
  };

  const handleToggleRecruitment = async (trip: Trip) => {
    try {
      if (trip.isRecruitment) {
        const res = await TripsAPI.endRecruitment(trip.id);
        const mapped = mapApiTrip(res);
        setTrips(trips.map(t => t.id === trip.id ? mapped : t));
      } else {
        const res = await TripsAPI.toggleRecruitment(trip.id, true);
        const mapped = mapApiTrip(res);
        setTrips(trips.map(t => t.id === trip.id ? mapped : t));
        setRecruitmentTrip(mapped);
        setIsEditingRecruitment(false);
        setShowRecruitmentDialog(true);
      }
    } catch (e) {
      console.error(e);
      toast.error('募集設定の更新に失敗しました');
    }
  };

  const handleEditRecruitment = (trip: Trip) => {
    setRecruitmentTrip(trip);
    setIsEditingRecruitment(true);
    setShowRecruitmentDialog(true);
  };

  const handleSaveRecruitment = async (updatedTrip: Trip, discordLinked: boolean) => {
    try {
      const saved = await TripsAPI.update(updatedTrip.id, {
        is_recruitment: updatedTrip.isRecruitment,
        recruitment_details: updatedTrip.recruitmentDetails,
        min_participants: updatedTrip.minParticipants,
        max_participants: updatedTrip.maxParticipants,
      } as any);
      const mapped = mapApiTrip(saved);
      const originalTrip = trips.find(t => t.id === updatedTrip.id);
      setTrips(trips.map(t => t.id === updatedTrip.id ? mapped : t));
      setShowRecruitmentDialog(false);
      setRecruitmentTrip(null);
      setIsEditingRecruitment(false);

      if (discordLinked && !originalTrip?.discordLinked) {
        toast.success('サロンへの募集投稿が完了しました', {
          description: 'Discordに合流募集が投稿されました',
        });
      }
    } catch (e) {
      console.error(e);
      toast.error('募集の保存に失敗しました');
    }
  };

  const handleJoinRecruitment = async (trip: Trip) => {
    if (!authUser) {
      toast.error('参加するにはログインが必要です');
      return;
    }
    try {
      const res = await TripsAPI.join(trip.id, authUser.discordId);
      const mapped = mapApiTrip(res);
      setTrips(trips.map(t => t.id === trip.id ? mapped : t));
      toast.success('参加しました！');
    } catch (e) {
      console.error(e);
      toast.error('参加に失敗しました');
    }
  };

  const handleLeaveRecruitment = async (trip: Trip) => {
    if (!authUser) return;
    try {
      const res = await TripsAPI.leave(trip.id, authUser.discordId);
      const mapped = mapApiTrip(res);
      setTrips(trips.map(t => t.id === trip.id ? mapped : t));
      toast.success('参加をキャンセルしました');
    } catch (e) {
      console.error(e);
      toast.error('取り消しに失敗しました');
    }
  };

  const handleAddParticipant = async (trip: Trip, participantDiscordId: string) => {
    try {
      const res = await TripsAPI.join(trip.id, participantDiscordId);
      const mapped = mapApiTrip(res);
      setTrips(trips.map(t => t.id === trip.id ? mapped : t));
      const userData = getUserByDiscordId(participantDiscordId);
      toast.success(`${userData?.displayName || '参加者'}さんを追加しました`);
    } catch (e) {
      console.error(e);
      toast.error('参加者の追加に失敗しました');
    }
  };

  const handleRemoveParticipant = async (trip: Trip, participantId: string) => {
    try {
      const res = await TripsAPI.leave(trip.id, participantId);
      const mapped = mapApiTrip(res);
      setTrips(trips.map(t => t.id === trip.id ? mapped : t));
      toast.success('参加者を削除しました');
    } catch (e) {
      console.error(e);
      toast.error('参加者の削除に失敗しました');
    }
  };

  const handleVoteDate = async (trip: Trip, date: Date) => {
    if (!authUser) {
      toast.error('投票するにはログインが必要です');
      return;
    }

    const dateString = date.toISOString().slice(0, 10);
    const mapForTrip = proposalIdByDate[trip.id] || {};
    const proposalId = mapForTrip[dateString];
    if (!proposalId) {
      toast.error('この候補日は現在投票を受け付けていません');
      return;
    }

    // 既に投票済みか判定
    const voted = (trip.dateVotes?.[dateString] || []).includes(authUser.discordId);
    try {
      if (voted) {
        await DateProposalsAPI.unvote(proposalId, authUser.discordId);
      } else {
        await DateProposalsAPI.vote(proposalId, authUser.discordId);
      }
      // 最新票を取得して反映
      const votes = await DateProposalsAPI.votes(proposalId);
      const newVotesMap = { ...(trip.dateVotes || {}) };
      newVotesMap[dateString] = votes.map(v => v.user_discord_id);
      setTrips(trips.map(t => t.id === trip.id ? { ...t, dateVotes: newVotesMap } : t));
      toast.success('投票しました');
    } catch (e) {
      console.error(e);
      toast.error('投票に失敗しました');
    }
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
