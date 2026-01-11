import { ref } from 'vue';

export default {
    emits: ['send', 'generate', 'regenerate'], // 增加 regenerate
    props: ['disabled'],
    template: `
        <div class="input-area">
            <!-- 加号菜单 -->
            <div class="plus-menu" v-if="showMenu">
                <!-- 新增：重新生成按钮 -->
                <div class="plus-item" @click="triggerRegen">
                    <div class="plus-icon"><i class="ri-refresh-line"></i></div>
                    <span class="plus-label">重试</span>
                </div>
                
                <div class="plus-item"><div class="plus-icon"><i class="ri-image-line"></i></div><span class="plus-label">图片</span></div>
                <div class="plus-item"><div class="plus-icon"><i class="ri-camera-line"></i></div><span class="plus-label">拍照</span></div>
                <div class="plus-item"><div class="plus-icon"><i class="ri-file-line"></i></div><span class="plus-label">文件</span></div>
            </div>

            <!-- 加号按钮 -->
            <i class="ri-add-circle-line" 
               :class="{ 'active': showMenu }"
               @click="showMenu = !showMenu"
            ></i>
            
            <input 
                type="text" 
                class="input-box" 
                placeholder="聊点什么..." 
                v-model="text"
                @focus="showMenu = false"
                @keyup.enter="handleGenerate" 
                :disabled="disabled"
            >
            
            <div class="btn-group">
                <!-- 生成 (黑色闪电) -->
                <button class="send-btn" @click="handleGenerate" :disabled="disabled">
                    <i class="ri-flashlight-fill"></i>
                </button>

                <!-- 仅发送 (蓝色箭头) -->
                <button class="send-btn" @click="handleSendOnly" :disabled="!text.trim()">
                    <i class="ri-arrow-up-line"></i>
                </button>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const text = ref('');
        const showMenu = ref(false);

        const handleSendOnly = () => {
            if (!text.value.trim()) return;
            emit('send', text.value.trim());
            text.value = '';
            showMenu.value = false;
        };

        const handleGenerate = () => {
            emit('generate', text.value.trim());
            text.value = '';
            showMenu.value = false;
        };

        const triggerRegen = () => {
            emit('regenerate');
            showMenu.value = false;
        };

        return { text, showMenu, handleSendOnly, handleGenerate, triggerRegen };
    }
};
