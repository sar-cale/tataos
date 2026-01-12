import { ref, onMounted, nextTick, reactive, watch, computed } from 'vue';
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

        <div v-else class="app-window chat-room-container" :style="containerStyle" @click="closePopups">
            
            <div class="chat-abs-header">
                <chat-header 
                    :name="sessionData.name" 
                    :status="statusText" 
                    @back="$emit('back')"
                    @edit-status="openStatusModal"
                >
                    <template #right>
                        <i class="ri-eye-line" style="font-size: 24px; cursor: pointer; color: #333; margin-right: 15px;" @click.stop="toggleOs"></i>
                        <i class="ri-settings-3-line" style="font-size: 24px; cursor: pointer; color: #333;" @click.stop="isSettingOpen = true"></i>
                    </template>
                </chat-header>
            </div>

            <div class="chat-abs-list" ref="scrollRef">
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
            
            <div class="chat-abs-footer">
                <input-bar 
                    ref="inputBarRef"
                    @send="handleSendOnly" 
                    @generate="handleGenerate"
                    @regenerate="handleRegenerate"
                    :disabled="isGenerating"
                ></input-bar>
            </div>

            <!-- 弹窗区域 -->
            <div v-if="showStatusModal" class="center-modal-overlay" @click="showStatusModal = false" style="z-index: 500;">
                <div class="center-modal-box" @click.stop>
                    <h3 style="text-align: center; font-size: 16px;">修改状态</h3>
                    <input v-model="tempStatusValue" class="glass-input" style="text-align: center;" @keyup.enter="saveStatus">
                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button class="api-delete-btn" style="margin:0; flex:1; padding:12px;" @click="showStatusModal = false">取消</button>
                        <button class="api-save-btn" style="margin:0; flex:1; padding:12px;" @click="saveStatus">确定</button>
                    </div>
                </div>
            </div>

            <div v-if="showEditModal" class="center-modal-overlay" @click="showEditModal = false" style="z-index: 500;">
                <div class="center-modal-box" style="width: 90%; max-width: 400px;" @click.stop>
                    <h3 style="text-align: center; font-size: 16px;">编辑消息</h3>
                    <textarea v-model="tempEditContent" class="glass-textarea" style="height: 150px;"></textarea>
                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button class="api-delete-btn" style="margin:0; flex:1; padding:12px;" @click="showEditModal = false">取消</button>
                        <button class="api-save-btn" style="margin:0; flex:1; padding:12px;" @click="saveEditMessage">保存</button>
                    </div>
                </div>
            </div>

            <div class="os-modal" v-if="showOs" @click.stop>
                <div class="os-header">
                    <span><i class="ri-brain-line"></i> 心声记录</span>
                    <i class="ri-close-line" @click="showOs = false" style="cursor:pointer"></i>
                </div>
                <div class="os-content" ref="osScrollRef">
                    <div v-for="(msg, idx) in osHistory" :key="idx" style="margin-bottom: 15px; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 10px;">
                        <div style="font-size: 10px; color: #999; margin-bottom: 4px;">{{ msg.role === 'user' ? '我' : sessionData.name }}</div>
                        <div v-if="msg.os" style="color: #333; font-weight: 500; white-space: pre-wrap;">{{ msg.os }}</div>
                        <div v-else style="color: #ccc; font-style: italic;">(无心声)</div>
                    </div>
                    <div v-if="osHistory.length === 0" class="os-placeholder">暂无心声记录</div>
                </div>
            </div>

            <div class="context-menu-overlay" v-if="contextMenu.visible" @click="closePopups">
                <div class="context-menu" :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }" @click.stop>
                    <div class="menu-item" @click="menuAction('copy')"><i class="ri-file-copy-line"></i> 复制</div>
                    <div class="menu-item" @click="menuAction('quote')"><i class="ri-chat-quote-line"></i> 引用</div>
                    <div class="menu-item" @click="menuAction('edit')"><i class="ri-edit-line"></i> 编辑</div>
                    <div class="menu-item" v-if="contextMenu.role === 'user'" @click="menuAction('recall')"><i class="ri-arrow-go-back-line"></i> 撤回</div>
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
        const containerStyle = ref({ background: '#f2f4f6', backgroundSize: 'cover', backgroundPosition: 'center' });
        
        const showOs = ref(false);
        const contextMenu = reactive({ visible: false, x: 0, y: 0, index: -1, role: '' });
        const isMultiSelect = ref(false);
        const selectedIndices = ref([]);
        const inputBarRef = ref(null);
        const showStatusModal = ref(false);
        const tempStatusValue = ref('');
        const showEditModal = ref(false);
        const tempEditContent = ref('');
        const editIndex = ref(-1);
        
        const scrollRef = ref(null);
        const osScrollRef = ref(null);

        const osHistory = computed(() => {
            return sessionData.value.messages.filter(m => m.role === 'assistant' || m.os);
        });

        const scrollToBottom = async () => {
            await nextTick();
            if (scrollRef.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
            if (osScrollRef.value) osScrollRef.value.scrollTop = osScrollRef.value.scrollHeight;
        };

        watch(() => sessionData.value.messages, scrollToBottom, { deep: true });

        const loadData = async () => {
            const allSessions = JSON.parse(localStorage.getItem('ai_phone_sessions') || '[]');
            const found = allSessions.find(s => s.id === props.sessionId);
            if (found) {
                if (!found.settings) found.settings = {};
                if (!found.messages) found.messages = [];
                sessionData.value = found;
                if (found.settings.background) containerStyle.value.backgroundImage = `url(${found.settings.background})`;
                statusText.value = found.status || '在线'; 
                await scrollToBottom();
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
        const toggleOs = () => { showOs.value = !showOs.value; setTimeout(scrollToBottom, 100); };
        const closePopups = () => { contextMenu.visible = false; };
        
        const openStatusModal = () => { tempStatusValue.value = statusText.value; showStatusModal.value = true; };
        const saveStatus = () => { statusText.value = tempStatusValue.value; saveToLocal(); showStatusModal.value = false; };

        const openContextMenu = ({ x, y, index }) => {
            const menuWidth = 140; const menuHeight = 200;
            if (x + menuWidth > window.innerWidth) x -= menuWidth;
            if (y + menuHeight > window.innerHeight) y -= menuHeight;
            contextMenu.x = x; contextMenu.y = y; contextMenu.index = index; 
            contextMenu.role = sessionData.value.messages[index].role;
            contextMenu.visible = true;
        };

        const menuAction = (action) => {
            const idx = contextMenu.index;
            const msg = sessionData.value.messages[idx];
            contextMenu.visible = false;
            
            if (action === 'copy') {
                navigator.clipboard.writeText(msg.content);
            } else if (action === 'delete') {
                sessionData.value.messages.splice(idx, 1);
                saveToLocal();
            } else if (action === 'quote') {
                if (inputBarRef.value) {
                    inputBarRef.value.setQuote({
                        name: msg.role === 'user' ? '我' : sessionData.value.name,
                        content: msg.content
                    });
                }
            } else if (action === 'recall') {
                if (inputBarRef.value) inputBarRef.value.text = msg.content;
                sessionData.value.messages.splice(idx, 1);
                saveToLocal();
            } else if (action === 'edit') {
                tempEditContent.value = msg.content;
                editIndex.value = idx;
                showEditModal.value = true;
            } else if (action === 'multi') {
                isMultiSelect.value = true;
                selectedIndices.value = [idx];
            }
        };

        const saveEditMessage = () => {
            if (editIndex.value > -1 && tempEditContent.value.trim()) {
                sessionData.value.messages[editIndex.value].content = tempEditContent.value;
                saveToLocal();
            }
            showEditModal.value = false;
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
                prompt += "【世界观与法则】\n";
                activeBooks.forEach(wb => { prompt += `- ${wb.title}: ${wb.content}\n`; });
                prompt += "\n";
            }
            if (sessionData.value.settings.systemPrompt) prompt += `【你的角色设定】\n${sessionData.value.settings.systemPrompt}\n\n`;
            if (sessionData.value.settings.userPersona) prompt += `【用户(User)设定】\n${sessionData.value.settings.userPersona}\n\n`;
            if (sessionData.value.settings.longTermMemory) prompt += `【长期记忆 (过往经历与事实)】\n${sessionData.value.settings.longTermMemory}\n\n`;
            if (sessionData.value.settings.shortTermMemory) prompt += `【短期记忆 (最近发生的事)】\n${sessionData.value.settings.shortTermMemory}\n\n`;
            prompt += "\n【重要指令】\n请在回复内容的最前面，用【】中括号包裹你的心理活动或潜台词。例如：【他看起来很生气，我得小心点】好的，我明白了。";
            return prompt;
        };

        // 核心修改：接收 payload 对象 { text, quote }
        const handleSendOnly = (payload) => {
            // 兼容旧代码：如果 payload 是字符串，转为对象
            const content = (typeof payload === 'string') ? payload : payload.text;
            const quote = (typeof payload === 'object') ? payload.quote : null;

            if (!content) return;
            
            sessionData.value.messages.push({ 
                role: 'user', 
                content: content,
                quote: quote // 存入引用
            });
            sessionData.value.lastMessage = content;
            sessionData.value.lastTime = Date.now();
            saveToLocal();
        };

        const runBackgroundSummary = async (apiKey, baseUrl) => {
            const threshold = sessionData.value.settings.summaryThreshold;
            if (!threshold || threshold <= 0) return;
            const msgs = sessionData.value.messages;
            if (msgs.length > 0 && msgs.length % threshold === 0) {
                try {
                    const recentContext = msgs.slice(-50).map(m => `${m.role}: ${m.content}`).join('\n');
                    const prompt = sessionData.value.settings.summaryPrompt || '请简要总结上述对话。';
                    const response = await fetch(`${baseUrl}/chat/completions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({
                            model: 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: 'You are a helpful assistant.' },
                                { role: 'user', content: `${prompt}\n\n【对话内容】\n${recentContext}` }
                            ],
                            stream: false
                        })
                    });
                    if (response.ok) {
                        const data = await response.json();
                        sessionData.value.settings.shortTermMemory = data.choices[0].message.content;
                        saveToLocal();
                        console.log("自动总结完成");
                    }
                } catch (e) {
                    console.error("自动总结失败", e);
                }
            }
        };

        const handleRegenerate = async () => {
            if (isGenerating.value) return;
            const msgs = sessionData.value.messages;
            if (msgs.length === 0) return;
            let lastUserIndex = -1;
            for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === 'user') { lastUserIndex = i; break; } }
            if (lastUserIndex === -1) { await handleGenerate(null); } 
            else { if (lastUserIndex < msgs.length - 1) msgs.splice(lastUserIndex + 1); saveToLocal(); await handleGenerate(null); }
        };

        // 核心修改：接收 payload 对象
        const handleGenerate = async (payload) => {
            if (isGenerating.value) return;
            
            // 如果有 payload，先发送用户消息
            if (payload) handleSendOnly(payload);

            const profiles = JSON.parse(localStorage.getItem('ai_phone_profiles') || '[]');
            const activeId = localStorage.getItem('ai_phone_active_id');
            const config = profiles.find(p => p.id == activeId);

            if (!config || !config.apiKey) { alert("未配置 API Key。"); return; }

            isGenerating.value = true;
            const originalStatus = statusText.value;
            statusText.value = '对方正在输入...';
            
            const msgIndex = sessionData.value.messages.push({ role: 'assistant', content: '', os: '' }) - 1;
            scrollToBottom(); 

            try {
                // 构建历史记录时，将引用内容拼接到 content 前面，让 AI 看到
                // 但不修改原始 messages 数据，只在发送给 API 时拼接
                const history = sessionData.value.messages.slice(-20, -1).map(m => {
                    let content = m.content;
                    if (m.quote) {
                        content = `「回复 ${m.quote.name}: ${m.quote.content}」\n${content}`;
                    }
                    return { role: m.role, content: content };
                });

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
                                    sessionData.value.messages[msgIndex].os = match[1];
                                    sessionData.value.messages[msgIndex].content = fullText.replace(/【.*?】/s, '').trimStart();
                                } else {
                                    if (fullText.includes('【')) {
                                         sessionData.value.messages[msgIndex].content = fullText.split('【')[0];
                                         sessionData.value.messages[msgIndex].os = fullText.split('【')[1] || '...';
                                    } else {
                                        sessionData.value.messages[msgIndex].content = fullText;
                                    }
                                }
                                if(scrollRef.value && scrollRef.value.scrollHeight - scrollRef.value.scrollTop < 600) {
                                    scrollToBottom();
                                }
                            } catch (e) {}
                        }
                    }
                }
                const finalMatch = fullText.match(/【(.*?)】/s);
                if (finalMatch) {
                    sessionData.value.messages[msgIndex].os = finalMatch[1];
                    sessionData.value.messages[msgIndex].content = fullText.replace(/【.*?】/s, '').trim();
                } else {
                    sessionData.value.messages[msgIndex].content = fullText;
                }
                sessionData.value.lastMessage = sessionData.value.messages[msgIndex].content;
                saveToLocal();
                scrollToBottom();
                runBackgroundSummary(config.apiKey, baseUrl);
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
            handleStatusUpdate, handleClearHistory, showOs, toggleOs,
            contextMenu, openContextMenu, closePopups, menuAction,
            isMultiSelect, selectedIndices, toggleSelect, deleteSelected, inputBarRef,
            showStatusModal, tempStatusValue, openStatusModal, saveStatus,
            showEditModal, tempEditContent, saveEditMessage,
            scrollRef, osScrollRef, osHistory 
        };
    }
};
