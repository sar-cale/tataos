import { ref } from 'vue';

export default {
    emits: ['send', 'generate', 'regenerate'],
    props: ['disabled'],
    template: `
        <div style="width: 100%; display: flex; flex-direction: column;">
            
            <!-- 引用条 (输入框上方) -->
            <div class="quote-banner" v-if="currentQuote">
                <div class="quote-content">
                    回复 {{ currentQuote.name }}: {{ currentQuote.content }}
                </div>
                <div class="quote-close" @click="currentQuote = null">
                    <i class="ri-close-circle-fill"></i>
                </div>
            </div>

            <div class="input-area">
                <div class="plus-menu" v-if="showMenu">
                    <div class="plus-item" @click="triggerRegen">
                        <div class="plus-icon"><i class="ri-refresh-line"></i></div>
                        <span class="plus-label">重试</span>
                    </div>
                    <div class="plus-item"><div class="plus-icon"><i class="ri-image-line"></i></div><span class="plus-label">图片</span></div>
                    <div class="plus-item"><div class="plus-icon"><i class="ri-camera-line"></i></div><span class="plus-label">拍照</span></div>
                    <div class="plus-item"><div class="plus-icon"><i class="ri-file-line"></i></div><span class="plus-label">文件</span></div>
                </div>

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
                    @keyup.enter="handleSendOnly" 
                    :disabled="disabled"
                >
                
                <div class="btn-group">
                    <button class="send-btn" @click="handleGenerate" :disabled="disabled">
                        <i class="ri-flashlight-fill"></i>
                    </button>
                    <button class="send-btn" @click="handleSendOnly" :disabled="!text.trim()">
                        <i class="ri-arrow-up-line"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const text = ref('');
        const showMenu = ref(false);
        const currentQuote = ref(null);

        const setQuote = (quoteData) => {
            currentQuote.value = quoteData;
        };

        const handleSendOnly = () => {
            if (!text.value.trim()) return;
            // 核心修改：将 text 和 quote 分开传
            emit('send', { text: text.value.trim(), quote: currentQuote.value });
            text.value = '';
            currentQuote.value = null; // 发送后清空
            showMenu.value = false;
        };

        const handleGenerate = () => {
            // 生成时也带上引用，虽然通常只在 User 消息显示，但保持数据一致
            emit('generate', { text: text.value.trim(), quote: currentQuote.value });
            text.value = '';
            currentQuote.value = null;
            showMenu.value = false;
        };

        const triggerRegen = () => {
            emit('regenerate');
            showMenu.value = false;
        };

        return { text, showMenu, handleSendOnly, handleGenerate, triggerRegen, currentQuote, setQuote };
    }
};
