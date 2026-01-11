import { ref } from 'vue';
import ChatHeader from './ChatHeader.js';

export default {
    components: { ChatHeader },
    props: ['settings'], 
    emits: ['close', 'update:settings'],
    template: `
        <div class="app-window" style="height: 100%; display: flex; flex-direction: column; background: #f2f4f6;">
            <chat-header name="外观设置" :show-avatar="false" @back="$emit('close')"></chat-header>
            
            <div style="flex: 1; overflow-y: auto; padding: 20px;">
                
                <div class="section-card">
                    <div class="section-header">显示设置</div>
                    
                    <div class="switch-row">
                        <span>沉浸全屏模式</span>
                        <label class="toggle-switch">
                            <input type="checkbox" v-model="localSettings.isFullscreen">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="switch-row">
                        <span>显示状态栏</span>
                        <label class="toggle-switch">
                            <input type="checkbox" v-model="localSettings.showStatusBar">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    `,
    setup(props) {
        const localSettings = props.settings;
        return { localSettings };
    }
};
