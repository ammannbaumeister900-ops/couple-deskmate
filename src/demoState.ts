export type UserStatus = "online" | "focus" | "offline";
export type InteractionType = "pat" | "hug" | "miss" | "cheer";
export type MessageStatus = "sent" | "pending" | "played" | "capsule";
export type UserId = "me" | "partner";

export interface CoupleUser {
  id: UserId;
  name: string;
  role: "me" | "partner";
  status: UserStatus;
  avatarTheme: "pink" | "blue";
  isMuted: boolean;
  isWorkMode: boolean;
  isClickThrough: boolean;
  mood: InteractionType | "idle" | "happy" | "focus" | "offline";
  pendingCount: number;
  capsuleCount: number;
  toast: string;
}

export interface InteractionMessage {
  id: string;
  fromUserId: UserId;
  toUserId: UserId;
  type: InteractionType;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export interface SharedHome {
  intimacyScore: number;
  todayInteractionCount: number;
  anniversaryDay: number;
  roomTheme: string;
  pulse: number;
}

export interface DemoState {
  users: Record<UserId, CoupleUser>;
  messages: InteractionMessage[];
  timeline: string[];
  sharedHome: SharedHome;
}

export const interactionLabels: Record<InteractionType, string> = {
  pat: "摸头",
  hug: "抱抱",
  miss: "想你",
  cheer: "加油",
};

export const statusLabels: Record<UserStatus, string> = {
  online: "在线",
  focus: "专注",
  offline: "离线",
};

const reactionText: Record<InteractionType, string> = {
  pat: "摸了摸你的头。",
  hug: "给了你一个不打扰的抱抱。",
  miss: "偷偷想你了。",
  cheer: "给你留了一个加油。",
};

export function createInitialState(): DemoState {
  return {
    users: {
      me: {
        id: "me",
        name: "小鱼",
        role: "me",
        status: "online",
        avatarTheme: "pink",
        isMuted: false,
        isWorkMode: false,
        isClickThrough: false,
        mood: "idle",
        pendingCount: 0,
        capsuleCount: 0,
        toast: "",
      },
      partner: {
        id: "partner",
        name: "阿树",
        role: "partner",
        status: "online",
        avatarTheme: "blue",
        isMuted: false,
        isWorkMode: false,
        isClickThrough: false,
        mood: "idle",
        pendingCount: 0,
        capsuleCount: 0,
        toast: "",
      },
    },
    messages: [],
    timeline: ["Demo 已启动：两位桌宠都在线。"],
    sharedHome: {
      intimacyScore: 12,
      todayInteractionCount: 0,
      anniversaryDay: 131,
      roomTheme: "默认温馨房间",
      pulse: 0,
    },
  };
}

export function otherUser(id: UserId): UserId {
  return id === "me" ? "partner" : "me";
}

export function sendInteraction(
  state: DemoState,
  fromUserId: UserId,
  toUserId: UserId,
  type: InteractionType,
): DemoState {
  const sender = state.users[fromUserId];
  const receiver = state.users[toUserId];
  const label = interactionLabels[type];
  const status: MessageStatus =
    receiver.status === "online" ? "played" : receiver.status === "focus" ? "pending" : "capsule";
  const text =
    status === "capsule"
      ? `${sender.name}在你离线时${reactionText[type]}`
      : `${sender.name}${reactionText[type]}`;
  const message = createMessage(fromUserId, toUserId, type, text, status);
  const users = {
    ...state.users,
    [fromUserId]: {
      ...sender,
      mood: type,
      toast: `已发送${label}`,
    },
    [toUserId]: {
      ...receiver,
      mood: receiver.status === "online" ? type : receiver.status,
      pendingCount: receiver.pendingCount + (status === "pending" ? 1 : 0),
      capsuleCount: receiver.capsuleCount + (status === "capsule" ? 1 : 0),
      toast:
        status === "played"
          ? text
          : status === "pending"
            ? "专注结束后再接收"
            : "离线胶囊 +1",
    },
  };
  const didPlay = status === "played";

  return {
    ...state,
    users,
    messages: [...state.messages, message],
    timeline: [`${sender.name}发送了${label}：${messageStatusText(status)}`, ...state.timeline].slice(0, 8),
    sharedHome: didPlay ? increaseHome(state.sharedHome, 1) : state.sharedHome,
  };
}

export function setUserStatus(state: DemoState, userId: UserId, status: UserStatus): DemoState {
  const user = state.users[userId];
  return {
    ...state,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        status,
        mood: status === "online" ? "idle" : status,
        toast: `${statusLabels[status]}模式`,
      },
    },
    timeline: [`${user.name}切换为${statusLabels[status]}`, ...state.timeline].slice(0, 8),
  };
}

export function playQueuedMessages(state: DemoState, userId: UserId): DemoState {
  const queued = state.messages.filter(
    (message) =>
      message.toUserId === userId && (message.status === "pending" || message.status === "capsule"),
  );
  if (queued.length === 0) {
    return state;
  }

  const last = queued.at(-1);
  const user = state.users[userId];
  return {
    ...state,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        mood: last?.type ?? "happy",
        pendingCount: 0,
        capsuleCount: 0,
        toast: `接收了 ${queued.length} 个小心意`,
      },
    },
    messages: state.messages.map((message) =>
      message.toUserId === userId && (message.status === "pending" || message.status === "capsule")
        ? { ...message, status: "played" }
        : message,
    ),
    timeline: [`${user.name}上线后播放了 ${queued.length} 个小心意`, ...state.timeline].slice(0, 8),
    sharedHome: increaseHome(state.sharedHome, queued.length),
  };
}

export function toggleUserFlag(
  state: DemoState,
  userId: UserId,
  flag: "isMuted" | "isWorkMode" | "isClickThrough",
): DemoState {
  const user = state.users[userId];
  return {
    ...state,
    users: {
      ...state.users,
      [userId]: {
        ...user,
        [flag]: !user[flag],
      },
    },
  };
}

export function clearHistory(state: DemoState): DemoState {
  return {
    ...state,
    messages: [],
    timeline: ["互动记录已清空。"],
    users: {
      me: { ...state.users.me, pendingCount: 0, capsuleCount: 0, toast: "" },
      partner: { ...state.users.partner, pendingCount: 0, capsuleCount: 0, toast: "" },
    },
  };
}

function createMessage(
  fromUserId: UserId,
  toUserId: UserId,
  type: InteractionType,
  text: string,
  status: MessageStatus,
): InteractionMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fromUserId,
    toUserId,
    type,
    text,
    createdAt: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    status,
  };
}

function increaseHome(home: SharedHome, amount: number): SharedHome {
  return {
    ...home,
    intimacyScore: home.intimacyScore + amount * 4,
    todayInteractionCount: home.todayInteractionCount + amount,
    pulse: home.pulse + 1,
  };
}

function messageStatusText(status: MessageStatus): string {
  if (status === "played") return "已播放";
  if (status === "pending") return "待接收";
  if (status === "capsule") return "离线胶囊";
  return "已发送";
}
