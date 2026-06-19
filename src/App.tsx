import { useEffect, useMemo, useState } from "react";
import { AppSnapshot, applyDemoAction, createInitialSnapshot, DemoAction } from "./appActions";
import { getDesktopPetApi } from "./desktopApi";
import {
  createInitialState,
  InteractionMessage,
  interactionLabels,
  InteractionType,
  otherUser,
  statusLabels,
  UserId,
  UserStatus,
} from "./demoState";

const interactions: Array<{ type: InteractionType; icon: string }> = [
  { type: "pat", icon: "✦" },
  { type: "hug", icon: "♡" },
  { type: "miss", icon: "💭" },
  { type: "cheer", icon: "⚡" },
];

const statuses: UserStatus[] = ["online", "focus", "offline"];

export default function App() {
  const { dispatch, isDesktop, snapshot, viewerId } = useAppSnapshot();
  const { state, isFullscreen } = snapshot;

  function updateStatus(userId: UserId, status: UserStatus) {
    dispatch({ type: "setUserStatus", userId, status });
  }

  function interact(fromUserId: UserId, type: InteractionType) {
    dispatch({ type: "sendInteraction", fromUserId, interactionType: type });
  }

  const recentMessages = useMemo(() => state.messages.slice(-5).reverse(), [state.messages]);
  const desktopMessages = recentMessages.filter(
    (message) => message.toUserId === viewerId || message.fromUserId === viewerId,
  );

  return (
    <main className="min-h-screen bg-[#fff8f6] text-slate-800">
      <div className={`mx-auto flex min-h-screen flex-col gap-5 px-4 py-5 ${isDesktop ? "max-w-[980px]" : "max-w-[1500px]"}`}>
        <HeaderBar
          isFullscreen={isFullscreen}
          onFullscreen={() => dispatch({ type: "setFullscreenSimulation", isFullscreen: !isFullscreen })}
          onQuit={isDesktop ? () => void getDesktopPetApi()?.quit() : undefined}
          onReset={() => dispatch({ type: "resetDemo" })}
        />

        {isDesktop ? (
          <section className="grid flex-1 gap-5 lg:grid-cols-[1fr_340px]">
            <DesktopPanel
              userId={viewerId}
              state={state}
              isFullscreen={isFullscreen}
              messages={desktopMessages}
              onInteract={interact}
              onStatus={updateStatus}
              onToggle={(flag) => dispatch({ type: "toggleUserFlag", userId: viewerId, flag })}
            />
            <SharedHomePanel pulse={state.sharedHome.pulse} home={state.sharedHome} />
          </section>
        ) : (
          <section className="grid flex-1 gap-5 xl:grid-cols-[1fr_360px_1fr]">
            <DesktopPanel
              userId="me"
              state={state}
              isFullscreen={isFullscreen}
              messages={recentMessages.filter((message) => message.toUserId === "me" || message.fromUserId === "me")}
              onInteract={interact}
              onStatus={updateStatus}
              onToggle={(flag) => dispatch({ type: "toggleUserFlag", userId: "me", flag })}
            />
            <SharedHomePanel pulse={state.sharedHome.pulse} home={state.sharedHome} />
            <DesktopPanel
              userId="partner"
              state={state}
              isFullscreen={isFullscreen}
              messages={recentMessages.filter(
                (message) => message.toUserId === "partner" || message.fromUserId === "partner",
              )}
              onInteract={interact}
              onStatus={updateStatus}
              onToggle={(flag) => dispatch({ type: "toggleUserFlag", userId: "partner", flag })}
            />
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr_1fr]">
          <GlobalTimeline timeline={state.timeline} />
          <PrivacyPanel onClear={() => dispatch({ type: "clearHistory" })} />
          <DemoGuidePanel />
        </section>
      </div>
    </main>
  );
}

function useAppSnapshot() {
  const api = getDesktopPetApi();
  const [snapshot, setSnapshot] = useState<AppSnapshot>(createInitialSnapshot);
  const [viewerId] = useState<UserId>(() => api?.getViewerId() ?? "me");

  useEffect(() => {
    if (!api) return;
    let mounted = true;
    void api.getState().then((next) => {
      if (mounted) setSnapshot(next);
    });
    const unsubscribe = api.subscribe(setSnapshot);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  function dispatch(action: DemoAction) {
    if (!api) {
      setSnapshot((current) => applyDemoAction(current, action));
      return;
    }
    void api.dispatch(action).then(setSnapshot);
  }

  return {
    dispatch,
    isDesktop: Boolean(api),
    snapshot,
    viewerId,
  };
}

function HeaderBar({
  isFullscreen,
  onFullscreen,
  onQuit,
  onReset,
}: {
  isFullscreen: boolean;
  onFullscreen: () => void;
  onQuit?: () => void;
  onReset: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/80 bg-white/80 px-5 py-4 shadow-soft backdrop-blur">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-slate-900">恋人桌宠</h1>
          <span className="rounded-full bg-[#efe7ff] px-3 py-1 text-xs font-bold text-[#7054b8]">Demo Mode</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">送对象一个住在电脑里的你</p>
      </div>
      <div className="flex gap-2">
        <button className="soft-button bg-[#e8f5ff]" onClick={onFullscreen}>
          {isFullscreen ? "退出全屏" : "模拟全屏"}
        </button>
        <button className="soft-button bg-[#ffe8ef]" onClick={onReset}>
          重置 Demo
        </button>
        {onQuit && (
          <button className="soft-button bg-[#f1f5f9]" onClick={onQuit}>
            退出
          </button>
        )}
      </div>
    </header>
  );
}

function DesktopPanel({
  userId,
  state,
  isFullscreen,
  messages,
  onInteract,
  onStatus,
  onToggle,
}: {
  userId: UserId;
  state: ReturnType<typeof createInitialState>;
  isFullscreen: boolean;
  messages: InteractionMessage[];
  onInteract: (fromUserId: UserId, type: InteractionType) => void;
  onStatus: (userId: UserId, status: UserStatus) => void;
  onToggle: (flag: "isMuted" | "isWorkMode" | "isClickThrough") => void;
}) {
  const user = state.users[userId];
  const partner = state.users[otherUser(userId)];
  const compact = user.isWorkMode || isFullscreen;

  return (
    <section className="desktop-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {user.role === "me" ? "我的桌面" : "对象的桌面"}
          </p>
          <h2 className="mt-1 text-xl font-black">{user.name}的桌面</h2>
        </div>
        <StatusPill status={user.status} />
      </div>

      <div className={`desktop-stage ${compact ? "desktop-stage-compact" : ""}`}>
        <div className="taskbar">
          <span>📁 资料</span>
          <span>📝 待办</span>
          <span>{user.isMuted ? "静音" : "轻音效"}</span>
        </div>
        <PetCharacter user={user} compact={compact} isFullscreen={isFullscreen} />
        {user.toast && <div className="pet-toast">{user.toast}</div>}
        {user.pendingCount > 0 && <div className="badge-dot">待接收 {user.pendingCount}</div>}
        {user.capsuleCount > 0 && <div className="capsule-badge">离线胶囊 +{user.capsuleCount}</div>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <p className="section-label">给{partner.name}一个轻互动</p>
          <div className="grid grid-cols-2 gap-2">
            {interactions.map((item) => (
              <button key={item.type} className="interaction-button" onClick={() => onInteract(userId, item.type)}>
                <span>{item.icon}</span>
                {interactionLabels[item.type]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="section-label">状态</p>
          <div className="flex flex-col gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                className={`status-button ${user.status === status ? "status-button-active" : ""}`}
                onClick={() => onStatus(userId, status)}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="section-label">低打扰常驻层</p>
        <div className="grid grid-cols-3 gap-2">
          <ToggleButton active={user.isWorkMode} onClick={() => onToggle("isWorkMode")} label="工作模式" />
          <ToggleButton active={user.isMuted} onClick={() => onToggle("isMuted")} label="静音模式" />
          <ToggleButton active={user.isClickThrough} onClick={() => onToggle("isClickThrough")} label="点击穿透" />
        </div>
        {user.isClickThrough && <p className="mt-2 text-xs text-slate-500">当前模拟点击穿透，不阻挡桌面操作。</p>}
      </div>

      <MessageList messages={messages} viewerId={userId} />
    </section>
  );
}

function PetCharacter({
  user,
  compact,
  isFullscreen,
}: {
  user: ReturnType<typeof createInitialState>["users"][UserId];
  compact: boolean;
  isFullscreen: boolean;
}) {
  const themeClass = user.avatarTheme === "pink" ? "pet-pink" : "pet-blue";
  return (
    <div
      className={`pet ${themeClass} mood-${user.mood} ${compact ? "pet-compact" : ""} ${
        isFullscreen ? "pet-edge" : ""
      } ${user.isClickThrough ? "pet-click-through" : ""}`}
    >
      <div className="pet-ear pet-ear-left" />
      <div className="pet-ear pet-ear-right" />
      <div className="pet-face">
        <span className="pet-eye" />
        <span className="pet-mouth">{user.status === "offline" ? "z" : "⌣"}</span>
        <span className="pet-eye" />
      </div>
      <div className="pet-cheeks" />
      <div className="pet-body">
        <span className="pet-hand">╰</span>
        <span className="pet-heart">♡</span>
        <span className="pet-hand">╯</span>
      </div>
      <div className="speech-bubble">{speechFor(user.mood)}</div>
    </div>
  );
}

function MessageList({ messages, viewerId }: { messages: InteractionMessage[]; viewerId: UserId }) {
  return (
    <div>
      <p className="section-label">轻消息卡</p>
      <div className="message-list">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">还没有互动，先发送一个摸头吧。</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-card">
              <span className={`message-status status-${message.status}`}>{message.status}</span>
              <p className="text-sm font-semibold">
                {message.fromUserId === viewerId ? `你发送了${interactionLabels[message.type]}` : message.text}
              </p>
              <p className="text-xs text-slate-400">{message.createdAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SharedHomePanel({
  home,
  pulse,
}: {
  home: ReturnType<typeof createInitialState>["sharedHome"];
  pulse: number;
}) {
  return (
    <section className="shared-home">
      <div>
        <p className="section-label">双人绑定空间</p>
        <h2 className="text-2xl font-black">我们的共享小家</h2>
      </div>
      <div className="home-room">
        <div className="sofa">🛋️</div>
        <div className="table">☕</div>
        <div className="frame">♡</div>
        <div className="tree">🌱</div>
        <div key={pulse} className="floating-heart">
          ♥
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="今日互动" value={`${home.todayInteractionCount}/4`} />
        <Metric label="亲密值" value={`+${home.intimacyScore}`} />
        <Metric label="纪念日" value={`第 ${home.anniversaryDay} 天`} />
        <Metric label="小家装饰" value={home.roomTheme} />
      </div>
      <p className="rounded-2xl bg-white/70 p-3 text-sm text-slate-500">今天也一起好好生活。互动会让小家冒出短暂爱心。</p>
    </section>
  );
}

function GlobalTimeline({ timeline }: { timeline: string[] }) {
  return (
    <Panel title="全局事件时间线">
      <div className="space-y-2">
        {timeline.map((item, index) => (
          <div key={`${item}-${index}`} className="timeline-item">
            <span className="timeline-dot" />
            {item}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PrivacyPanel({ onClear }: { onClear: () => void }) {
  const tags = ["仅同步动作", "不采集位置", "不读聊天记录", "本地工作模式", "一键解绑"];
  return (
    <Panel title="隐私与边界">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="privacy-tag">
            {tag}
          </span>
        ))}
      </div>
      <button className="mt-3 w-full rounded-2xl bg-white/80 px-4 py-2 text-sm font-bold text-[#d95675]" onClick={onClear}>
        一键清空互动记录
      </button>
    </Panel>
  );
}

function DemoGuidePanel() {
  return (
    <Panel title="Demo 说明">
      <p className="text-sm leading-6 text-slate-500">
        先让双方在线试试实时感应；把一侧切到专注，互动会进入待接收；切到离线则会存成小胶囊，上线后一次播放。
      </p>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] border border-white/80 bg-white/75 p-4 shadow-soft backdrop-blur">
      <h3 className="mb-3 text-base font-black">{title}</h3>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function ToggleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`toggle-button ${active ? "toggle-button-active" : ""}`} onClick={onClick}>
      {label}：{active ? "开" : "关"}
    </button>
  );
}

function StatusPill({ status }: { status: UserStatus }) {
  return (
    <span className={`status-pill status-pill-${status}`}>
      <i />
      {statusLabels[status]}
    </span>
  );
}

function speechFor(mood: ReturnType<typeof createInitialState>["users"][UserId]["mood"]) {
  if (mood === "pat") return "星星摸头";
  if (mood === "hug") return "抱抱一下";
  if (mood === "miss") return "想你了";
  if (mood === "cheer") return "加油!";
  if (mood === "focus") return "专注中";
  if (mood === "offline") return "睡一会";
  if (mood === "happy") return "收到啦";
  return "我在这里";
}
