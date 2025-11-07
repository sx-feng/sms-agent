<template>
  <div class="template-page">
    <!-- 顶部标题与操作 -->
    <div class="header">
           <el-button type="info" size="small" @click="goBack">⬅ 返回</el-button>
      <h2>💰 我的价格模板</h2>
      <div class="actions">
        <el-input
          v-model="searchKey"
          placeholder="搜索模板名称"
          clearable
          size="small"
          style="width: 200px"
        />
          <el-button type="primary" size="small" @click="handleSearch">🔍 查询</el-button>
        <el-button type="primary" size="small" @click="openDialog()">➕ 新建模板</el-button>
      </div>
    </div>

    <!-- 模板表格 -->
    <el-table :data="filteredTemplates" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="name" label="模板名称" min-width="200" />
      <el-table-column label="项目数量" width="120" align="center">
        <template #default="{ row }">{{ row.items?.length || 0 }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteTemplate(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建 / 编辑弹窗 -->
    <el-dialog
      :title="form.id ? '编辑模板' : '新建模板'"
      v-model="dialogVisible"
      width="850px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="模板名称">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="项目配置">
          <div class="price-list">
            <div class="price-header">
              <span style="width: 90px;">项目ID</span>
              <span style="width: 140px;">项目名称</span>
              <span style="width: 80px;">线路ID</span>
              <span style="width: 80px;">最高价</span>
              <span style="width: 80px;">最低价</span>
              <!-- <span style="width: 100px;">成本价</span> -->
              <span style="width: 120px;">售价</span>
              <span style="width: 60px;">操作</span>
            </div>

            <div class="price-row" v-for="(item, index) in form.items" :key="index">
              <el-input
                v-model.number="item.projectId"
                placeholder="项目ID"
                style="width: 90px;"
                type="number"
                disabled
              />
              <el-input
                v-model="item.projectName"
                placeholder="项目名称"
                style="width: 140px;"
                disabled
              />
              <el-input
                v-model.number="item.lineId"
                placeholder="线路ID"
                style="width: 80px;"
                type="number"
                disabled
              />
              <!-- 最高价 -->
               <el-input
                v-model.number="item.priceMax"
                placeholder="最高价"
                style="width: 80px;"
                type="number"
                disabled
              />
              <el-input
                v-model.number="item.priceMin"
                placeholder="最低价"
                style="width: 80px;"
                type="number"
                disabled
              />
              <!-- <el-input
                v-model.number="item.costPrice"
                disabled
                style="width: 100px;"
                placeholder="成本价"
              /> -->
              <el-input-number
                v-model.number="item.price"
                :min="0"
                :step="0.01"
                style="width: 120px;"
              />
              <el-button link type="danger" @click="removeItem(index)">删除</el-button>
            </div>

            <el-button link type="primary" @click="addItem">+ 添加项目</el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate" :loading="saving">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAgentPriceTemplates,
  addAgentPriceTemplate,
  updateAgentPriceTemplate,
  deleteAgentPriceTemplate,
  getProjectList
} from '@/api/agent'
import { getAgentProjectPrice } from '@/api/agent.projectPrice'

// 状态
import { useRouter } from 'vue-router'
const router = useRouter()

function goBack() {
  router.back() 
}


const templates = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const searchKey = ref('')

// 表单
const form = ref({
  id: null,
  name: '',
  items: []
})

// ✅ 搜索过滤
const filteredTemplates = computed(() => {
  if (!searchKey.value) return templates.value
  return templates.value.filter(t =>
    t.name.toLowerCase().includes(searchKey.value.toLowerCase())
  )
})
// 搜索模板
async function handleSearch() {
  loading.value = true
  try {
    const res = await getAgentPriceTemplates({
      name: searchKey.value.trim()
    })
    if (res.code === 200) {
      templates.value = res.data || []
      ElMessage.success('查询成功')
    } else {
      ElMessage.error(res.message || '查询失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

// ✅ 加载模板数据
async function loadTemplates() {
  loading.value = true
  try {
    const res = await getAgentPriceTemplates()
    console.log(res,"")
    if (res.code === 200) {
      templates.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载失败')
    }
  } catch {
    ElMessage.error('网络错误')
  } finally {
    loading.value = false
  }
}

async function openDialog(row = null) {
  loading.value = true;
  dialogVisible.value = true;

  try {
    // 步骤 1: 并发获取所有项目列表和代理的专属价格配置，提高效率
    const [projectRes, agentPriceRes] = await Promise.all([
      getProjectList({ pageSize: -1 }),
      getAgentProjectPrice()
    ]);

    // 校验项目列表接口
    if (projectRes.code !== 200) {
      ElMessage.error(projectRes.message || '加载项目列表失败');
      dialogVisible.value = false;
      return;
    }
    // 校验代理价格接口（非致命错误，可以继续）
    if (agentPriceRes.code !== 200) {
      ElMessage.warning(agentPriceRes.message || '获取代理项目价格失败，将使用默认最低价');
    }

    const latestProjects = projectRes.data.records || [];
    const agentPrices = agentPriceRes.data || [];

    // 步骤 2: 创建一个代理价格的映射表，方便快速查找
    // Map 的 key 是 'projectId_lineId', value 是 agentPrice
    const agentPriceMap = new Map(
      agentPrices.map(item => [`${item.projectId}_${item.lineId}`, item.agentPrice])
    );

    // 步骤 3: 根据是“编辑”还是“新建”来构建表单数据
    if (row) {
      // ✅ 编辑模式
      form.value = {
        id: row.id,
        name: row.name,
        items: []
      };

      // 创建一个已保存在模板中的售价映射表
      const savedPriceMap = new Map(
        row.items.map(item => [`${item.projectId}_${item.lineId}`, item.price])
      );

      form.value.items = latestProjects.map(p => {
        const key = `${p.projectId}_${p.lineId}`;
        const agentPrice = agentPriceMap.get(key); // 从代理价格Map中查找
        const savedPrice = savedPriceMap.get(key); // 从已存模板Map中查找

        return {
          projectId: p.projectId,
          projectName: p.projectName,
          lineId: p.lineId,
          priceMax: p.priceMax,
          // 核心逻辑: 如果代理有专属价格(agentPrice)，就用它；否则，用项目默认的最低价(p.priceMin)
          priceMin: agentPrice !== undefined ? agentPrice : p.priceMin,
          // 售价逻辑: 如果模板里存了价格，就用它；否则，使用默认价
          price: savedPrice !== undefined ? savedPrice : (p.priceMax ?? p.priceMin),
        };
      });

    } else {
      // ✅ 新建模式
      form.value = { id: null, name: '', items: [] };

      form.value.items = latestProjects.map(p => {
        const key = `${p.projectId}_${p.lineId}`;
        const agentPrice = agentPriceMap.get(key); // 从代理价格Map中查找

        return {
          projectId: p.projectId,
          projectName: p.projectName,
          lineId: p.lineId,
          priceMax: p.priceMax,
          // 核心逻辑: 如果代理有专属价格(agentPrice)，就用它；否则，用项目默认的最低价(p.priceMin)
          priceMin: agentPrice !== undefined ? agentPrice : p.priceMin,
          // 售价逻辑: 新建时默认使用最高价
          price: p.priceMax ?? (agentPrice !== undefined ? agentPrice : p.priceMin),
        };
      });
    }
  } catch (e) {
    console.error("加载模板数据时发生异常:", e);
    ElMessage.error('网络异常，无法加载项目价格');
    dialogVisible.value = false;
  } finally {
    loading.value = false;
  }
}



// ✅ 添加项目
function addItem() {
  form.value.items.push({
    projectId: '',
    projectName: '',
    lineId: '',
    price: 0,
    costPrice: 0
  })
}

// ✅ 删除项目
function removeItem(index) {
  form.value.items.splice(index, 1)
}

// ✅ 保存模板
async function saveTemplate() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }

  saving.value = true
  try {
    let res
    if (form.value.id) {
      res = await updateAgentPriceTemplate(form.value.id, form.value)
    } else {
      res = await addAgentPriceTemplate(form.value)
    }

    if (res.code === 200) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
         setTimeout(() => {
        loadTemplates()
      }, 200)
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

// ✅ 删除模板
async function deleteTemplate(row) {
  ElMessageBox.confirm(`确定删除模板「${row.name}」吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    const res = await deleteAgentPriceTemplate(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadTemplates()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadTemplates(),
  addItem() 
})
</script>

<style scoped>
.template-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actions {
  display: flex;
  gap: 10px;
}
.price-header,
.price-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.price-header {
  font-weight: bold;
  color: #606266;
}
</style>
