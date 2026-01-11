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
                @click="handleClick(index)"
                @contextmenu.prevent
            >
                <!-- 多选勾选框 -->
                <div v-if="isMultiSelect" class="checkbox-overlay">
                    <i :class="selectedIndices.includes(index) ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'"></i>
                </div>

                <!-- AI 头像 -->
                <div v-if="msg.role !== 'user'" class="msg-avatar ai-avatar" :style="{ backgroundImage: 'url(' + (aiAvatar || defaultAi) + ')' }"></div>

                <!-- 气泡 -->
                <div class="bubble">
                    {{ msg.content }}
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
            if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
        };

        watch(() => props.messages, scrollToBottom, { deep: true });
        onMounted(scrollToBottom);

        // 长按逻辑
        const startPress = (e, index) => {
            if (props.isMultiSelect) return; // 多选模式下禁用长按
            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                // 获取点击坐标
                const touch = e.touches ? e.touches[0] : e;
                emit('show-context', { x: touch.clientX, y: touch.clientY, index });
            }, 500); // 500ms 算长按
        };

        const endPress = () => {
            clearTimeout(pressTimer);
        };

        const handleClick = (index) => {
            if (props.isMultiSelect) {
                emit('toggle-select', index);
            }
        };

        return { listRef, defaultAi, defaultUser, startPress, endPress, handleClick };
    }
};
