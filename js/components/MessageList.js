import { nextTick, watch, ref, onMounted } from 'vue';

export default {
    props: ['messages', 'userAvatar', 'aiAvatar', 'isMultiSelect', 'selectedIndices'], 
    emits: ['show-context', 'toggle-select'],
    template: `
        <div class="message-list" ref="listRef">
            <div 
                v-for="(msg, index) in messages" 
                :key="index" 
                class="msg-row" 
                :class="[
                    msg.role === 'user' ? 'me' : 'ai',
                    { 'selecting': isMultiSelect && !selectedIndices.includes(index) },
                    { 'selected': isMultiSelect && selectedIndices.includes(index) }
                ]"
                @touchstart="startPress($event, index)"
                @touchend="endPress"
                @mousedown="startPress($event, index)"
                @mouseup="endPress"
                @mouseleave="endPress"
                @click="handleClick(index)"
                @contextmenu.prevent="handleRightClick($event, index)"
            >
                <!-- 多选框 -->
                <div v-if="isMultiSelect" class="checkbox-overlay">
                    <i :class="selectedIndices.includes(index) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"></i>
                </div>

                <!-- AI 头像 -->
                <div v-if="msg.role !== 'user'" class="msg-avatar ai-avatar" :style="{ backgroundImage: 'url(' + (aiAvatar || defaultAi) + ')' }"></div>

                <!-- 核心修改：垂直容器 (msg-col) -->
                <!-- 用来把 [气泡] 和 [引用] 竖着放 -->
                <div class="msg-col">
                    
                    <!-- 1. 主气泡 -->
                    <div class="bubble">
                        {{ msg.content }}
                    </div>

                    <!-- 2. 引用气泡 (完全独立在下面) -->
                    <div v-if="msg.quote" class="quote-bubble">
                        {{ msg.quote.name }}: {{ msg.quote.content }}
                    </div>

                </div>

                <!-- User 头像 -->
                <div v-if="msg.role === 'user'" class="msg-avatar user-avatar" :style="{ backgroundImage: 'url(' + (userAvatar || defaultUser) + ')' }"></div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const listRef = ref(null);
        const defaultAi = 'https://api.dicebear.com/7.x/avataaars/svg?seed=AI';
        const defaultUser = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
        let pressTimer = null;
        let isLongPress = false;

        const scrollToBottom = async () => {
            await nextTick();
            if (listRef.value) {
                listRef.value.scrollTop = listRef.value.scrollHeight;
            }
        };

        watch(() => props.messages, scrollToBottom, { deep: true });
        
        onMounted(scrollToBottom);

        const handleRightClick = (e, index) => {
            if (props.isMultiSelect) return;
            emit('show-context', { x: e.clientX, y: e.clientY, index });
        };

        const startPress = (e, index) => {
            if (props.isMultiSelect) return;
            if (e.button === 2) return; 
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                emit('show-context', { x: clientX, y: clientY, index });
            }, 500); 
        };

        const endPress = () => { clearTimeout(pressTimer); };

        const handleClick = (index) => {
            if (isLongPress) { isLongPress = false; return; }
            if (props.isMultiSelect) { emit('toggle-select', index); }
        };

        return { listRef, defaultAi, defaultUser, startPress, endPress, handleClick, handleRightClick };
    }
};
