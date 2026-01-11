import { ref, onMounted, nextTick, reactive } from 'vue';
import ChatHeader from './ChatHeader.js';
import MessageList from './MessageList.js';
import InputBar from './InputBar.js';
import ChatSettings from './ChatSettings.js';

export default {
    components: { ChatHeader, MessageList, InputBar, ChatSettings },
    props: ['sessionId'],
    emits: ['back'],
    template: `
        <chat-settings 
            v-if="isSettingOpen" 
            :session="sessionData"
            @close="isSettingOpen = false"
            @update-session="updateSessionData"
            @clear-history="handleClearHistory"
        ></chat-settings>

        <!-- 布局容器：使用 class 控制布局，style 只控制动态背景 -->
        <div v-else class="app-window chat-room-container" :style="containerStyle" @click="closePopups">
            
            <!-- 1. 顶部栏 (Class定位) -->
            <div class="chat-abs-header">
                <chat-header 
                    :name="sessionData.name" 
                    :status="statusText" 
                    @back="$emit('back')"
                    @update-status="handleStatusUpdate"
                >
                    <template #right>
                        <i class="ri-eye-line" style="font-size: 24px; cursor: pointer; color: #333; margin-right: 15px;" @click.stop="toggleOs"></i>
                        <i class="ri-settings-3-line" style="font-size: 24px; cursor: pointer; color: #333;" @click.stop="isSettingOpen = true"></i>
                    </template>
                </chat-header>
            </div>

            <!-- 2. OS 弹窗 (保持原有类名定位) -->
            <div class="os-modal" v-if="showOs" @click.stop>
                <div class="os-header">
                    <span><i class="ri-brain-line"></i> 实时心声</span>
                    <i class="ri-close-line" @click="showOs = false" style="cursor:pointer"></i>
                </div>
                <div class="os-content">
                    <div v-if="currentOs" style="white-space: pre-wrap;">{{ currentOs }}</div>
                    <div v-else-if="isGenerating" style="text-align:center; padding-top:20px;">
                        <span class="thinking-dot"></span> 思考中...
                    </div>
                    <div v-else class="os-placeholder">等待对方回复...</div>
                </div>
            </div>

            <!-- 3. 消息列表 (Class定位) -->
            <div class="chat-abs-list">
                <message-list 
                    :messages="sessionData.messages" 
                    :user-avatar="sessionData.settings.userAvatar"
                    :ai-avatar="sessionData.avatar"
                    :is-multi-select="isMultiSelect"
                    :selected-indices="selectedIndices"
                    @show-context="openContextMenu"
                    @toggle-select="toggleSelect"
                ></message-list>
            </div>
            
            <!-- 4. 底部输入框 (Class定位) -->
            <div class="chat-abs-footer">
                <input-bar 
                    ref="inputBarRef"
                    @send="handleSendOnly" 
                    @generate="handleGenerate"
                    @regenerate="handleRegenerate"
                    :disabled="isGenerating"
                ></input-bar>
            </div>

            <!-- 弹窗遮罩 -->
            <div class="context-menu-overlay" v-if="contextMenu.visible" @click="closePopups">
                <div class="context-menu" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" @click.stop>
                    <div class="menu-item" @click="menuAction('copy')"><i class="ri-file-copy-line"></i> 复制</div>
                    <div class="menu-item" @click="menuAction('quote')"><i class="ri-chat-quote-line"></i> 引用</div>
                    <div class="menu-item" @click="menuAction('edit')"><i class="ri-edit-line"></i> 编辑</div>
                    <div class="menu-item" @click="menuAction('multi')"><i class="ri-checkbox-multiple-line"></i> 多选</div>
                    <div class="menu-item danger" @click="menuAction('delete')"><i class="ri-delete-bin-line"></i> 删除</div>
                </div>
            </div>
            
            <div class="wb-batch-bar" v-if="isMultiSelect">
                <div class="wb-batch-btn delete" @click="deleteSelected"><i class="ri-delete-bin-line"></i> 删除 ({{ selectedIndices.length }})</div>
                <div class="wb-batch-btn" @click="isMultiSelect = false"><i class="ri-close-line"></i> 取消</div>
            </div>

        </div>
    `,
    setup(props) {
        const sessionData = ref({ name: '加载中...', avatar: '', messages: [], settings: { userAvatar: '' } });
        const isSettingOpen = ref(false);
        const statusText = ref('在线');
        const isGenerating = ref(false);
        
        // 样式：只保留动态背景图，布局属性已移至 CSS
        const containerStyle = ref({ 
            background: '#f2f4f6', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
        });
        
        const showOs = ref(false);
        const currentOs = ref('');
        const contextMenu = reactive({ visible: false, x: 0, y: 0, index: -1 });
        const isMultiSelect = ref(false);
        const selectedIndices = ref([]);
        const inputBarRef = ref(null);

        const loadData = () => {
            const allSessions = JSON.parse(localStorage.getItem('ai_phone_sessions') || '[]');
            const found = allSessions.find(s => s.id === props.sessionId);
            if (found) {
                if (!found.settings) found.settings = {};
                if (!found.messages) found.messages = [];
                sessionData.value = found;
                if (found.settings.background) containerStyle.value.backgroundImage = `url(${found.settings.background})`;
                statusText.value = found.status || '在线'; 
            }
        };
        onMounted(loadData);

        const saveToLocal = () => {
            const allSessions = JSON.parse(localStorage.getItem('ai_phone_sessions') || '[]');
            const idx = allSessions.findIndex(s => s.id === props.sessionId);
            if (idx !== -1) {
                sessionData.value.status = statusText.value;
                allSessions[idx] = sessionData.value;
                localStorage.setItem('ai_phone_sessions', JSON.stringify(allSessions));
            }
        };

        const updateSessionData = (newData) => {
            sessionData.value = newData;
            containerStyle.value.backgroundImage = newData.settings.background ? `url(${newData.settings.background})` : 'none';
            saveToLocal();
        };

        const handleStatusUpdate = (newStatus) => { statusText.value = newStatus; saveToLocal(); };
        const handleClearHistory = () => { sessionData.value.messages = []; sessionData.value.lastMessage = ''; saveToLocal(); isSettingOpen.value = false; };
        const toggleOs = () => { showOs.value = !showOs.value; };
        const closePopups = () => { contextMenu.visible = false; };
        
        const openContextMenu = ({ x, y, index }) => {
            const menuWidth = 140; const menuHeight = 200;
            if (x + menuWidth > window.innerWidth) x -= menuWidth;
            if (y + menuHeight > window.innerHeight) y -= menuHeight;
            contextMenu.x = x; contextMenu.y = y; contextMenu.index = index; contextMenu.visible = true;
        };

        const menuAction = (action) => {
            const idx = contextMenu.index;
            const msg = sessionData.value.messages[idx];
            contextMenu.visible = false;
            if (action === 'copy') navigator.clipboard.writeText(msg.content);
            else if (action === 'delete') { sessionData.value.messages.splice(idx, 1); saveToLocal(); }
            else if (action === 'quote') { if (inputBarRef.value) inputBarRef.value.text = `> ${msg.content}\n`; }
            else if (action === 'edit') { const newText = prompt("编辑消息:", msg.content); if (newText !== null) { sessionData.value.messages[idx].content = newText; saveToLocal(); } }
            else if (action === 'multi') { isMultiSelect.value = true; selectedIndices.value = [idx]; }
        };

        const toggleSelect = (index) => {
            const i = selectedIndices.value.indexOf(index);
            if (i > -1) selectedIndices.value.splice(i, 1); else selectedIndices.value.push(index);
        };

        const deleteSelected = () => {
            if (!confirm(`删除选中的 ${selectedIndices.value.length} 条消息?`)) return;
            const sortedIndices = [...selectedIndices.value].sort((a, b) => b - a);
            sortedIndices.forEach(idx => sessionData.value.messages.splice(idx, 1));
            selectedIndices.value = []; isMultiSelect.value = false; saveToLocal();
        };

        const buildSystemPrompt = () => {
            let prompt = "";
            const allWorldbooks = JSON.parse(localStorage.getItem('ai_phone_worldbooks_v2') || '[]');
            const activeWbIds = sessionData.value.settings.activeWorldbooks || [];
            const activeBooks = allWorldbooks.filter(wb => wb.type === 'book' && activeWbIds.includes(wb.id));
            if (activeBooks.length > 0) {
                prompt += "【世界观】\n";
                activeBooks.forEach(wb => { prompt += `- ${wb.title}: ${wb.content}\n`; });
            }
            if (sessionData.value.settings.systemPrompt) prompt += `【你的设定】\n${sessionData.value.settings.systemPrompt}\n\n`;
            if (sessionData.value.settings.userPersona) prompt += `【用户设定】\n${sessionData.value.settings.userPersona}\n\n`;
            prompt += "\n【重要指令】\n请在回复内容的最前面，用【】中括号包裹你的心理活动或潜台词。例如：【他看起来很生气，我得小心点】好的，我明白了。";
            return prompt;
        };

        const handleSendOnly = (text) => {
            if (!text) return;
            sessionData.value.messages.push({ role: 'user', content: text });
            sessionData.value.lastMessage = text;
            sessionData.value.lastTime = Date.now();
            saveToLocal();
        };

        // --- 核心修复：回溯重开逻辑 ---
        const handleRegenerate = async () => {
            if (isGenerating.value) return;
            const msgs = sessionData.value.messages;
            if (msgs.length === 0) return;

            // 1. 倒序查找最后一条 User 消息
            let lastUserIndex = -1;
            for (let i = msgs.length - 1; i >= 0; i--) {
                if (msgs[i].role === 'user') {
                    lastUserIndex = i;
                    break;
                }
            }

            if (lastUserIndex === -1) {
                await handleGenerate(null);
            } else {
                // 2. 斩断未来
                if (lastUserIndex < msgs.length - 1) {
                    msgs.splice(lastUserIndex + 1); 
                }
                saveToLocal();
                // 3. 重新推演
                await handleGenerate(null); 
            }
        };

        const handleGenerate = async (text) => {
            if (isGenerating.value) return;
            if (text) handleSendOnly(text);

            const profiles = JSON.parse(localStorage.getItem('ai_phone_profiles') || '[]');
            const activeId = localStorage.getItem('ai_phone_active_id');
            const config = profiles.find(p => p.id == activeId);

            if (!config || !config.apiKey) { alert("未配置 API Key。"); return; }

            isGenerating.value = true;
            currentOs.value = '';
            const originalStatus = statusText.value;
            statusText.value = '对方正在输入...';
            
            const msgIndex = sessionData.value.messages.push({ role: 'assistant', content: '' }) - 1;

            try {
                const history = sessionData.value.messages.slice(-20, -1).map(m => ({ role: m.role, content: m.content }));
                const messagesPayload = [{ role: 'system', content: buildSystemPrompt() }, ...history];
                let baseUrl = config.baseUrl.replace(/\/$/, '');
                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
                    body: JSON.stringify({
                        model: config.model || 'gpt-3.5-turbo',
                        messages: messagesPayload,
                        temperature: config.temperature || 0.7,
                        stream: true
                    })
                });
                if (!response.ok) throw new Error(`API Error: ${response.status}`);
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let fullText = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const jsonStr = line.slice(6);
                            if (jsonStr.trim() === '[DONE]') break;
                            try {
                                const json = JSON.parse(jsonStr);
                                const content = json.choices[0].delta.content || '';
                                fullText += content;
                                const match = fullText.match(/【(.*?)】/s);
                                if (match) {
                                    currentOs.value = match[1];
                                    sessionData.value.messages[msgIndex].content = fullText.replace(/【.*?】/s, '').trimStart();
                                } else {
                                    if (fullText.includes('【')) {
                                         sessionData.value.messages[msgIndex].content = fullText.split('【')[0];
                                         currentOs.value = fullText.split('【')[1] || '...';
                                    } else {
                                        sessionData.value.messages[msgIndex].content = fullText;
                                    }
                                }
                            } catch (e) {}
                        }
                    }
                }
                const finalMatch = fullText.match(/【(.*?)】/s);
                if (finalMatch) {
                    currentOs.value = finalMatch[1];
                    sessionData.value.messages[msgIndex].content = fullText.replace(/【.*?】/s, '').trim();
                } else {
                    sessionData.value.messages[msgIndex].content = fullText;
                }
                sessionData.value.lastMessage = sessionData.value.messages[msgIndex].content;
                saveToLocal();
            } catch (e) {
                sessionData.value.messages[msgIndex].content = `[连接失败] ${e.message}`;
            } finally {
                isGenerating.value = false;
                statusText.value = originalStatus;
            }
        };

        return { 
            sessionData, isSettingOpen, statusText, isGenerating, 
            handleSendOnly, handleGenerate, handleRegenerate, updateSessionData, containerStyle, 
            handleStatusUpdate, handleClearHistory, showOs, currentOs, toggleOs,
            contextMenu, openContextMenu, closePopups, menuAction,
            isMultiSelect, selectedIndices, toggleSelect, deleteSelected, inputBarRef
        };
    }
};
