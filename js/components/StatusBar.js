import { ref, onMounted, onUnmounted } from 'vue';

export default {
    template: `
        <div class="status-bar">
            <div class="time">{{ currentTime }}</div>
            <div class="icons">
                <i class="ri-wifi-line"></i>
                <i class="ri-battery-fill" style="margin-left:5px;"></i>
            </div>
        </div>
    `,
    setup() {
        const currentTime = ref('');
        let timer;

        const updateTime = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            currentTime.value = `${hours}:${minutes}`;
        };

        onMounted(() => {
            updateTime();
            timer = setInterval(updateTime, 1000);
        });

        onUnmounted(() => clearInterval(timer));

        return { currentTime };
    }
};
