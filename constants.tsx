
export const FRONTEND_FILES = [
  {
    path: "package.json",
    language: "json",
    content: `{
  "name": "durable-visualizer",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}`
  },
  {
    path: "vite.config.ts",
    language: "typescript",
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  }
})`
  },
  {
    path: "tailwind.config.js",
    language: "javascript",
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}`
  }
];

export const DEPLOYABLE_FILES = [
  // ... (保留之前的 C# 文件)
  {
    path: "Functions/Starters/HttpApiStart.cs",
    language: "csharp",
    content: `using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.DurableTask.Client;
using Microsoft.Extensions.Logging;

namespace MyDurableDemo.Functions.Starters;

public class HttpApiStart
{
    private readonly ILogger<HttpApiStart> _logger;
    public HttpApiStart(ILogger<HttpApiStart> logger) => _logger = logger;

    [Function("HttpStart")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post")] HttpRequest req,
        [DurableClient] DurableTaskClient starter)
    {
        // 关键：确保你返回的是 JSON 格式，以便 UI 解析
        string instanceId = await starter.ScheduleNewOrchestrationInstanceAsync("SalesOrchestrator");
        return starter.CreateCheckStatusResponse(instanceId);
    }
}`
  }
  // ... 其他文件保持不变
];

export const ARCHITECTURE_ROLES = [
  {
    title: "Starters (触发器)",
    description: "HTTP 入口，负责启动编排实例。返回 202 状态码。",
    color: "bg-blue-600",
    icon: "⚡"
  },
  {
    title: "Orchestrators (编排器)",
    description: "指挥中心。负责定义工作流、并行处理（Fan-out/Fan-in）。",
    color: "bg-purple-600",
    icon: "🗺️"
  },
  {
    title: "Activities (活动)",
    description: "具体的执行单元。负责 I/O 操作、计算或通知。",
    color: "bg-emerald-600",
    icon: "🛠️"
  }
];

export const CODE_SNIPPETS = {
  FOLDER: `MyFunctionApp/
│
├── Models/
│   └── CitySalesData.cs
│
├── Functions/
│   ├── Starters/
│   ├── Orchestrators/
│   └── Activities/
│
├── Program.cs
├── host.json
└── MyFunctionApp.csproj`,
  ORCHESTRATOR: `[Function("SalesOrchestrator")]
public async Task<string> Run([OrchestrationTrigger] TaskOrchestrationContext context)
{
    var cities = await context.CallActivityAsync<string[]>("Activity_GetCities");
    var tasks = cities.Select(c => context.CallActivityAsync<int>("Activity_Calculate", c));
    return await context.CallActivityAsync<string>("Activity_Report", (await Task.WhenAll(tasks)).Sum());
}`,
  ACTIVITIES: `[Function("Activity_Calculate")]
public async Task<int> Calculate([ActivityTrigger] string city)
{
    await Task.Delay(1000);
    return new Random().Next(100, 500);
}`
};
