import { ref } from 'vue';

export default {
    emits: ['open-app'],
    template: `
        <div class="desktop">
            <!-- 1. 顶部：智能问候组件 -->
            <div class="widget-area">
                <div class="glass-panel date-widget" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="font-size: 12px; opacity: 0.6; margin-bottom: 4px;">{{ date }} {{ weekday }}</p>
                        <h2 style="font-size: 24px;">{{ greeting }}</h2>
                    </div>
                    <div style="text-align: right;">
                        <i class="ri-sun-cloudy-line" style="font-size: 32px; color: #333;"></i>
                        <p style="font-size: 12px;">24°C</p>
                    </div>
                </div>
            </div>

            <!-- 2. 中间：App 图标网格 -->
            <div class="app-grid">
                <div class="app-item" @click="$emit('open-app', 'chat')">
                    <div class="app-icon" style="background: #333; color: #fff;">
                        <i class="ri-message-3-line"></i>
                    </div>
                    <span>聊天</span>
                </div>

                <div class="app-item" @click="$emit('open-app', 'worldbook')">
                    <div class="app-icon" style="background: #e0e0e0; color: #333;">
                        <i class="ri-book-read-line"></i>
                    </div>
                    <span>世界书</span>
                </div>

                <div class="app-item" @click="$emit('open-app', 'api')">
                    <div class="app-icon" style="background: #e0e0e0; color: #333;">
                        <i class="ri-key-2-line"></i>
                    </div>
                    <span>接口</span>
                </div>

                <!-- 修改这里：从 外观(theme) 改为 设置(settings) -->
                <div class="app-item" @click="$emit('open-app', 'settings')">
                    <div class="app-icon" style="background: #e0e0e0; color: #333;">
                        <i class="ri-settings-4-line"></i>
                    </div>
                    <span>设置</span>
                </div>
            </div>

            <!-- 3. 底部：图文卡片 -->
            <div class="glass-panel quote-widget" @click="switchCard">
                <div class="widget-cover" :style="{ backgroundImage: 'url(' + currentCard.img + ')' }"></div>
                <div class="widget-content">
                    <div class="widget-tag"># {{ currentCard.tag }}</div>
                    <div class="widget-text">{{ currentCard.text }}</div>
                </div>
                <div class="widget-action">
                    <i class="ri-arrow-right-s-line"></i>
                </div>
            </div>
            
            <!-- 4. 底部 Dock 栏 -->
            <div class="dock glass-panel">
                 <div class="dock-icon"><i class="ri-phone-fill"></i></div>
                 <div class="dock-icon"><i class="ri-mail-fill"></i></div>
                 <div class="dock-icon"><i class="ri-global-line"></i></div>
                 <div class="dock-icon"><i class="ri-music-fill"></i></div>
            </div>
        </div>
    `,
    setup() {
        const now = new Date();
        const date = `${now.getMonth() + 1}月${now.getDate()}日`;
        const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
        const hour = now.getHours();
        let greeting = '你好';
        if (hour < 6) greeting = '夜深了';
        else if (hour < 11) greeting = '早上好';
        else if (hour < 13) greeting = '中午好';
        else if (hour < 18) greeting = '下午好';
        else greeting = '晚上好';

        const cardData = [
            {
                tag: 'Daily',
                text: '保持热爱，奔赴山海。',
                img: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200&h=200&fit=crop'
            },
            {
                tag: 'Status',
                text: '系统运行正常，等待指令。',
                img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=200&h=200&fit=crop'
            },
            {
                tag: 'Memo',
                text: '记得喝水，休息一下眼睛。',
                img: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=200&h=200&fit=crop'
            }
        ];

        const currentIndex = ref(0);
        const currentCard = ref(cardData[0]);

        const switchCard = () => {
            currentIndex.value = (currentIndex.value + 1) % cardData.length;
            currentCard.value = cardData[currentIndex.value];
        };

        return { date, weekday, greeting, currentCard, switchCard };
    }
};
