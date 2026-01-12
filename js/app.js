import { createApp, ref, reactive, watch, computed } from 'vue';
import StatusBar from './components/StatusBar.js';
import Desktop from './components/Desktop.js';
import ChatApp from './components/ChatApp.js';
import SettingsApp from './components/SettingsApp.js'; // 改名
import ApiApp from './components/ApiApp.js';
import WorldbookApp from './components/WorldbookApp.js';

const PlaceholderApp = {
    props: ['title'],
    emits: ['close'],
    template: `
        <div style="height:100%; background:#fff; padding:20px; display:flex; flex-direction:column;">
            <div @click="$emit('close')" style="margin-bottom:20px; cursor:pointer; font-size:24px;">
                <i class="ri-arrow-left-line"></i> 返回
            </div>
            <h1>{{ title }}</h1>
            <p style="color:#888; margin-top:10px;">功能开发中...</p>
        </div>
    `
};

const App = {
    components: { StatusBar, Desktop, ChatApp, SettingsApp, ApiApp, WorldbookApp, PlaceholderApp },
    template: `
        <!-- 动态注入全局 CSS -->
        <div v-html="globalStyleTag"></div>

        <div class="phone-case" :class="{ 'fullscreen': globalSettings.isFullscreen }">
            <div class="phone-screen">
                <status-bar 
                    class="status-bar" 
                    :class="{ 'hidden': !globalSettings.showStatusBar }"
                ></status-bar>
                
                <!-- 路由 -->
                <transition name="fade" mode="out-in">
                    <desktop v-if="currentApp === null" @open-app="openApp"></desktop>
                    
                    <chat-app v-else-if="currentApp === 'chat'" @close="goHome"></chat-app>
                    <!-- 修改路由判断 -->
                    <settings-app v-else-if="currentApp === 'settings'" :settings="globalSettings" @close="goHome"></settings-app>
                    
                    <api-app v-else-if="currentApp === 'api'" @close="goHome"></api-app>
                    <worldbook-app v-else-if="currentApp === 'worldbook'" @close="goHome"></worldbook-app>
                    <placeholder-app v-else :title="currentApp" @close="goHome"></placeholder-app>
                </transition>
            </div>
        </div>
    `,
    setup() {
        const currentApp = ref(null);
        
        const savedSettings = JSON.parse(localStorage.getItem('ai_phone_global_settings') || '{}');

        const globalSettings = reactive({
            isFullscreen: savedSettings.isFullscreen || false,
            showStatusBar: savedSettings.showStatusBar !== false, 
            enableCustomCss: savedSettings.enableCustomCss || false,
            globalCss: savedSettings.globalCss || ''
        });

        watch(globalSettings, (newVal) => {
            localStorage.setItem('ai_phone_global_settings', JSON.stringify(newVal));
        }, { deep: true });

        const globalStyleTag = computed(() => {
            if (globalSettings.enableCustomCss && globalSettings.globalCss) {
                return `<style>${globalSettings.globalCss}</style>`;
            }
            return '';
        });

        const openApp = (appName) => { currentApp.value = appName; };
        const goHome = () => { currentApp.value = null; };

        return { currentApp, openApp, goHome, globalSettings, globalStyleTag };
    }
};

createApp(App).mount('#app');
