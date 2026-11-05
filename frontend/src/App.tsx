import {
  ApiOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  HomeOutlined,
  RightOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { Alert, App as AntApp } from "antd";
import { useEffect, useRef, useState } from "react";
import { ChatComposer } from "./components/ChatComposer";
import { ConversationThread } from "./components/ConversationThread";
import type { ChatTurn } from "./components/ConversationThread";
import { API_BASE_URL, WS_BASE_URL } from "./lib/config";
import { useDeepAgentSession } from "./hooks/useDeepAgentSession";
import type { ConnectionState, UploadedItem } from "./types";

const DISPLAY_NAME = "Elaine";

function formatToday(now: Date): string {
  const date = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(now);
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);
  return `今天是 ${date} ${weekday} · ${time}`;
}

function connectionLabel(state: ConnectionState): string {
  const labels: Record<ConnectionState, string> = {
    connecting: "连接中",
    connected: "已连接",
    reconnecting: "重连中",
    closed: "已关闭"
  };
  return labels[state];
}

function createTurn(content: string): ChatTurn {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    content,
    events: [],
    files: [],
    isRunning: true,
    result: "",
    timestamp: new Date().toISOString()
  };
}

export default function App() {
  const { message } = AntApp.useApp();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [stagedItems, setStagedItems] = useState<UploadedItem[]>([]);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [now, setNow] = useState(() => new Date());
  const streamRef = useRef<HTMLElement | null>(null);
  const session = useDeepAgentSession();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setTurns((previous) => {
      if (previous.length === 0) {
        return previous;
      }

      const latestTurn = previous[previous.length - 1];
      const nextLatestTurn = {
        ...latestTurn,
        events: session.events,
        files: session.files,
        isRunning: session.isRunning,
        result: session.result
      };

      return [...previous.slice(0, -1), nextLatestTurn];
    });
  }, [session.events, session.files, session.isRunning, session.result]);

  useEffect(() => {
    const streamNode = streamRef.current;
    if (!streamNode) {
      return;
    }

    window.requestAnimationFrame(() => {
      streamNode.scrollTo({
        top: streamNode.scrollHeight,
        behavior: "smooth"
      });
    });
  }, [turns]);

  async function handleSubmit() {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      message.warning("请输入研搜任务");
      return;
    }

    const nextTurn = createTurn(cleanQuery);
    setTurns((previous) => [...previous, nextTurn]);
    setQuery("");

    try {
      await session.submitTask(cleanQuery, language);
      message.success("任务已启动，执行过程会显示在对话中");
    } catch (error) {
      setTurns((previous) =>
        previous.map((turn) =>
          turn.id === nextTurn.id
            ? {
              ...turn,
              isRunning: false,
              result: error instanceof Error ? error.message : "任务启动失败"
            }
            : turn
        )
      );
      message.error(error instanceof Error ? error.message : "任务启动失败");
    }
  }

  async function handleCancel() {
    try {
      const response = await session.cancelCurrentTask();
      message.info(response.status === "cancelling" ? "取消请求已发送，正在等待当前调用结束" : "任务已取消");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "取消任务失败");
    }
  }

  async function handleUpload(items: UploadedItem[]) {
    try {
      const response = await session.uploadFiles(items);
      setStagedItems([]);
      message.success(`已上传 ${response.files.length} 个文件`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "上传失败");
    }
  }

  function handleNewSession() {
    session.resetSession();
    setTurns([]);
    setQuery("");
    setStagedItems([]);
  }

  const online = session.connectionState === "connected";
  const isHome = turns.length === 0;

  return (
    <div className="chat-app-shell min-h-dvh">
      <aside className="chat-sidebar" aria-label="主导航">
        <div className="flex items-center gap-3 px-2 pt-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-300 via-blue-500 to-blue-700 text-3xl font-black text-white shadow-[0_10px_25px_rgba(38,111,240,0.2)]" aria-hidden>
            D
          </div>
          <div className="min-w-0">
            <strong className="block text-xl font-bold leading-tight text-[#12244b]">DeepSearch</strong>
            <span className="block text-xs leading-6 text-[#64789a]">深度研搜 · 对话式智能研究平台</span>
          </div>
        </div>

        <nav className="mt-8 grid gap-2" aria-label="工具入口">
          <button
            className={`flex min-h-14 items-center gap-4 rounded-xl px-4 text-left font-semibold transition-colors ${isHome ? "bg-[#e3f0ff] text-[#256ff0]" : "text-[#405477] hover:bg-[#edf5ff]"}`}
            onClick={handleNewSession}
            type="button"
          >
            <HomeOutlined className="text-xl" aria-hidden />
            首页
          </button>
          <button
            className="flex min-h-14 items-center gap-4 rounded-xl px-4 text-left text-[#405477] transition-colors hover:bg-[#edf5ff]"
            onClick={() => setQuery("请使用网络搜索助手，检索 2026 年跨境电商 AI 客服趋势，列出 5 条关键变化，并附上来源链接。")}
            type="button"
          >
            <GlobalOutlined className="text-xl" aria-hidden />
            网络搜索助手
          </button>
          <button
            className="flex min-h-14 items-center gap-4 rounded-xl px-4 text-left text-[#405477] transition-colors hover:bg-[#edf5ff]"
            onClick={() => setQuery("请使用数据库查询助手，查询库存大于 100 的药品，按库存量排序列出药品名称、批次号和仓库位置。")}
            type="button"
          >
            <DatabaseOutlined className="text-xl" aria-hidden />
            数据库查询助手
          </button>
          <button
            className="flex min-h-14 items-center gap-4 rounded-xl px-4 text-left text-[#405477] transition-colors hover:bg-[#edf5ff]"
            onClick={() => setQuery("请使用 RAGFlow 助手，查询公司内部白皮书中关于品类策略的内容，并整理成三条可执行建议。")}
            type="button"
          >
            <ApartmentOutlined className="text-xl" aria-hidden />
            Workflow 助手
          </button>
        </nav>

        <div className="mt-auto space-y-4 border-t border-[#dfebf9] px-2 pt-5 text-sm text-[#64789a]">
          <div className="flex items-center gap-3">
            <SettingOutlined aria-hidden />
            <span>系统状态</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${online ? "bg-[#18a66e] shadow-[0_0_0_5px_rgba(24,166,110,0.12)]" : "bg-[#d68519]"}`} aria-hidden />
            <span>WebSocket</span>
            <strong className={online ? "font-medium text-[#11875b]" : "font-medium text-[#b37419]"}>{connectionLabel(session.connectionState)}</strong>
            <RightOutlined className="ml-auto text-xs" aria-hidden />
          </div>
          <div className="flex min-w-0 items-center gap-3" title={`${API_BASE_URL} · ${WS_BASE_URL}`}>
            <ApiOutlined aria-hidden />
            <span className="truncate">{API_BASE_URL}</span>
            <RightOutlined className="ml-auto text-xs" aria-hidden />
          </div>
        </div>
      </aside>

      <main className={`chat-main ${isHome ? "chat-main--home" : ""}`}>
        <header className={`chat-hero relative mx-auto w-full ${isHome ? "chat-hero--home" : "flex items-center justify-between py-5"}`}>
          <div className="relative z-10 max-w-[670px]">
            <span className="text-xs font-bold tracking-[0.45em] text-[#5475c1]">DEEPSEARCH</span>
            <h1 className={`${isHome ? "mt-4 text-5xl" : "mt-1 text-2xl"} font-extrabold tracking-tight text-[#10234d]`}>Hello, {DISPLAY_NAME}</h1>
            {isHome ? (
              <>
                <p className="chat-hero-date mt-3 text-xl text-[#516890]">{formatToday(now)}</p>
                <p className="mt-4 text-base leading-7 text-[#64789a]">汇聚多种专业工具，助你更高效地完成研究与分析。</p>
              </>
            ) : null}
          </div>
          {isHome ? (
            <div className="pointer-events-none absolute right-10 top-10 hidden h-44 w-72 rounded-[90px] border border-white/80 bg-gradient-to-br from-sky-200/70 via-blue-300/45 to-white/80 shadow-[0_25px_65px_rgba(67,132,225,0.15)] lg:block" aria-hidden>
              <div className="absolute -left-8 top-5 h-32 w-32 rounded-full border border-white/80 bg-gradient-to-br from-white/80 to-blue-200/50" />
              <div className="absolute bottom-4 right-5 h-16 w-52 rotate-[-18deg] rounded-2xl border border-white/80 bg-gradient-to-r from-blue-300/70 to-white/80" />
            </div>
          ) : null}
          <div className={`run-indicator absolute right-2 top-5 ${session.isRunning ? "run-indicator--live" : ""}`}>
            {session.isRunning ? <BranchesOutlined aria-hidden /> : <ClockCircleOutlined aria-hidden />}
            {session.isRunning ? "研搜中" : "待命"}
          </div>
        </header>

        {session.lastError ? (
          <Alert
            className="chat-alert"
            message={session.lastError}
            showIcon
            type="error"
          />
        ) : null}

        <section className="chat-stream-panel" ref={streamRef}>
          <ConversationThread
            onUseExample={setQuery}
            turns={turns}
          />
        </section>

        <ChatComposer
          language={language}
          onLanguageChange={setLanguage}
          isCancelling={session.isCancelling}
          isRunning={session.isRunning}
          isUploading={session.isUploading}
          onCancel={handleCancel}
          onNewSession={handleNewSession}
          onQueryChange={setQuery}
          onStagedItemsChange={setStagedItems}
          onSubmit={handleSubmit}
          onUpload={handleUpload}
          query={query}
          stagedItems={stagedItems}
          uploadedItems={session.uploadedItems}
        />
      </main>
    </div>
  );
}
