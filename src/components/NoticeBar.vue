<template>
  <div class="notice-bar" v-if="notices.length">
    <el-icon><BellFilled /></el-icon>
    <div class="notice-content">
      <el-carousel height="30px" direction="vertical" :autoplay="true" interval="3000">
        <el-carousel-item v-for="(item, index) in notices" :key="index">
          <div class="notice-item" @click="showDetail(item)">{{ item.title }}</div>
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
import { agentNotice } from '@/api/agent.js'

const notices = ref([])
const dialogVisible = ref(false)
const currentNotice = ref(null)

function showDetail(item) {
  currentNotice.value = item
  dialogVisible.value = true
}

async function loadNotices() {
  try {
    const res = await agentNotice()
    console.log('公告接口响应', res)

    if (!res.ok) {
      console.warn('加载公告失败:', res.message)
      return
    }

    const d = res.data

    // 如果返回的是字符串，构造单条公告
    if (typeof d === 'string') {
      notices.value = [{ title: '系统公告', content: d }]
    }
    // 如果返回的是数组
    else if (Array.isArray(d)) {
      notices.value = d.map(it => ({
        title: it.title ?? it.noticeTitle ?? it.name ?? '公告',
        content: it.content ?? it.noticeContent ?? it.desc ?? ''
      }))
    }
    // 如果是对象
    else if (d && typeof d === 'object') {
      const list = d.records || d.list || d.rows || []
      notices.value = list.map(it => ({
        title: it.title ?? it.noticeTitle ?? it.name ?? '公告',
        content: it.content ?? it.noticeContent ?? it.desc ?? ''
      }))
    } else {
      console.warn('公告格式无法识别:', d)
    }
  } catch (e) {
    console.warn('公告接口异常', e)
  }
}

onMounted(loadNotices)
</script>

<style scoped>
.notice-bar { display: flex; align-items: center; background-color: #fffbe6; border: 1px solid #ffecb3; border-radius: 6px; padding: 6px 12px; font-size: 14px; color: #333; }
.notice-content { flex: 1; margin-left: 8px; overflow: hidden; }
.notice-item { cursor: pointer; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.notice-item:hover { color: #e6a23c; }
</style>
