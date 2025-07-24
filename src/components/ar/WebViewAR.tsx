// src/components/ar/WebViewAR.tsx - 带调试功能的版本
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface WebViewARProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  petStatus: any;
  onExit: () => void;
  onDebugInfo?: (info: string) => void; // 新增调试信息回调
}

export default function WebViewAR({ 
  isListening, 
  isSpeaking, 
  isThinking, 
  petStatus, 
  onExit,
  onDebugInfo 
}: WebViewARProps) {
  const [isARReady, setIsARReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Initializing WebView...');
  const webViewRef = useRef<WebView>(null);

  // 更新调试信息
  const updateDebugInfo = (info: string) => {
    setDebugInfo(info);
    onDebugInfo?.(info);
    console.log('🐕 AR Debug:', info);
  };

  // 當寵物狀態改變時，傳送訊息給 WebAR
  useEffect(() => {
    if (webViewRef.current && isARReady) {
      const petState = isListening ? 'listening' : isSpeaking ? 'speaking' : isThinking ? 'thinking' : 'idle';
      const message = JSON.stringify({ 
        type: 'petStateChange', 
        state: petState,
        energy: petStatus?.energy || 80,
        mood: petStatus?.mood || 'neutral'
      });
      webViewRef.current.postMessage(message);
      updateDebugInfo(`Pet state: ${petState}`);
    }
  }, [isListening, isSpeaking, isThinking, isARReady, petStatus]);

  // 简化但功能完整的AR HTML
  const arHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>AR Pet</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #000;
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100%;
        }
        
        #container {
            position: relative;
            width: 100vw;
            height: 100vh;
            background: #000;
        }
        
        #video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            z-index: 1;
        }
        
        #canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
            touch-action: none;
        }
        
        .overlay {
            position: absolute;
            z-index: 10;
            pointer-events: none;
        }
        
        .status {
            top: 20px;
            left: 20px;
            right: 120px;
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            backdrop-filter: blur(10px);
        }
        
        .loading {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            min-width: 250px;
        }
        
        .instructions {
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.85);
            color: white;
            padding: 12px 16px;
            border-radius: 12px;
            text-align: center;
            font-size: 13px;
            backdrop-filter: blur(10px);
        }
        
        .error {
            color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
            border: 1px solid rgba(255, 107, 107, 0.3);
        }
        
        .success {
            color: #51cf66;
        }
        
        .warning {
            color: #ffd43b;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #333;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .debug-info {
            position: absolute;
            bottom: 80px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            color: #00ff00;
            padding: 8px 12px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            z-index: 15;
        }
    </style>
</head>
<body>
    <div id="container">
        <video id="video" autoplay muted playsinline webkit-playsinline></video>
        <canvas id="canvas"></canvas>
    </div>

    <div id="loading" class="overlay loading">
        <div class="spinner"></div>
        <h3>🐕 AR Pet Starting</h3>
        <p id="loadingText">Initializing camera...</p>
        <small id="deviceInfo">Device: ${Platform.OS} | WebView AR</small>
    </div>

    <div id="status" class="overlay status" style="display:none;">
        <div><strong>🎯 AR Pet Active</strong></div>
        <div id="petStatusText">Pet Status: Idle</div>
        <div id="petStatsText" style="font-size: 12px; margin-top: 3px; opacity: 0.8;">Energy: 80/100</div>
    </div>

    <div id="instructions" class="overlay instructions" style="display:none;">
        📱 Tap screen to move pet • 🎯 Pet appears on flat surfaces<br>
        🗣️ Talk and watch your pet react in real-time!
    </div>
    
    <div id="debugInfo" class="debug-info">
        System: Starting...
    </div>

    <script>
        // 全局变量
        let video, canvas, ctx;
        let currentState = 'idle';
        let currentEnergy = 80;
        let currentMood = 'neutral';
        let isReady = false;
        let petX = 0.5, petY = 0.7;
        let animationTime = 0;
        let lastFrameTime = 0;
        let debugMessages = [];
        
        // 调试日志函数
        function debugLog(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logMessage = \`[\${timestamp}] \${message}\`;
            console.log(logMessage);
            
            debugMessages.push({ message: logMessage, type, time: Date.now() });
            if (debugMessages.length > 5) debugMessages.shift();
            
            updateDebugDisplay();
            
            // 发送给React Native
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'debug',
                    message: logMessage,
                    level: type
                }));
            }
        }
        
        function updateDebugDisplay() {
            const debugEl = document.getElementById('debugInfo');
            if (debugEl && debugMessages.length > 0) {
                const latest = debugMessages[debugMessages.length - 1];
                debugEl.innerHTML = \`
                    <div style="color: \${latest.type === 'error' ? '#ff6b6b' : latest.type === 'success' ? '#51cf66' : '#00ff00'}">
                        \${latest.message}
                    </div>
                \`;
            }
        }
        
        function updateLoadingText(text, type = 'info') {
            const loadingTextEl = document.getElementById('loadingText');
            if (loadingTextEl) {
                loadingTextEl.textContent = text;
                loadingTextEl.className = type;
            }
            debugLog(text, type);
        }

        // 初始化相机
        async function initializeCamera() {
            try {
                updateLoadingText('Requesting camera permissions...', 'info');
                
                // 检测浏览器支持
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Camera API not supported in this WebView');
                }
                
                const constraints = {
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280, min: 640 },
                        height: { ideal: 720, min: 480 }
                    }
                };

                debugLog('Requesting camera stream...');
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                
                video = document.getElementById('video');
                canvas = document.getElementById('canvas');
                ctx = canvas.getContext('2d');

                if (!video || !canvas || !ctx) {
                    throw new Error('Video or Canvas elements not found');
                }

                video.srcObject = stream;
                updateLoadingText('Camera stream acquired, setting up...', 'success');
                
                video.onloadedmetadata = () => {
                    debugLog('Video metadata loaded', 'success');
                    setupCanvas();
                    startAR();
                };

                video.onerror = (e) => {
                    debugLog(\`Video error: \${e.message || 'Unknown video error'}\`, 'error');
                    showFallback();
                };

                // 超时处理
                setTimeout(() => {
                    if (!isReady) {
                        debugLog('Camera setup timeout, showing fallback', 'warning');
                        showFallback();
                    }
                }, 10000);

            } catch (err) {
                debugLog(\`Camera init failed: \${err.message}\`, 'error');
                updateLoadingText(\`Camera error: \${err.message}\`, 'error');
                
                // 延迟显示备用方案
                setTimeout(() => {
                    showFallback();
                }, 3000);
            }
        }

        function setupCanvas() {
            try {
                const rect = canvas.getBoundingClientRect();
                canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
                canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
                
                // 缩放上下文以适应设备像素比
                ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
                
                debugLog(\`Canvas setup: \${canvas.width}x\${canvas.height}\`, 'success');
                
                // 触摸/点击事件
                canvas.addEventListener('touchstart', handleTouch, { passive: false });
                canvas.addEventListener('click', handleClick);
                
            } catch (err) {
                debugLog(\`Canvas setup error: \${err.message}\`, 'error');
            }
        }
        
        function handleTouch(e) {
            e.preventDefault();
            if (e.touches && e.touches[0]) {
                updatePetPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
        }
        
        function handleClick(e) {
            updatePetPosition(e.clientX, e.clientY);
        }
        
        function updatePetPosition(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            petX = (clientX - rect.left) / rect.width;
            petY = (clientY - rect.top) / rect.height;
            
            // 边界检查
            petX = Math.max(0.1, Math.min(0.9, petX));
            petY = Math.max(0.2, Math.min(0.9, petY));
            
            debugLog(\`Pet moved to (\${(petX*100).toFixed(1)}%, \${(petY*100).toFixed(1)}%)\`);
        }

        function startAR() {
            try {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('status').style.display = 'block';
                document.getElementById('instructions').style.display = 'block';
                
                isReady = true;
                debugLog('AR Pet ready! Tap to move pet around.', 'success');
                
                // 通知 React Native
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'arReady',
                        hasCamera: !!video.srcObject
                    }));
                }
                
                // 开始动画循环
                requestAnimationFrame(animate);
                
            } catch (err) {
                debugLog(\`AR start error: \${err.message}\`, 'error');
            }
        }

        function showFallback() {
            debugLog('Starting fallback mode (no camera)', 'warning');
            
            // 隐藏视频，显示渐变背景
            if (video) video.style.display = 'none';
            document.getElementById('container').style.background = 
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            
            updateLoadingText('Camera not available - Demo mode active', 'warning');
            
            setTimeout(() => {
                startAR();
            }, 2000);
        }

        function drawPet() {
            try {
                const now = Date.now();
                const deltaTime = (now - lastFrameTime) / 1000;
                lastFrameTime = now;
                
                animationTime += deltaTime;
                
                const centerX = window.innerWidth * petX;
                const centerY = window.innerHeight * petY;
                const baseScale = Math.min(window.innerWidth, window.innerHeight) * 0.15;
                
                // 状态相关动画
                let bounce = 0;
                let shake = 0;
                let scale = baseScale;
                let tailWagSpeed = 3;
                
                switch(currentState) {
                    case 'listening':
                        bounce = Math.sin(animationTime * 4) * 3;
                        shake = Math.sin(animationTime * 8) * 2;
                        scale *= 1.1;
                        tailWagSpeed = 6;
                        break;
                    case 'speaking':
                        bounce = Math.sin(animationTime * 6) * 8;
                        shake = Math.sin(animationTime * 10) * 4;
                        scale *= 1.2;
                        tailWagSpeed = 8;
                        break;
                    case 'thinking':
                        bounce = Math.sin(animationTime * 1.5) * 2;
                        scale *= 0.95;
                        tailWagSpeed = 1;
                        break;
                    default:
                        bounce = Math.sin(animationTime * 2) * 1;
                        scale += Math.sin(animationTime * 3) * 3;
                }
                
                const finalX = centerX + shake;
                const finalY = centerY + bounce;
                
                // 清除画布
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                
                // 绘制阴影
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(finalX, finalY + scale * 0.7, scale * 0.5, scale * 0.15, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制身体
                ctx.fillStyle = '#D2691E';
                ctx.beginPath();
                ctx.ellipse(finalX, finalY, scale * 0.35, scale * 0.2, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制头部
                ctx.beginPath();
                ctx.arc(finalX + scale * 0.25, finalY - scale * 0.1, scale * 0.15, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制眼睛
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(finalX + scale * 0.32, finalY - scale * 0.15, scale * 0.015, 0, 2 * Math.PI);
                ctx.arc(finalX + scale * 0.32, finalY - scale * 0.05, scale * 0.015, 0, 2 * Math.PI);
                ctx.fill();
                
                // 眼睛高光
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(finalX + scale * 0.325, finalY - scale * 0.145, scale * 0.006, 0, 2 * Math.PI);
                ctx.arc(finalX + scale * 0.325, finalY - scale * 0.045, scale * 0.006, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制鼻子
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(finalX + scale * 0.38, finalY - scale * 0.1, scale * 0.012, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制耳朵
                ctx.fillStyle = '#A0522D';
                ctx.beginPath();
                ctx.ellipse(finalX + scale * 0.18, finalY - scale * 0.25, scale * 0.05, scale * 0.08, -0.3, 0, 2 * Math.PI);
                ctx.ellipse(finalX + scale * 0.18, finalY - scale * 0.18, scale * 0.05, scale * 0.08, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                
                // 绘制腿
                ctx.fillStyle = '#D2691E';
                const legPositions = [
                    [finalX + scale * 0.1, finalY + scale * 0.15],
                    [finalX + scale * 0.1, finalY + scale * 0.05],
                    [finalX - scale * 0.05, finalY + scale * 0.15],
                    [finalX - scale * 0.05, finalY + scale * 0.05]
                ];
                
                legPositions.forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, scale * 0.02, 0, 2 * Math.PI);
                    ctx.fill();
                });
                
                // 绘制尾巴 (摆动)
                const tailAngle = Math.sin(animationTime * tailWagSpeed) * 30 + 45;
                const tailX = finalX - scale * 0.15 + Math.cos(tailAngle * Math.PI / 180) * scale * 0.12;
                const tailY = finalY - scale * 0.05 + Math.sin(tailAngle * Math.PI / 180) * scale * 0.12;
                
                ctx.strokeStyle = '#D2691E';
                ctx.lineWidth = scale * 0.025;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(finalX - scale * 0.15, finalY);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
                
            } catch (err) {
                debugLog(\`Draw error: \${err.message}\`, 'error');
            }
        }

        function animate() {
            if (!isReady) return;
            
            try {
                drawPet();
                requestAnimationFrame(animate);
            } catch (err) {
                debugLog(\`Animation error: \${err.message}\`, 'error');
                // 尝试重新开始动画
                setTimeout(() => requestAnimationFrame(animate), 1000);
            }
        }

        // 监听来自 React Native 的消息
        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'petStateChange') {
                    currentState = data.state;
                    currentEnergy = data.energy || 80;
                    currentMood = data.mood || 'neutral';
                    updateUI();
                    debugLog(\`State changed to: \${currentState}\`);
                }
            } catch (e) {
                // 忽略非JSON消息
            }
        });

        function updateUI() {
            const statusEl = document.getElementById('petStatusText');
            const statsEl = document.getElementById('petStatsText');
            
            if (statusEl) {
                const stateText = currentState.charAt(0).toUpperCase() + currentState.slice(1);
                statusEl.textContent = \`Pet Status: \${stateText}\`;
            }
            
            if (statsEl) {
                statsEl.textContent = \`Energy: \${currentEnergy}/100 | Mood: \${currentMood}\`;
            }
        }

        // 窗口大小改变处理
        window.addEventListener('resize', function() {
            if (canvas) {
                setupCanvas();
            }
        });

        // 错误处理
        window.addEventListener('error', function(e) {
            debugLog(\`Global error: \${e.message}\`, 'error');
        });

        // 初始化
        document.addEventListener('DOMContentLoaded', function() {
            debugLog('DOM loaded, starting camera initialization...');
            setTimeout(initializeCamera, 1000);
        });

        // 如果DOM已经加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                debugLog('DOM ready, initializing...');
                setTimeout(initializeCamera, 1000);
            });
        } else {
            debugLog('DOM already loaded, initializing immediately...');
            setTimeout(initializeCamera, 500);
        }
    </script>
</body>
</html>`;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'arReady') {
        setIsARReady(true);
        updateDebugInfo(`AR Ready! Camera: ${data.hasCamera ? 'Active' : 'Fallback'}`);
      } else if (data.type === 'debug') {
        updateDebugInfo(data.message);
      }
    } catch (e) {
      // 处理非JSON消息
      updateDebugInfo(`Raw message: ${event.nativeEvent.data.substring(0, 50)}...`);
    }
  };

  const handleWebViewError = (error: any) => {
    const errorMsg = `WebView Error: ${error.nativeEvent.description}`;
    updateDebugInfo(errorMsg);
    console.error('WebView error:', error);
    
    Alert.alert('AR Error', errorMsg, [
      { text: 'Retry', onPress: () => {
        if (webViewRef.current) {
          webViewRef.current.reload();
        }
      }},
      { text: 'Exit', onPress: onExit }
    ]);
  };

  useEffect(() => {
    updateDebugInfo('WebView AR component mounted');
  }, []);

  return (
    <View style={styles.container}>
      <WebView 
        ref={webViewRef}
        source={{ html: arHTML }}
        style={styles.webview}
        // 重要的WebView配置
        mediaPlaybackRequiresUserAction={false}
        domStorageEnabled={true}
        javaScriptEnabled={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        allowsProtectedMedia={true}
        mixedContentMode="compatibility"
        // 相机权限相关
        mediaCapturePermissionGrantType="grant"
        onPermissionRequest={(request) => {
          updateDebugInfo(`Permission requested: ${request.nativeEvent.resources.join(', ')}`);
          request.grant();
        }}
        onMessage={handleWebViewMessage}
        onError={handleWebViewError}
        onHttpError={(error) => {
          updateDebugInfo(`HTTP Error: ${error.nativeEvent.statusCode}`);
        }}
        onLoadStart={() => {
          updateDebugInfo('WebView loading started...');
        }}
        onLoadEnd={() => {
          updateDebugInfo('WebView loaded successfully');
        }}
        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress < 1) {
            updateDebugInfo(`Loading progress: ${Math.round(nativeEvent.progress * 100)}%`);
          }
        }}
        originWhitelist={['*']}
        cacheEnabled={false}
        incognito={false}
        userAgent={`Mozilla/5.0 (${Platform.OS === 'ios' ? 'iPhone; CPU iPhone OS 14_0 like Mac OS X' : 'Linux; Android 10'}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1`}
      />
      
      <View style={styles.controls}>
        <TouchableOpacity style={styles.exitButton} onPress={onExit}>
          <Text style={styles.exitText}>❌ Exit AR</Text>
        </TouchableOpacity>
      </View>
      
      {/* 调试信息面板 */}
      <View style={styles.debugPanel}>
        <Text style={styles.debugTitle}>🔧 AR Debug</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
        <Text style={styles.debugText}>AR Ready: {isARReady ? '✅' : '⏳'}</Text>
        <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
        <Text style={styles.debugText}>Pet: {
          isListening ? '👂 Listening' : 
          isSpeaking ? '🗣️ Speaking' : 
          isThinking ? '💭 Thinking' : 
          '😴 Idle'
        }</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  webview: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 2000,
  },
  exitButton: {
    backgroundColor: 'rgba(220, 53, 69, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 12,
    borderRadius: 10,
    zIndex: 1000,
  },
  debugTitle: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});