import { ref, onMounted } from 'vue';
import ChatHeader from './ChatHeader.js';

export default {
    components: { ChatHeader },
    emits: ['open-session', 'close'],
    template: `
        <div class="app-window" style="height: 100%; display: flex; flex-direction: column; background: #f2f4f6;">
            <chat-header name="消息列表" :show-avatar="false" @back="$emit('close')">
                <template #right>
                    <i class="ri-add-circle-line" style="font-size: 26px; cursor: pointer; color: #007aff;" @click="createNewSession"></i>
                </template>
            </chat-header>

            <div style="flex: 1; overflow-y: auto;">
                <div class="chat-list-container">
                    
                    <div 
                        v-for="session in sessions" 
                        :key="session.id" 
                        class="chat-session-card"
                        @click="$emit('open-session', session.id)"
                    >
                        <div class="chat-avatar" :style="{ backgroundImage: 'url(' + (session.avatar || defaultAvatar(session.name)) + ')' }"></div>
                        
                        <div class="chat-info">
                            <div class="chat-name-row">
                                <span class="chat-name">{{ session.name }}</span>
                                <span class="chat-time">{{ formatTime(session.lastTime) }}</span>
                            </div>
                            <div class="chat-msg-preview">{{ session.lastMessage || '点击开始聊天...' }}</div>
                        </div>

                        <div class="chat-del-btn" @click.stop="deleteSession(session.id)">
                            <i class="ri-close-circle-fill" style="font-size: 20px;"></i>
                        </div>
                    </div>

                    <div v-if="sessions.length === 0" style="text-align: center; color: #999; margin-top: 50px; font-size: 14px;">
                        <i class="ri-chat-smile-2-line" style="font-size: 40px; margin-bottom: 10px; display:block;"></i>
                        暂无会话，点击右上角新建
                    </div>

                </div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const sessions = ref([]);

        onMounted(() => {
            const data = localStorage.getItem('ai_phone_sessions');
            if (data) sessions.value = JSON.parse(data);
        });

        const saveSessions = () => {
            localStorage.setItem('ai_phone_sessions', JSON.stringify(sessions.value));
        };

        // --- 修复：先起名逻辑 ---
        const createNewSession = () => {
            const name = prompt("请输入聊天对象/会话名称：");
            if (!name || !name.trim()) return; // 没名字不让建

            const newSession = {
                id: Date.now(),
                name: name.trim(),
                avatar: '', // 默认为空，自动生成
                lastMessage: '',
                lastTime: Date.now(),
                messages: [],
                // 核心：单会话配置
                settings: {
                    aiName: name.trim(), // 默认AI名字等于会话名
                    userName: '我',
                    systemPrompt: '', // 私有设定
                    background: ''    // 聊天背景
                }
            };
            sessions.value.unshift(newSession);
            saveSessions();
            // 建完直接进入
            emit('open-session', newSession.id);
        };

        const deleteSession = (id) => {
            if (!confirm('确定删除该会话吗？聊天记录将无法恢复。')) return;
            const idx = sessions.value.findIndex(s => s.id === id);
            if (idx !== -1) {
                sessions.value.splice(idx, 1);
                saveSessions();
            }
        };

        const defaultAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

        const formatTime = (ts) => {
            if (!ts) return '';
            const date = new Date(ts);
            const now = new Date();
            if (date.toDateString() === now.toDateString()) {
                return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
            }
            return `${date.getMonth() + 1}/${date.getDate()}`;
        };

        return { sessions, createNewSession, deleteSession, defaultAvatar, formatTime };
    }
};
