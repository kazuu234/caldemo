import { Trip } from '../App';

// 未読予定数を管理（ローカルストレージ）
const UNREAD_COUNT_KEY = 'unreadTripCount';
// 通知チェック済み予定を管理
const NOTIFIED_TRIPS_KEY = 'notifiedTrips';

// 未読数を取得
export function getUnreadCount(): number {
  const count = localStorage.getItem(UNREAD_COUNT_KEY);
  return count ? parseInt(count, 10) : 0;
}

// 未読数を設定
export function setUnreadCount(count: number) {
  localStorage.setItem(UNREAD_COUNT_KEY, count.toString());
  updateAppBadge(count);
}

// 未読数を増やす
export function incrementUnreadCount() {
  const currentCount = getUnreadCount();
  setUnreadCount(currentCount + 1);
}

// 未読数をクリア
export function clearUnreadCount() {
  setUnreadCount(0);
}

// アプリバッジを更新（Android Chrome、Edge等で対応）
function updateAppBadge(count: number) {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      (navigator as any).setAppBadge(count).catch((error: Error) => {
        console.log('バッジ設定エラー:', error);
      });
    } else {
      (navigator as any).clearAppBadge().catch((error: Error) => {
        console.log('バッジクリアエラー:', error);
      });
    }
  }
}

// 通知の許可をリクエスト
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('このブラウザは通知をサポートしていません');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// 新しい予定の通知を表示
export function showTripNotification(trip: Trip) {
  // 未読数を増やす
  incrementUnreadCount();

  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    const title = '新しい旅行予定が追加されました';
    const unreadCount = getUnreadCount();
    const options: NotificationOptions = {
      body: `${trip.userName}さんが${trip.country} - ${trip.city}への旅行を予定しています`,
      icon: trip.userAvatar,
      badge: trip.userAvatar,
      tag: `trip-${trip.id}`,
      requireInteraction: false,
      silent: false,
      data: {
        unreadCount,
      },
    };

    const notification = new Notification(title, options);

    // 通知をクリックしたときの処理
    notification.onclick = () => {
      window.focus();
      // クリックしたら未読を減らす
      const current = getUnreadCount();
      if (current > 0) {
        setUnreadCount(current - 1);
      }
      notification.close();
    };

    // 5秒後に自動で閉じる
    setTimeout(() => {
      notification.close();
    }, 5000);
  }
}

// 合流募集の通知を表示
export function showRecruitmentNotification(trip: Trip) {
  // 未読数を増やす
  incrementUnreadCount();

  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    const title = '合流募集が投稿されました';
    const unreadCount = getUnreadCount();
    const options: NotificationOptions = {
      body: `${trip.userName}さんが${trip.country} - ${trip.city}で仲間を募集しています`,
      icon: trip.userAvatar,
      badge: trip.userAvatar,
      tag: `recruitment-${trip.id}`,
      requireInteraction: false,
      silent: false,
      data: {
        unreadCount,
      },
    };

    const notification = new Notification(title, options);

    notification.onclick = () => {
      window.focus();
      // クリックしたら未読を減らす
      const current = getUnreadCount();
      if (current > 0) {
        setUnreadCount(current - 1);
      }
      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 5000);
  }
}

// 通知済みの予定を記録
interface NotifiedTrip {
  tripId: string;
  notifiedDayBefore: boolean;
  notifiedSameDay: boolean;
}

function getNotifiedTrips(): NotifiedTrip[] {
  try {
    const data = localStorage.getItem(NOTIFIED_TRIPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotifiedTrips(trips: NotifiedTrip[]) {
  localStorage.setItem(NOTIFIED_TRIPS_KEY, JSON.stringify(trips));
}

function markAsNotified(tripId: string, type: 'dayBefore' | 'sameDay') {
  const notifiedTrips = getNotifiedTrips();
  const existing = notifiedTrips.find(t => t.tripId === tripId);
  
  if (existing) {
    if (type === 'dayBefore') {
      existing.notifiedDayBefore = true;
    } else {
      existing.notifiedSameDay = true;
    }
  } else {
    notifiedTrips.push({
      tripId,
      notifiedDayBefore: type === 'dayBefore',
      notifiedSameDay: type === 'sameDay',
    });
  }
  
  saveNotifiedTrips(notifiedTrips);
}

function isAlreadyNotified(tripId: string, type: 'dayBefore' | 'sameDay'): boolean {
  const notifiedTrips = getNotifiedTrips();
  const trip = notifiedTrips.find(t => t.tripId === tripId);
  
  if (!trip) return false;
  
  return type === 'dayBefore' ? trip.notifiedDayBefore : trip.notifiedSameDay;
}

// 前日通知を表示
export function showDayBeforeNotification(trip: Trip) {
  if (isAlreadyNotified(trip.id, 'dayBefore')) {
    return;
  }

  incrementUnreadCount();

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = '明日から旅行が始まります！';
  const options: NotificationOptions = {
    body: `${trip.country} - ${trip.city}への旅行が明日から始まります。準備は万全ですか？`,
    icon: trip.userAvatar,
    badge: trip.userAvatar,
    tag: `day-before-${trip.id}`,
    requireInteraction: false,
    silent: false,
  };

  const notification = new Notification(title, options);

  notification.onclick = () => {
    window.focus();
    const current = getUnreadCount();
    if (current > 0) {
      setUnreadCount(current - 1);
    }
    notification.close();
  };

  setTimeout(() => {
    notification.close();
  }, 5000);

  markAsNotified(trip.id, 'dayBefore');

  // Discord DM送信のトリガー
  if (trip.participants && trip.participants.length > 0) {
    sendDiscordDMTrigger(trip, 'dayBefore');
  }
}

// 当日通知を表示
export function showSameDayNotification(trip: Trip) {
  if (isAlreadyNotified(trip.id, 'sameDay')) {
    return;
  }

  incrementUnreadCount();

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = '旅行当日です！';
  const options: NotificationOptions = {
    body: `${trip.country} - ${trip.city}への旅行、楽しんでください！`,
    icon: trip.userAvatar,
    badge: trip.userAvatar,
    tag: `same-day-${trip.id}`,
    requireInteraction: false,
    silent: false,
  };

  const notification = new Notification(title, options);

  notification.onclick = () => {
    window.focus();
    const current = getUnreadCount();
    if (current > 0) {
      setUnreadCount(current - 1);
    }
    notification.close();
  };

  setTimeout(() => {
    notification.close();
  }, 5000);

  markAsNotified(trip.id, 'sameDay');

  // Discord DM送信のトリガー
  if (trip.participants && trip.participants.length > 0) {
    sendDiscordDMTrigger(trip, 'sameDay');
  }
}

// Discord DM送信のトリガー（実際の実装はREST API経由でBOTを操作）
async function sendDiscordDMTrigger(trip: Trip, timing: 'dayBefore' | 'sameDay') {
  console.log(`🔔 Discord DM送信トリガー: ${timing}`, {
    tripId: trip.id,
    destination: trip.country + ' - ' + trip.city,
    participants: trip.participants?.map(p => p.displayName).join(', '),
    timing,
  });

  // 実際の実装では、Django REST APIを呼び出す
  // 例:
  // try {
  //   await fetch('/api/discord/send-trip-notification/', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': `Bearer ${getAuthToken()}`,
  //     },
  //     body: JSON.stringify({
  //       tripId: trip.id,
  //       timing,
  //       participants: trip.participants?.map(p => p.discordId),
  //     }),
  //   });
  // } catch (error) {
  //   console.error('Discord DM送信エラー:', error);
  // }
}

// 予定の通知チェック（アプリ起動時やページ読み込み時に呼び出す）
export function checkTripNotifications(trips: Trip[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  trips.forEach(trip => {
    // 合流募集で参加者がいる予定のみチェック
    if (!trip.isRecruitment || !trip.participants || trip.participants.length === 0) {
      return;
    }

    const startDate = new Date(trip.startDate);
    const tripStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    // 前日通知
    if (tripStartDay.getTime() === tomorrow.getTime()) {
      showDayBeforeNotification(trip);
    }

    // 当日通知
    if (tripStartDay.getTime() === today.getTime()) {
      showSameDayNotification(trip);
    }
  });
}
