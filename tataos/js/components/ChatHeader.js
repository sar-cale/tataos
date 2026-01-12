import { ref } from 'vue';

export default {
    props: {
        name: String,
        status: String, 
        showAvatar: { type: Boolean, default: false }
    },
    emits: ['back', 'edit-status'], // 只负责发信号
    template: `
        <div class="chat-header glass-panel" style="border-radius: 0 0 24px 24px; border-top: none; margin-bottom: 0;">
            <div @click="$emit('back')" style="margin-right: 15px; cursor: pointer;">
                <i class="ri-arrow-left-s-line" style="font-size: 28px; color: #333;"></i>
            </div>
            
            <div class="chat-info">
                <h3 style="font-size: 18px; font-weight: 600;">{{ name }}</h3>
                <!-- 点击触发 edit-status -->
                <div v-if="status !== undefined" 
                     @click="$emit('edit-status')" 
                     style="font-size: 10px; opacity: 0.6; cursor: pointer; margin-top: 2px;">
                    {{ status || '在线' }}
                </div>
            </div>
            
            <div style="margin-left: auto; display: flex; align-items: center; gap: 15px;">
                <slot name="right"></slot>
            </div>
        </div>
    `
};
