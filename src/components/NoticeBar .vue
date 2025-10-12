<template>
  <div class="notice-bar" v-if="notices.length">
    <el-icon><BellFilled /></el-icon>
    <div class="notice-content">
      <el-carousel height="30px" direction="vertical" :autoplay="true" interval="3000">
        <el-carousel-item v-for="(item, index) in notices" :key="index">
          <div class="notice-item" @click="showDetail(item)">
            {{ item.title }}
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <el-dialog v-model="dialogVisible" title="公告详情" width="40%">
      <div v-html="currentNotice?.content"></div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BellFilled } from '@element-plus/icons-vue'

const notices = ref([])
const dialogVisible = ref(false)
const currentNotice = ref(null)

// 模拟接口加载公告
async function loadNotices() {
  // TODO: 实际应改为 axios 调接口
  notices.value = [
    { title: '系统维护通知：今晚0点到2点维护', content: '系统将在今晚0点到2点进行维护，请提前保存数据。' },
    { title: '新功能上线：统计分析模块', content: '新增统计分析模块，欢迎体验！' },
  ]
}

function showDetail(item) {
  currentNotice.value = item
  dialogVisible.value = true
}

onMounted(loadNotices)
</script>

<style scoped>
.notice-bar {
  display: flex;
  align-items: center;
  background-color: #fffbe6;
  border: 1px solid #ffecb3;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  color: #333;
}
.notice-content {
  flex: 1;
  margin-left: 8px;
  overflow: hidden;
}
.notice-item {
  cursor: pointer;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.notice-item:hover {
  color: #e6a23c;
}
</style>
