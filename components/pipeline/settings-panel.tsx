"use client";

import React from "react";
import { useState } from "react";
import {
  Settings,
  Key,
  Cpu,
  Volume2,
  ImageIcon,
  Video,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface APIConfig {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface SettingsState {
  llm: APIConfig;
  imageGen: APIConfig;
  videoGen: APIConfig;
  tts: APIConfig;
}

const defaultSettings: SettingsState = {
  llm: {
    provider: "openai",
    apiKey: "",
    baseUrl: "",
    model: "gpt-4",
  },
  imageGen: {
    provider: "midjourney",
    apiKey: "",
    baseUrl: "",
    model: "",
  },
  videoGen: {
    provider: "runway",
    apiKey: "",
    baseUrl: "",
    model: "",
  },
  tts: {
    provider: "elevenlabs",
    apiKey: "",
    baseUrl: "",
    model: "",
  },
};

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "qwen", label: "通义千问" },
  { value: "zhipu", label: "智谱AI" },
  { value: "lm-studio", label: "LM Studio (本地)" },
  { value: "ollama", label: "Ollama (本地)" },
  { value: "custom", label: "自定义" },
];

const IMAGE_PROVIDERS = [
  { value: "midjourney", label: "Midjourney" },
  { value: "dalle", label: "DALL-E" },
  { value: "stablediffusion", label: "Stable Diffusion" },
  { value: "flux", label: "Flux" },
  { value: "custom", label: "自定义" },
];

const VIDEO_PROVIDERS = [
  { value: "luma", label: "Luma (Dream Machine)" },
  { value: "runway", label: "Runway" },
  { value: "kling", label: "可灵 (Kling)" },
  { value: "pika", label: "Pika" },
  { value: "sora", label: "Sora" },
  { value: "custom", label: "自定义" },
];

const TTS_PROVIDERS = [
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "azure", label: "Azure TTS" },
  { value: "google", label: "Google TTS" },
  { value: "fish", label: "Fish Audio" },
  { value: "custom", label: "自定义" },
];

const PROVIDER_MODELS: Record<string, string[]> = {
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229"],
  qwen: ["qwen-turbo", "qwen-plus", "qwen-max"],
  zhipu: ["glm-4", "glm-4v", "glm-3-turbo"],
};

interface APIConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  config: APIConfig;
  providers: { value: string; label: string }[];
  onChange: (config: APIConfig) => void;
  showModel?: boolean;
  detectedServices?: Record<string, boolean>;
  localModels?: Record<string, string[]>;
  defaultOpen?: boolean;
}

function APIConfigSection({
  title,
  icon,
  config,
  providers,
  onChange,
  showModel = true,
  detectedServices = {},
  localModels = {},
  defaultOpen = false,
}: APIConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showKey, setShowKey] = useState(false);

  const isLocalService = config.provider === "lm-studio" || config.provider === "ollama";
  const isDetected = detectedServices[config.provider];
  const models = localModels[config.provider] || PROVIDER_MODELS[config.provider] || [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
            {isLocalService && isDetected && (
              <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {(config.apiKey || isLocalService) && (
              <Check className="h-4 w-4 text-accent" />
            )}
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">服务提供商</Label>
          <Select
            value={config.provider}
            onValueChange={(value) => {
              const newConfig = { ...config, provider: value };
              if (value === "lm-studio") {
                newConfig.baseUrl = "http://localhost:1234/api/v1";
                newConfig.apiKey = "lm-studio";
              } else if (value === "ollama") {
                newConfig.baseUrl = "http://localhost:11434/v1";
                newConfig.apiKey = "ollama";
              } else if (value === "deepseek") {
                newConfig.baseUrl = "https://api.deepseek.com";
                newConfig.model = "deepseek-chat";
              } else if (value === "openai") {
                newConfig.baseUrl = "https://api.openai.com/v1";
                newConfig.model = "gpt-4o";
              }
              onChange(newConfig);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value} className="flex items-center justify-between">
                  <span>{p.label}</span>
                  {detectedServices[p.value] && (
                    <span className="ml-2 text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded">在线</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isLocalService && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) =>
                  onChange({ ...config, apiKey: e.target.value })
                }
                placeholder="sk-..."
                className="h-9 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {(config.provider === "custom" || isLocalService || config.provider === "deepseek") && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Base URL</Label>
            <Input
              value={config.baseUrl || ""}
              onChange={(e) =>
                onChange({ ...config, baseUrl: e.target.value })
              }
              placeholder={isLocalService ? "自动识别中..." : "https://api.example.com/v1"}
              className="h-9"
            />
          </div>
        )}

        {showModel && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">模型</Label>
            {models.length > 0 ? (
              <Select
                value={config.model}
                onValueChange={(value) => onChange({ ...config, model: value })}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={config.model || ""}
                onChange={(e) =>
                  onChange({ ...config, model: e.target.value })
                }
                placeholder="模型名称"
                className="h-9"
              />
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [detectedServices, setDetectedServices] = useState<Record<string, boolean>>({});
  const [localModels, setLocalModels] = useState<Record<string, string[]>>({});

  const detectServices = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    const services = [
      { id: "lm-studio", url: "http://localhost:1234/api/v1/models", altUrl: "http://localhost:1234/v1/models" },
      { id: "ollama", url: "http://localhost:11434/api/tags" },
    ];

    for (const service of services) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort("timeout"), 1500);
      
      try {
        let response = await fetch(service.url, { 
          signal: controller.signal,
          mode: 'cors',
          credentials: 'omit'
        });

        // 如果主 URL 失败且有备用 URL，尝试备用 URL
        if (!response.ok && 'altUrl' in service) {
          clearTimeout(timeoutId);
          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort("timeout"), 1500);
          try {
            response = await fetch(service.altUrl!, { 
              signal: altController.signal,
              mode: 'cors',
              credentials: 'omit'
            });
          } finally {
            clearTimeout(altTimeoutId);
          }
        }
        
        if (response.ok) {
          setDetectedServices(prev => ({ ...prev, [service.id]: true }));
          const data = await response.json();
          
          if (service.id === "lm-studio") {
            const models = data.data?.map((m: any) => m.id) || [];
            setLocalModels(prev => ({ ...prev, [service.id]: models }));
          } else if (service.id === "ollama") {
            const models = data.models?.map((m: any) => m.name) || [];
            setLocalModels(prev => ({ ...prev, [service.id]: models }));
          }
        } else {
          setDetectedServices(prev => ({ ...prev, [service.id]: false }));
        }
      } catch (e: any) {
        // 如果是超时或手动取消，静默处理
        if (e.name === 'AbortError' || e.message === 'signal is aborted') {
          // ignore
        } else {
          // 其他网络错误也静默处理，避免控制台报错堆栈
          // console.debug(`Service detection failed for ${service.id}:`, e.message);
        }
        setDetectedServices(prev => ({ ...prev, [service.id]: false }));
      } finally {
        clearTimeout(timeoutId);
      }
    }
    setIsRefreshing(false);
  };

  const handleSave = () => {
    // 保存到 localStorage (演示用)
    localStorage.setItem("pipeline-settings", JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("pipeline-settings");
  };

  // 加载保存的设置
  React.useEffect(() => {
    const saved = localStorage.getItem("pipeline-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <Dialog onOpenChange={(open) => {
      if (open) detectServices();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/40 shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/10">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">API 设置</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors text-xs"
                onClick={() => detectServices()}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
                <span>刷新状态</span>
              </Button>
              <Button
                size="sm"
                className="h-8 min-w-[100px] shadow-lg shadow-primary/20"
                onClick={handleSave}
              >
                {isSaved ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    保存成功
                  </>
                ) : (
                  "保存配置"
                )}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            配置各个AI服务的API密钥和参数，支持本地与在线模型
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <APIConfigSection
                title="大语言模型 (LLM)"
                icon={<FileText className="h-4 w-4" />}
                config={settings.llm}
                providers={LLM_PROVIDERS}
                onChange={(llm) => setSettings({ ...settings, llm })}
                detectedServices={detectedServices}
                localModels={localModels}
                defaultOpen={true}
              />

              <APIConfigSection
                title="图片生成"
                icon={<ImageIcon className="h-4 w-4" />}
                config={settings.imageGen}
                providers={IMAGE_PROVIDERS}
                onChange={(imageGen) => setSettings({ ...settings, imageGen })}
                defaultOpen={true}
              />
            </div>

            <div className="space-y-6">
              <APIConfigSection
                title="视频生成"
                icon={<Video className="h-4 w-4" />}
                config={settings.videoGen}
                providers={VIDEO_PROVIDERS}
                onChange={(videoGen) => setSettings({ ...settings, videoGen })}
                defaultOpen={true}
              />

              <APIConfigSection
                title="语音合成 (TTS)"
                icon={<Volume2 className="h-4 w-4" />}
                config={settings.tts}
                providers={TTS_PROVIDERS}
                onChange={(tts) => setSettings({ ...settings, tts })}
                defaultOpen={true}
              />

              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                  <Cpu className="h-4 w-4" />
                  <span>服务连接状态</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <StatusItem label="LLM" active={!!settings.llm.apiKey || settings.llm.provider === 'lm-studio' || settings.llm.provider === 'ollama'} />
                  <StatusItem label="图片生成" active={!!settings.imageGen.apiKey} />
                  <StatusItem label="视频生成" active={!!settings.videoGen.apiKey} />
                  <StatusItem label="语音合成" active={!!settings.tts.apiKey} />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 px-6 flex justify-between items-center bg-muted/5 border-t border-border/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleReset}
          >
            恢复默认设置
          </Button>
          <div className="text-[10px] text-muted-foreground/50">
            设置将保存在本地浏览器中
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/50 border border-border/30">
      <div className={cn(
        "h-1.5 w-1.5 rounded-full",
        active ? "bg-accent shadow-[0_0_8px_rgba(var(--accent),0.5)]" : "bg-muted-foreground/30"
      )} />
      <span className={cn(
        "font-medium",
        active ? "text-foreground" : "text-muted-foreground/60"
      )}>{label}</span>
    </div>
  );
}
