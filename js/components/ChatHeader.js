import { ref, watch, nextTick } from 'vue';

export default {
    props: {
        name: String,
        status: String,
        showAvatar: { type: Boolean, default: false }
    },
    emits: ['back', 'update-status'],
    template: `
        <div class="chat-header glass-panel" style="border-radius: 0 0 24px 24px; border-top: none; margin-bottom: 0;">
            <div @click="$emit('back')" style="margin-right: 15px; cursor: pointer;">
                <i class="ri-arrow-left-s-line" style="font-size: 28px; color: #333;"></i>
            </div>
            
            <div class="chat-info">
                <h3 style="font-size: 18px; font-weight: 600;">{{ name }}</h3>
                
                <!-- 修复点：只有当 localStatus 有值时才显示，且去掉默认值 -->
                <div v-if="!isEditingStatus && localStatus" 
                     @click="startEditStatus" 
                     style="font-size: 10px; opacity: 0.6; cursor: text; margin-top: 2px;">
                    {{ localStatus }}
                </div>
                
                <!-- 编辑输入框 -->
                <input 
                    v-else-if="isEditingStatus"
                    ref="statusInput"
                    v-model="localStatus" 
                    @blur="finishEditStatus"
                    @keyup.enter="finishEditStatus"
                    style="font-size: 10px; border:none; background:transparent; outline:none; color:#666; padding:0; margin-top:2px; min-width: 50px;"
                >
            </div>
            
            <div style="margin-left: auto; display: flex; align-items: center; gap: 15px;">
                <slot name="right"></slot>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const isEditingStatus = ref(false);
        const localStatus = ref(props.status);
        const statusInput = ref(null);

        watch(() => props.status, (val) => { localStatus.value = val; });

        const startEditStatus = () => {
            isEditingStatus.value = true;
            nextTick(() => { if(statusInput.value) statusInput.value.focus(); });
        };

        const finishEditStatus = () => {
            isEditingStatus.value = false;
            // 如果清空了，就传空字符串
            emit('update-status', localStatus.value);
        };

        return { isEditingStatus, localStatus, startEditStatus, finishEditStatus, statusInput };
    }
};
