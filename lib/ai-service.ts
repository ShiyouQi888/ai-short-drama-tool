
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

const DEFAULT_SETTINGS: SettingsState = {
  llm: { provider: "openai", apiKey: "", baseUrl: "", model: "gpt-4o" },
  imageGen: { provider: "midjourney", apiKey: "", baseUrl: "", model: "" },
  videoGen: { provider: "runway", apiKey: "", baseUrl: "", model: "" },
  tts: { provider: "elevenlabs", apiKey: "", baseUrl: "", model: "" },
};

export class AIService {
  private static getSettings(): SettingsState {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const saved = localStorage.getItem("pipeline-settings");
    let settings = DEFAULT_SETTINGS;
    
    if (saved) {
      try {
        settings = JSON.parse(saved);
      } catch {
        settings = DEFAULT_SETTINGS;
      }
    }

    // 环境变量注入 (仅作为初始化默认值，不覆盖已保存的非空配置)
    const isOpenAI = settings.llm.provider === "openai";
    if (isOpenAI) {
      if (!settings.llm.apiKey && process.env.NEXT_PUBLIC_OPENAI_API_KEY && process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your_api_key_here') {
        settings.llm.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      }
      if (!settings.llm.baseUrl && process.env.NEXT_PUBLIC_OPENAI_BASE_URL) {
        settings.llm.baseUrl = process.env.NEXT_PUBLIC_OPENAI_BASE_URL;
      }
    }

    return settings;
  }

  static async callLLM(prompt: string, systemPrompt?: string) {
    const settings = this.getSettings();
    const llm = settings.llm;
    
    const provider = llm.provider || "openai";
    if (!llm.provider) {
      console.warn(`[AIService] No provider specified in settings, defaulting to openai`);
    }
    // 确保 baseUrl 干净且没有末尾逗号或多余空格
    let baseUrl = (llm.baseUrl?.trim() || (provider === "deepseek" ? "https://api.deepseek.com" : "https://api.openai.com/v1")).replace(/[,，]$/, "");
    
    const model = llm.model || (provider === "deepseek" ? "deepseek-chat" : "gpt-4o");
    const apiKey = llm.apiKey?.trim();

    console.log(`[AIService] Calling LLM: provider=${provider}, model=${model}, baseUrl=${baseUrl}`);

    if (!apiKey || apiKey === 'your_api_key_here') {
      // 本地服务（如 lm-studio, ollama）通常不需要 API Key
      const isLocalService = provider === "lm-studio" || provider === "ollama";
      if (!isLocalService) {
        const providerNames: Record<string, string> = {
          'openai': 'OpenAI',
          'deepseek': 'DeepSeek',
          'anthropic': 'Anthropic',
          'qwen': '通义千问',
          'zhipu': '智谱AI',
          'lm-studio': 'LM Studio',
          'ollama': 'Ollama'
        };
        const providerName = providerNames[provider] || provider.toUpperCase();
        throw new Error(`未配置 ${providerName} 的 API Key。请点击左下角设置图标进行配置，并确保点击“保存”按钮。`);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    // 确保 URL 拼接逻辑严密，处理末尾斜杠、非法字符，以及用户可能误填的完整路径
    let cleanBaseUrl = baseUrl.replace(/\/+$/, "");
    
    // 如果用户误填了 /chat/completions，自动修复它
    if (cleanBaseUrl.endsWith("/chat/completions")) {
      cleanBaseUrl = cleanBaseUrl.replace(/\/chat\/completions$/, "");
    }
    
    const url = `${cleanBaseUrl}/chat/completions`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        signal: controller.signal,
        mode: "cors", // 明确指定 cors 模式
        credentials: "omit", // 避免跨域携带 cookie 导致的问题
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          const maskedKey = apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : "未配置";
          console.error(`[AIService] 401 Unauthorized. Provider: ${provider}, URL: ${url}, Key: ${maskedKey}`);
          throw new Error(`API 认证失败 (401): 请检查您的 ${provider.toUpperCase()} API Key 是否正确。当前使用的 Key: ${maskedKey}`);
        }
        if (response.status === 404) {
          throw new Error(`接口不存在 (404): 请检查 Base URL 是否正确。当前地址: ${url}`);
        }
        if (response.status === 403) {
          throw new Error(`访问被拒绝 (403): 可能是 IP 被封禁或 API Key 无权限。`);
        }
        
        let errorMessage = `LLM API Error: ${response.status}`;
        try {
          const error = await response.json();
          errorMessage = error.error?.message || error.message || errorMessage;
        } catch (e) {
          // 忽略解析错误
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // 处理特定的 Chrome 扩展拦截或网络中断
      const isTypeError = error instanceof TypeError || error.name === 'TypeError';
      const isFetchError = error.message?.toLowerCase().includes('fetch') || error.message?.toLowerCase().includes('network');

      if (error.name === 'AbortError') {
        throw new Error(`请求超时 (60s): ${provider.toUpperCase()} 服务响应过慢。如果是本地模型，请检查模型是否已加载；如果是在线 API，请检查网络是否稳定。`);
      }

      if (isTypeError || isFetchError) {
        console.error(`[AIService] Network Error Detail:`, {
          provider,
          url,
          message: error.message,
          stack: error.stack
        });
        
        if (provider === 'lm-studio' || provider === 'ollama') {
          throw new Error(`无法连接到本地服务 (${provider.toUpperCase()}): 
1. 请确保 ${provider.toUpperCase()} 已启动。
2. 请确保已开启 CORS 访问。
3. 检查地址是否正确: ${url}`);
        } else {
          throw new Error(`网络连接失败 (Failed to fetch): 
1. 检查网络连接是否正常。
2. 检查是否需要开启/关闭代理（VPN）。
3. 如果使用了 Chrome 插件（如拦截器、广告屏蔽器），请尝试禁用后重试。
4. 检查 Base URL 是否正确: ${url}`);
        }
      }

      console.error(`[AIService] Unexpected Request Failure:`, error);
      throw error;
    }
  }

  static async generateImage(prompt: string) {
    const settings = this.getSettings();
    const { imageGen } = settings;
    const provider = imageGen.provider || "openai";
    
    console.log(`[AIService] Generating image: provider=${provider}, prompt=${prompt}`);

    if (provider === "openai" || provider === "dalle") {
      const apiKey = imageGen.apiKey || settings.llm.apiKey;
      const baseUrl = imageGen.baseUrl || "https://api.openai.com/v1";
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("未配置 OpenAI API Key，无法使用 DALL-E 生图。");
      }

      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: imageGen.model || "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`DALL-E API Error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].url;
    }

    if (provider === "stablediffusion" || provider === "sd") {
      const baseUrl = imageGen.baseUrl || "http://127.0.0.1:7860";
      console.log(`[AIService] Calling SD API: ${baseUrl}`);
      
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/sdapi/v1/txt2img`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          steps: 20,
          width: 1024,
          height: 1024,
          cfg_scale: 7,
          sampler_name: "Euler a",
        }),
      });

      if (!response.ok) {
        throw new Error(`Stable Diffusion API Error: ${response.statusText}. 请确保 SD WebUI 已启动并开启了 --api 参数。`);
      }

      const data = await response.json();
      if (data.images && data.images.length > 0) {
        return `data:image/png;base64,${data.images[0]}`;
      }
      throw new Error("SD 未返回图片内容");
    }

    if (provider === "flux") {
      // Flux 通常通过第三方 API 提供，如 Fal.ai 或 Replicate
      // 这里以 Fal.ai 为例，或者用户自定义
      const apiKey = imageGen.apiKey;
      const baseUrl = imageGen.baseUrl || "https://fal.run/fal-ai/flux/dev";
      
      if (!apiKey) {
        throw new Error("未配置 Flux API Key (Fal.ai)。");
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt,
          image_size: "landscape_4_3",
          num_inference_steps: 28,
          guidance_scale: 3.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Flux API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.images[0].url;
    }

    // 其他 Provider (MJ 等) 目前先返回模拟数据
    console.warn(`[AIService] Provider ${provider} is not fully implemented for Image Gen, using mock.`);
    await new Promise(r => setTimeout(r, 2000));
    return "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=60";
  }

  static async generateTTS(text: string) {
    const settings = this.getSettings();
    const { tts } = settings;
    const provider = tts.provider || "openai";
    
    console.log(`[AIService] Generating TTS: provider=${provider}, text=${text.slice(0, 20)}...`);

    if (provider === "openai") {
      const apiKey = tts.apiKey || settings.llm.apiKey;
      const baseUrl = tts.baseUrl || "https://api.openai.com/v1";
      
      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error("未配置 OpenAI API Key，无法使用 OpenAI TTS。");
      }

      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: tts.model || "tts-1",
          input: text,
          voice: "alloy",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI TTS Error: ${error.error?.message || response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    if (provider === "elevenlabs") {
      const apiKey = tts.apiKey;
      if (!apiKey) throw new Error("未配置 ElevenLabs API Key。");

      const voiceId = tts.model || "21m00Tcm4TlvDq8ikWAM"; // 默认 Rachel 声音
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: { stability: 0.5, similarity_boost: 0.5 },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs Error: ${response.statusText}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    // 其他 Provider (Azure 等)
    console.warn(`[AIService] Provider ${provider} is not fully implemented for TTS, using mock.`);
    await new Promise(r => setTimeout(r, 1500));
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }

  static async generateVideo(imageUrl: string, audioUrl?: string) {
    const settings = this.getSettings();
    const { videoGen } = settings;
    const provider = videoGen.provider || "luma";
    const apiKey = videoGen.apiKey;
    
    console.log(`[AIService] Generating video: provider=${provider}, imageUrl=${imageUrl.slice(0, 30)}...`);
    
    if (!apiKey && provider !== "mock") {
      console.warn(`[AIService] No API key for ${provider}, using mock instead.`);
      await new Promise(r => setTimeout(r, 3000));
      return "https://www.w3schools.com/html/mov_bbb.mp4";
    }

    if (provider === "luma") {
      // Luma AI Dream Machine API
      try {
        const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Cinematic movement, high quality",
            keyframes: {
              frame0: { type: "image", url: imageUrl }
            }
          }),
        });

        if (!response.ok) throw new Error(`Luma API Error: ${response.statusText}`);
        const data = await response.json();
        const generationId = data.id;

        // 轮询结果
        return await this.pollVideoStatus(`https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`, apiKey);
      } catch (e: any) {
        throw new Error(`Luma 视频生成失败: ${e.message}`);
      }
    }

    if (provider === "runway") {
      // Runway Gen-2/Gen-3 API (Hypothetical standard structure)
      try {
        const response = await fetch("https://api.runwayml.com/v1/image_to_video", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            model: "gen3",
            prompt: "Cinematic motion"
          }),
        });

        if (!response.ok) throw new Error(`Runway API Error: ${response.statusText}`);
        const data = await response.json();
        const taskId = data.id;

        return await this.pollVideoStatus(`https://api.runwayml.com/v1/tasks/${taskId}`, apiKey);
      } catch (e: any) {
        throw new Error(`Runway 视频生成失败: ${e.message}`);
      }
    }

    if (provider === "kling") {
      // 可灵 (Kling) API
      try {
        const response = await fetch("https://api.klingai.com/v1/videos/image-to-video", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "kling-v1",
            image_url: imageUrl,
            prompt: "自然流畅的动作"
          }),
        });

        if (!response.ok) throw new Error(`Kling API Error: ${response.statusText}`);
        const data = await response.json();
        const taskId = data.data.task_id;

        return await this.pollVideoStatus(`https://api.klingai.com/v1/videos/status/${taskId}`, apiKey);
      } catch (e: any) {
        throw new Error(`可灵视频生成失败: ${e.message}`);
      }
    }
    
    await new Promise(r => setTimeout(r, 3000));
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  }

  private static async pollVideoStatus(url: string, apiKey: string, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000)); // 每 5 秒轮询一次
      
      const response = await fetch(url, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      // 不同平台的返回结构可能不同，这里做一些通用适配
      const status = data.status || data.state || (data.data && data.data.status);
      const videoUrl = data.video_url || data.url || (data.data && data.data.video_url);

      if (status === "completed" || status === "SUCCEEDED" || status === "finished") {
        return videoUrl;
      }
      
      if (status === "failed" || status === "FAILED" || status === "error") {
        throw new Error(`视频生成任务失败: ${data.error || "未知错误"}`);
      }
    }
    throw new Error("视频生成超时");
  }
}
