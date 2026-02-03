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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  { value: "runway", label: "Runway" },
  { value: "pika", label: "Pika" },
  { value: "sora", label: "Sora" },
  { value: "kling", label: "可灵" },
  { value: "custom", label: "自定义" },
];

const TTS_PROVIDERS = [
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "azure", label: "Azure TTS" },
  { value: "google", label: "Google TTS" },
  { value: "fish", label: "Fish Audio" },
  { value: "custom", label: "自定义" },
];

interface APIConfigSectionProps {
  title: string;
  icon: React.ReactNode;
  config: APIConfig;
  providers: { value: string; label: string }[];
  onChange: (config: APIConfig) => void;
  showModel?: boolean;
}

function APIConfigSection({
  title,
  icon,
  config,
  providers,
  onChange,
  showModel = true,
}: APIConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);

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
          </div>
          <div className="flex items-center gap-2">
            {config.apiKey && (
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
            onValueChange={(value) =>
              onChange({ ...config, provider: value })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {config.provider === "custom" && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Base URL</Label>
            <Input
              value={config.baseUrl || ""}
              onChange={(e) =>
                onChange({ ...config, baseUrl: e.target.value })
              }
              placeholder="https://api.example.com/v1"
              className="h-9"
            />
          </div>
        )}

        {showModel && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">模型</Label>
            <Input
              value={config.model || ""}
              onChange={(e) =>
                onChange({ ...config, model: e.target.value })
              }
              placeholder="模型名称"
              className="h-9"
            />
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);

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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-4 left-4 z-50 h-10 w-10 rounded-full shadow-lg"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-card">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API 设置
          </SheetTitle>
          <SheetDescription>
            配置各个AI服务的API密钥和参数
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          <APIConfigSection
            title="大语言模型 (LLM)"
            icon={<FileText className="h-4 w-4" />}
            config={settings.llm}
            providers={LLM_PROVIDERS}
            onChange={(llm) => setSettings({ ...settings, llm })}
          />

          <APIConfigSection
            title="图片生成"
            icon={<ImageIcon className="h-4 w-4" />}
            config={settings.imageGen}
            providers={IMAGE_PROVIDERS}
            onChange={(imageGen) => setSettings({ ...settings, imageGen })}
          />

          <APIConfigSection
            title="视频生成"
            icon={<Video className="h-4 w-4" />}
            config={settings.videoGen}
            providers={VIDEO_PROVIDERS}
            onChange={(videoGen) => setSettings({ ...settings, videoGen })}
          />

          <APIConfigSection
            title="语音合成 (TTS)"
            icon={<Volume2 className="h-4 w-4" />}
            config={settings.tts}
            providers={TTS_PROVIDERS}
            onChange={(tts) => setSettings({ ...settings, tts })}
          />
        </div>

        <div className="mt-6 space-y-2">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4" />
              <span>配置状态</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {settings.llm.apiKey ? (
                  <Check className="h-3 w-3 text-accent" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span>LLM</span>
              </div>
              <div className="flex items-center gap-1">
                {settings.imageGen.apiKey ? (
                  <Check className="h-3 w-3 text-accent" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span>图片生成</span>
              </div>
              <div className="flex items-center gap-1">
                {settings.videoGen.apiKey ? (
                  <Check className="h-3 w-3 text-accent" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span>视频生成</span>
              </div>
              <div className="flex items-center gap-1">
                {settings.tts.apiKey ? (
                  <Check className="h-3 w-3 text-accent" />
                ) : (
                  <X className="h-3 w-3 text-muted-foreground" />
                )}
                <span>语音合成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 bg-transparent"
            onClick={handleReset}
          >
            重置
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
          >
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已保存
              </>
            ) : (
              "保存设置"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
