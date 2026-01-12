import { ref } from 'vue';
import ChatList from './ChatList.js';
import ChatRoom from './ChatRoom.js'; 

export default {
    components: { ChatList, ChatRoom },
    emits: ['close'],
    template: `
        <div style="height: 100%;">
            
            <!-- 路由逻辑：有 ID 显示房间，无 ID 显示列表 -->
            <transition name="slide">
                
                <chat-room 
                    v-if="currentSessionId" 
                    :session-id="currentSessionId"
                    @back="currentSessionId = null"
                ></chat-room>

                <chat-list 
                    v-else 
                    @open-session="openSession"
                    @close="$emit('close')"
                ></chat-list>

            </transition>

        </div>
    `,
    setup() {
        const currentSessionId = ref(null);
        const openSession = (id) => { currentSessionId.value = id; };
        return { currentSessionId, openSession };
    }
};
