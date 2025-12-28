
export const INTEGRATION_GUIDE = [
  {
    step: "1. 触发请求",
    desc: "使用相对路径 /api 调用后端。SWA 代理会自动处理物理路由。",
    code: `const startResponse = await fetch('/api/HttpStart', { 
  method: 'POST'
});
const statusUrls = await startResponse.json(); 
// 返回值包含 statusQueryGetUri 等监控地址`
  },
  {
    step: "2. 异步轮询",
    desc: "由于 Durable Function 是异步的，前端需不断查询进度直到完成。",
    code: `async function poll(url) {
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.runtimeStatus === 'Completed') {
    renderResult(data.output); // 最终结果显示
  }
}`
  }
];

export const FRONTEND_FILES = [
  {
    path: "SwaIntegration.js",
    language: "javascript",
    content: `/**
 * 【重要】在 SWA 链接完成后，代码中不要写完整的 https://... 域名
 * 直接使用相对路径 /api/... 即可实现安全通信
 */
async function startDurableProcess() {
  try {
    // 1. 发起流程（对应 C# 中的 HttpStart 函数）
    const response = await fetch('/api/HttpStart', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error("无法启动实例");
    
    const clientUrls = await response.json();
    const statusUrl = clientUrls.statusQueryGetUri;
    
    console.log("实例 ID:", clientUrls.id);

    // 2. 轮询状态（建议每 2-5 秒一次）
    const interval = setInterval(async () => {
      const statusRes = await fetch(statusUrl);
      const statusInfo = await statusRes.json();

      console.log("当前状态:", statusInfo.runtimeStatus);

      if (statusInfo.runtimeStatus === 'Completed') {
        clearInterval(interval);
        // 在这里调用您的 UI 更新函数来显示最后结果
        displayFinalResult(statusInfo.output); 
      } else if (statusInfo.runtimeStatus === 'Failed' || statusInfo.runtimeStatus === 'Terminated') {
        clearInterval(interval);
        alert("流程执行失败");
      }
    }, 2000);

  } catch (error) {
    console.error("集成错误:", error);
  }
}

function displayFinalResult(data) {
  // 假设您的结果显示面板有个 ID 叫 result-view
  document.getElementById('result-view').innerText = JSON.stringify(data, null, 2);
}`
  }
];
