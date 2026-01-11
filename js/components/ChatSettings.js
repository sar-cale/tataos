import { ref, onMounted, computed } from 'vue';
import ChatHeader from './ChatHeader.js';
import WbTreeItem from './WbTreeItem.js';

export default {
    components: { ChatHeader, WbTreeItem },
    props: ['session'], 
    emits: ['close', 'update-session', 'clear-history'],
    template: `
        <div class="app-window" style="height: 100%; display: flex; flex-direction: column; background: #f2f4f6;" v-show="!isWbSelectorOpen">
            <chat-header name="详细设置" :show-avatar="false" @back="$emit('close')"></chat-header>
            
            <div style="flex: 1; overflow-y: auto; padding: 20px;">
                
                <!-- 1. 形象设置 (文案修正: Char / User) -->
                <div class="section-card">
                    <div class="section-header">角色形象</div>
                    <div style="display: flex; justify-content: space-around; padding: 10px 0;">
                        <div class="role-column">
                            <div class="avatar-wrapper" @click="triggerUpload('aiAvatar')">
                                <div class="role-avatar" :style="{ backgroundImage: 'url(' + (localSettings.avatar || defaultAiAvatar) + ')' }"></div>
                                <div class="edit-badge"><i class="ri-camera-fill"></i></div>
                            </div>
                            <span class="role-label">Char</span>
                            <input type="file" ref="aiAvatarInput" accept="image/*" style="display:none" @change="handleFile($event, 'aiAvatar')">
                        </div>
                        <div class="vs-divider"></div>
                        <div class="role-column">
                            <div class="avatar-wrapper" @click="triggerUpload('userAvatar')">
                                <div class="role-avatar" :style="{ backgroundImage: 'url(' + (localSettings.settings.userAvatar || defaultUserAvatar) + ')' }"></div>
                                <div class="edit-badge"><i class="ri-camera-fill"></i></div>
                            </div>
                            <span class="role-label">User</span>
                            <input type="file" ref="userAvatarInput" accept="image/*" style="display:none" @change="handleFile($event, 'userAvatar')">
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-top: 15px;">
                        <div class="form-group" style="flex:1">
                            <label class="mini-label">Char 昵称</label>
                            <input type="text" v-model="localSettings.name" class="glass-input-sm">
                        </div>
                        <div class="form-group" style="flex:1">
                            <label class="mini-label">User 昵称</label>
                            <input type="text" v-model="localSettings.settings.userName" class="glass-input-sm">
                        </div>
                    </div>
                </div>

                <!-- 2. 世界书挂载 -->
                <div class="wb-entry-card" @click="isWbSelectorOpen = true">
                    <div style="display: flex; align-items: center;">
                        <div class="wb-entry-icon"><i class="ri-book-read-line"></i></div>
                        <div>
                            <div style="font-weight: 600; font-size: 15px;">世界书挂载</div>
                            <div style="font-size: 12px; color: #888; margin-top: 2px;">
                                已选择 {{ activeIds.length }} 项规则
                            </div>
                        </div>
                    </div>
                    <i class="ri-arrow-right-s-line" style="color: #ccc; font-size: 24px;"></i>
                </div>

                <!-- 3. 场景设置 -->
                <div class="section-card">
                    <div class="section-header">聊天背景</div>
                    <div class="bg-uploader" @click="triggerUpload('bg')" :style="{ backgroundImage: localSettings.settings.background ? 'url(' + localSettings.settings.background + ')' : 'none' }">
                        <div class="bg-placeholder" v-if="!localSettings.settings.background">
                            <i class="ri-image-add-line"></i>
                            <span>点击上传背景图</span>
                        </div>
                        <i v-else class="ri-edit-circle-fill bg-edit-icon"></i>
                    </div>
                    <input type="file" ref="bgInput" accept="image/*" style="display:none" @change="handleFile($event, 'bg')">
                </div>

                <!-- 4. 剧本设定 -->
                <div class="section-card">
                    <div class="section-header">剧本设定</div>
                    <div class="form-group">
                        <label class="mini-label">Char 人设</label>
                        <textarea v-model="localSettings.settings.systemPrompt" class="glass-textarea" placeholder="例如：你是一个严厉的数学老师..."></textarea>
                    </div>
                    <div class="form-group" style="margin-top: 15px;">
                        <label class="mini-label">User 人设</label>
                        <textarea v-model="localSettings.settings.userPersona" class="glass-textarea" placeholder="例如：我是一个经常考零分的学生..."></textarea>
                    </div>
                </div>

                <!-- 5. 自定义 CSS (修复预览) -->
                <div class="section-card">
                    <div class="section-header">自定义 CSS</div>
                    
                    <!-- 预览盒子 -->
                    <div class="css-preview-box" :style="{ backgroundImage: localSettings.settings.background ? 'url(' + localSettings.settings.background + ')' : 'none' }">
                        <div v-html="previewStyleTag"></div>
                        <div class="msg-row ai"><div class="msg-avatar"></div><div class="bubble">Char 预览</div></div>
                        <div class="msg-row me"><div class="bubble">User 预览</div><div class="msg-avatar"></div></div>
                    </div>

                    <textarea 
                        v-model="localSettings.settings.customCss" 
                        class="glass-textarea code-font" 
                        style="height: 120px; font-family: monospace; font-size: 12px; margin-top: 10px;"
                        placeholder="/* 输入 CSS 实时预览 */"
                    ></textarea>
                </div>

                <div style="height: 20px;"></div>
                <button class="save-btn-lg" @click="handleSave">保存所有修改</button>
                
                <!-- 清除记录 (修复样式) -->
                <div style="margin-top: 20px; text-align: center;">
                    <button class="danger-btn" @click="$emit('clear-history')">
                        <i class="ri-delete-bin-line"></i> 清空聊天记录
                    </button>
                </div>
                
                <div style="height: 40px;"></div>
            </div>
        </div>

        <!-- 二级页面 (世界书选择器) -->
        <div class="wb-selector-page" v-if="isWbSelectorOpen">
            <chat-header name="选择世界书" :show-avatar="false" @back="isWbSelectorOpen = false">
                <template #right>
                    <span style="color: #007aff; font-weight: 600; font-size: 14px; cursor: pointer;" @click="isWbSelectorOpen = false">完成</span>
                </template>
            </chat-header>
            <div style="padding: 15px 20px 0 20px;">
                <div class="search-bar">
                    <i class="ri-search-line" style="color:#999;"></i>
                    <input type="text" v-model="searchQuery" placeholder="搜索规则或文件夹..." class="search-input">
                </div>
            </div>
            <div style="flex: 1; overflow-y: auto; padding: 20px;">
                <div v-if="filteredTree.length === 0" style="text-align:center; color:#999; font-size:12px; margin-top: 50px;">
                    没有找到匹配的内容 (空文件夹已隐藏)
                </div>
                <div class="wb-tree">
                    <wb-tree-item 
                        v-for="node in filteredTree" 
                        :key="node.id"
                        :node="node"
                        :selected-ids="activeIds"
                        @toggle-book="toggleBook"
                        @toggle-folder="toggleFolder"
                    ></wb-tree-item>
                </div>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        // ... (保持 setup 逻辑不变，直接复用上一版的)
        const localSettings = ref(JSON.parse(JSON.stringify(props.session)));
        if (!localSettings.value.settings) localSettings.value.settings = {};
        if (!localSettings.value.settings.activeWorldbooks) localSettings.value.settings.activeWorldbooks = [];
        if (!localSettings.value.settings.customCss) localSettings.value.settings.customCss = '';

        const defaultAiAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${localSettings.value.name}`;
        const defaultUserAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=User`;
        
        const aiAvatarInput = ref(null);
        const userAvatarInput = ref(null);
        const bgInput = ref(null);
        const isWbSelectorOpen = ref(false);
        const searchQuery = ref('');
        const fullTree = ref([]);
        const activeIds = ref(localSettings.value.settings.activeWorldbooks);

        const previewStyleTag = computed(() => {
            if (!localSettings.value.settings.customCss) return '';
            return `<style>${localSettings.value.settings.customCss}</style>`;
        });

        onMounted(() => {
            const allItems = JSON.parse(localStorage.getItem('ai_phone_worldbooks_v2') || '[]');
            const folderMap = {};
            allItems.filter(i => i.type === 'folder').forEach(f => folderMap[f.id] = { ...f, children: [] });
            const unclassified = { id: 'unclassified', type: 'folder', title: '未分类', children: [] };
            allItems.filter(i => i.type === 'book').forEach(book => {
                if (book.parentId && folderMap[book.parentId]) folderMap[book.parentId].children.push(book);
                else unclassified.children.push(book);
            });
            let result = [];
            Object.values(folderMap).forEach(f => result.push(f));
            if (unclassified.children.length > 0) result.push(unclassified);
            fullTree.value = result.filter(n => n.children.length > 0);
        });

        const filteredTree = computed(() => {
            if (!searchQuery.value.trim()) return fullTree.value;
            const query = searchQuery.value.toLowerCase();
            return fullTree.value.map(folder => {
                if (folder.title.toLowerCase().includes(query)) return folder;
                const matchingChildren = folder.children.filter(book => book.title.toLowerCase().includes(query));
                if (matchingChildren.length > 0) return { ...folder, children: matchingChildren, isOpen: true };
                return null;
            }).filter(Boolean);
        });

        const toggleBook = (id) => {
            const idx = activeIds.value.indexOf(id);
            if (idx > -1) activeIds.value.splice(idx, 1);
            else activeIds.value.push(id);
        };

        const toggleFolder = (folder) => {
            const getAllBookIds = (n) => {
                if (n.type === 'book') return [n.id];
                return n.children.flatMap(getAllBookIds);
            };
            const childIds = getAllBookIds(folder);
            const allSelected = childIds.every(id => activeIds.value.includes(id));
            if (allSelected) activeIds.value = activeIds.value.filter(id => !childIds.includes(id));
            else childIds.forEach(id => { if (!activeIds.value.includes(id)) activeIds.value.push(id); });
        };

        const triggerUpload = (type) => {
            if (type === 'aiAvatar') aiAvatarInput.value.click();
            else if (type === 'userAvatar') userAvatarInput.value.click();
            else bgInput.value.click();
        };

        const handleFile = (event, type) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                if (type === 'aiAvatar') localSettings.value.avatar = e.target.result;
                else if (type === 'userAvatar') localSettings.value.settings.userAvatar = e.target.result;
                else localSettings.value.settings.background = e.target.result;
            };
            reader.readAsDataURL(file);
        };

        const handleSave = () => {
            localSettings.value.settings.aiName = localSettings.value.name;
            localSettings.value.settings.activeWorldbooks = activeIds.value;
            emit('update-session', localSettings.value);
            emit('close');
        };

        return { 
            localSettings, defaultAiAvatar, defaultUserAvatar, handleSave, 
            triggerUpload, handleFile, aiAvatarInput, userAvatarInput, bgInput,
            activeIds, toggleBook, toggleFolder, isWbSelectorOpen, searchQuery, filteredTree, previewStyleTag
        };
    }
};
