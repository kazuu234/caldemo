// 認証状態の管理（localStorageベース）
// 後でDjangoのセッション管理に置き換える

export interface AuthUser {
  id: string;
  username: string; // Discord アカウント名（半角英数字3-20文字）
  displayName: string; // 表示名（日本語名など）
  discordId: string;
  discordTag: string; // username#1234
  avatar: string; // 認証後にDiscordから取得
  authenticatedAt: Date;
}

export interface UserData {
  discordId: string;
  username: string;
  displayName: string;
  discriminator: string;
  avatar: string;
}

// ユーザーデータのマスターリスト（後でDjangoのDBから取得）
const USERS_MASTER: UserData[] = [
  {
    discordId: '123456789012345678',
    username: 'tanaka',
    displayName: '田中太郎',
    discriminator: '1234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanaka',
  },
  {
    discordId: '234567890123456789',
    username: 'satoh',
    displayName: '佐藤花子',
    discriminator: '5678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
  },
  {
    discordId: '345678901234567890',
    username: 'suzuki',
    displayName: '鈴木一郎',
    discriminator: '9012',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suzuki',
  },
  {
    discordId: '456789012345678901',
    username: 'takahashi',
    displayName: '高橋健太',
    discriminator: '3456',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takahashi',
  },
  {
    discordId: '567890123456789012',
    username: 'yamada',
    displayName: '山田美咲',
    discriminator: '7890',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamada',
  },
  {
    discordId: '678901234567890123',
    username: 'itoh',
    displayName: '伊藤さくら',
    discriminator: '2345',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ito',
  },
  {
    discordId: '789012345678901234',
    username: 'watanabe',
    displayName: '渡辺隆',
    discriminator: '6789',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Watanabe',
  },
  {
    discordId: '890123456789012345',
    username: 'nakamura',
    displayName: '中村直樹',
    discriminator: '0123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakamura',
  },
  {
    discordId: '901234567890123456',
    username: 'kobayashi',
    displayName: '小林さくら',
    discriminator: '4567',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kobayashi',
  },
  {
    discordId: '012345678901234567',
    username: 'kato',
    displayName: '加藤隼人',
    discriminator: '8901',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kato',
  },
];

/**
 * DiscordIDからユーザーデータを取得
 */
export function getUserByDiscordId(discordId: string): UserData | null {
  return USERS_MASTER.find(user => user.discordId === discordId) || null;
}

/**
 * 表示名からユーザーデータを取得（後方互換性のため）
 */
export function getUserByDisplayName(displayName: string): UserData | null {
  return USERS_MASTER.find(user => user.displayName === displayName) || null;
}

const AUTH_STORAGE_KEY = 'travel_app_auth_user';

/**
 * 認証済みユーザー情報を取得
 * ユーザーマスターから最新のアバター情報を取得して返す
 */
export function getAuthUser(): AuthUser | null {
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return null;
    
    const user = JSON.parse(data);
    user.authenticatedAt = new Date(user.authenticatedAt);
    
    // ユーザーマスターから最新の情報を取得してアバターを同期
    const masterData = getUserByDiscordId(user.discordId);
    if (masterData) {
      user.avatar = masterData.avatar;
      user.displayName = masterData.displayName;
      user.username = masterData.username;
    }
    
    return user;
  } catch {
    return null;
  }
}

/**
 * 認証済みユーザー情報を保存
 */
export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

/**
 * 認証情報をクリア（ログアウト）
 */
export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * 認証済みかどうかを判定
 */
export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

/**
 * Discord検索API（モック）- アカウント名で検索
 * 後でDjango経由でDiscord Bot APIを呼ぶ
 */
export async function searchDiscordUsers(query: string): Promise<Array<{
  discordId: string;
  username: string; // Discord アカウント名（半角英数字3-20文字）
  displayName: string; // 表示名（日本語名など）
  discriminator: string;
}>> {
  // バリデーション: 半角英数字3-20文字
  if (!/^[a-zA-Z0-9]{3,20}$/.test(query)) {
    return [];
  }

  // モックデータ - 実際はDjango APIを呼ぶ
  await new Promise(resolve => setTimeout(resolve, 500)); // 擬似的な遅延
  
  const mockUsers = [
    // 英数字ユーザー名（よくあるパターン）
    {
      discordId: '123456789012345678',
      username: 'tanaka',
      displayName: '田中太郎',
      discriminator: '1234',
    },
    {
      discordId: '234567890123456789',
      username: 'satoh',
      displayName: '佐藤花子',
      discriminator: '5678',
    },
    {
      discordId: '345678901234567890',
      username: 'suzuki',
      displayName: '鈴木一郎',
      discriminator: '9012',
    },
    {
      discordId: '456789012345678901',
      username: 'takahashi',
      displayName: '高橋健太',
      discriminator: '3456',
    },
    {
      discordId: '567890123456789012',
      username: 'yamada',
      displayName: '山田美咲',
      discriminator: '7890',
    },
    {
      discordId: '678901234567890123',
      username: 'itoh',
      displayName: '伊藤さくら',
      discriminator: '2345',
    },
    {
      discordId: '789012345678901234',
      username: 'watanabe',
      displayName: '渡辺隆',
      discriminator: '6789',
    },
    {
      discordId: '890123456789012345',
      username: 'nakamura',
      displayName: '中村直樹',
      discriminator: '0123',
    },
    {
      discordId: '901234567890123456',
      username: 'kobayashi',
      displayName: '小林さくら',
      discriminator: '4567',
    },
    {
      discordId: '012345678901234567',
      username: 'kato',
      displayName: '加藤隼人',
      discriminator: '8901',
    },
    {
      discordId: '412345678901234567',
      username: 'TravelLover',
      displayName: 'Travel Lover',
      discriminator: '4444',
    },
    {
      discordId: '512345678901234567',
      username: 'WorldExplorer',
      displayName: 'World Explorer',
      discriminator: '5555',
    },
    {
      discordId: '612345678901234567',
      username: 'AdventureSeeker',
      displayName: 'Adventure Seeker',
      discriminator: '6666',
    },
    {
      discordId: '712345678901234567',
      username: 'Nomad2025',
      displayName: 'Digital Nomad',
      discriminator: '7777',
    },
    {
      discordId: '812345678901234567',
      username: 'GlobeTrotter',
      displayName: 'Globe Trotter',
      discriminator: '8888',
    },
    {
      discordId: '912345678901234567',
      username: 'Backpacker',
      displayName: 'Backpacker',
      discriminator: '9999',
    },
    {
      discordId: '013456789012345678',
      username: 'TokyoTraveler',
      displayName: 'Tokyo Traveler',
      discriminator: '0000',
    },
    {
      discordId: '113456789012345678',
      username: 'alice123',
      displayName: 'アリス',
      discriminator: '1122',
    },
    {
      discordId: '213456789012345678',
      username: 'bob456',
      displayName: 'ボブ',
      discriminator: '3344',
    },
    {
      discordId: '313456789012345678',
      username: 'charlie789',
      displayName: 'チャーリー',
      discriminator: '5566',
    },
  ];
  
  // 前方一致検索（アカウント名）
  const lowerQuery = query.toLowerCase();
  return mockUsers.filter(user => {
    const lowerUsername = user.username.toLowerCase();
    return lowerUsername.startsWith(lowerQuery);
  });
}

/**
 * DisplayName検索API（モック）
 * 後でDjango経由でDiscord Bot APIを呼ぶ
 */
export async function searchDiscordUsersByDisplayName(query: string): Promise<Array<{
  discordId: string;
  username: string;
  displayName: string;
  discriminator: string;
  avatar: string;
}>> {
  // 最低1文字以上
  if (!query || query.trim().length === 0) {
    return [];
  }

  // モックデータ - 実際はDjango APIを呼ぶ
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockUsers = [
    {
      discordId: '123456789012345678',
      username: 'tanaka',
      displayName: '田中太郎',
      discriminator: '1234',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tanaka',
    },
    {
      discordId: '234567890123456789',
      username: 'satoh',
      displayName: '佐藤花子',
      discriminator: '5678',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sato',
    },
    {
      discordId: '345678901234567890',
      username: 'suzuki',
      displayName: '鈴木一郎',
      discriminator: '9012',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suzuki',
    },
    {
      discordId: '456789012345678901',
      username: 'takahashi',
      displayName: '高橋健太',
      discriminator: '3456',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Takahashi',
    },
    {
      discordId: '567890123456789012',
      username: 'yamada',
      displayName: '山田美咲',
      discriminator: '7890',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamada',
    },
    {
      discordId: '678901234567890123',
      username: 'itoh',
      displayName: '伊藤さくら',
      discriminator: '2345',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ito',
    },
    {
      discordId: '789012345678901234',
      username: 'watanabe',
      displayName: '渡辺隆',
      discriminator: '6789',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Watanabe',
    },
    {
      discordId: '890123456789012345',
      username: 'nakamura',
      displayName: '中村直樹',
      discriminator: '0123',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakamura',
    },
    {
      discordId: '901234567890123456',
      username: 'kobayashi',
      displayName: '小林さくら',
      discriminator: '4567',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kobayashi',
    },
    {
      discordId: '012345678901234567',
      username: 'kato',
      displayName: '加藤隼人',
      discriminator: '8901',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kato',
    },
    {
      discordId: '412345678901234567',
      username: 'TravelLover',
      displayName: 'Travel Lover',
      discriminator: '4444',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TravelLover',
    },
    {
      discordId: '512345678901234567',
      username: 'WorldExplorer',
      displayName: 'World Explorer',
      discriminator: '5555',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WorldExplorer',
    },
    {
      discordId: '612345678901234567',
      username: 'AdventureSeeker',
      displayName: 'Adventure Seeker',
      discriminator: '6666',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdventureSeeker',
    },
    {
      discordId: '712345678901234567',
      username: 'Nomad2025',
      displayName: 'Digital Nomad',
      discriminator: '7777',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nomad2025',
    },
    {
      discordId: '812345678901234567',
      username: 'GlobeTrotter',
      displayName: 'Globe Trotter',
      discriminator: '8888',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GlobeTrotter',
    },
    {
      discordId: '912345678901234567',
      username: 'Backpacker',
      displayName: 'Backpacker',
      discriminator: '9999',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Backpacker',
    },
    {
      discordId: '013456789012345678',
      username: 'TokyoTraveler',
      displayName: 'Tokyo Traveler',
      discriminator: '0000',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TokyoTraveler',
    },
    {
      discordId: '113456789012345678',
      username: 'alice123',
      displayName: 'アリス',
      discriminator: '1122',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice123',
    },
    {
      discordId: '213456789012345678',
      username: 'bob456',
      displayName: 'ボブ',
      discriminator: '3344',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob456',
    },
    {
      discordId: '313456789012345678',
      username: 'charlie789',
      displayName: 'チャーリー',
      discriminator: '5566',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie789',
    },
  ];
  
  // 部分一致検索（DisplayName）
  const lowerQuery = query.toLowerCase();
  return mockUsers.filter(user => {
    const lowerDisplayName = user.displayName.toLowerCase();
    return lowerDisplayName.includes(lowerQuery);
  });
}

/**
 * Discord DMリクエスト送信（モック）
 * 実際はDjango APIを呼び、Django側でDiscord Bot APIを使ってDMを送る
 */
export async function requestDiscordAuth(discordId: string): Promise<{
  success: boolean;
  message: string;
}> {
  // モック - 実際はDjango APIを呼ぶ
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'DMを送信しました。Discordをご確認ください。',
  };
}

/**
 * ワンタイムトークンで認証を完了（モック）
 * 実際はDjango APIを呼び、トークンを検証してセッションを作成
 */
export async function verifyAuthToken(token: string): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  // モック - 実際はDjango APIを呼ぶ
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // トークンの検証（モック）
  if (token.length < 10) {
    return {
      success: false,
      error: '無効なトークンです',
    };
  }
  
  // モック: トークンからdiscordIdを取得（実際はAPIが返す）
  const discordId = '123456789012345678';
  
  // ユーザーマスターから情報を取得
  const masterData = getUserByDiscordId(discordId);
  
  if (!masterData) {
    return {
      success: false,
      error: 'ユーザーが見つかりません',
    };
  }
  
  // 認証成功 - ユーザーマスターの情報を使用
  const user: AuthUser = {
    id: discordId,
    username: masterData.username,
    displayName: masterData.displayName,
    discordId: masterData.discordId,
    discordTag: `${masterData.username}#${masterData.discriminator}`,
    avatar: masterData.avatar,
    authenticatedAt: new Date(),
  };
  
  return {
    success: true,
    user,
  };
}
