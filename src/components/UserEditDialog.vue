<template>
  <el-dialog
    :title="isEdit ? '编辑下级' : '新增下级'"
    :model-value="props.modelValue"
    @update:modelValue="onUpdate"
    @open="handleOpen"
    width="850px"
    :close-on-click-modal="false"
  >
    <el-form :model="form" label-width="100px" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="是否代理">
            <el-switch
              v-model="form.isAgent"
              active-text="是"
              inactive-text="否"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch v-model="form.status" :active-value="0" :inactive-value="1" active-text="启用" inactive-text="禁用" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider>项目价格配置</el-divider>

      <el-form-item label="快捷应用">
        <el-select
          v-model="selectedTemplateId"
          placeholder="可选择一个价格模板快速应用"
          clearable
          filterable
          @change="applyTemplate"
          style="width: 100%"
        >
          <el-option
            v-for="tpl in templates"
            :key="tpl.id"
            :label="tpl.name"
            :value="tpl.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="价格列表">
        <div class="prices-container">
          <div class="price-header">
            <span class="col-project">项目名称</span>
            <span class="col-line">线路ID</span>
            <span class="col-price">成本价</span>
            <span class="col-price">最高价</span>
            <span class="col-input">下级售价</span>
            <span class="col-input">是否启用</span>
          </div>
          <div class="price-scroll-area">
            <div class="price-row" v-for="p in prices" :key="`${p.projectId}-${p.lineId}`">
              <el-input
                :value="`${p.projectName}`"
                class="col-project"
                disabled
              />
              <el-input
                :value="p.lineId"
                class="col-line"
                disabled
              />
              <el-input
                :value="p.costPrice"
                class="col-price"
                disabled
              />
              <el-input
                :value="p.maxPrice ?? '不限'"
                class="col-price"
                disabled
              />
              <el-input-number
                v-model.number="p.agentPrice"
                :min="p.costPrice"
                :max="p.maxPrice ?? Infinity"
                :step="0.01"
                controls-position="right"
                class="col-input"
              />
              <el-switch
                v-model="p.status"
                active-text="启用"
                inactive-text="禁用"
                class="col-action"
              />
            </div>
             <el-empty v-if="!prices.length && !loading" description="暂无可配置的项目" :image-size="80"></el-empty>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="onUpdate(false)" :disabled="saving">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createAgentUser,
  updateAgentUser,
  getAgentPriceTemplates,
  getAgentProjectPrice,
  getSubUserProjectPricesById,
  getProjectList,
  updateUserProjectPrices, // ✅ 引入 updateUserProjectPrices 方法
} from '@/api/agent'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  user: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'updated'])

const form = ref({})
const prices = ref([])
const saving = ref(false)
const loading = ref(false)
const templates = ref([])
const selectedTemplateId = ref(null)

const isEdit = computed(() => !!(props.user && props.user.id))

async function handleOpen() {
  loading.value = true
  selectedTemplateId.value = null

  // 初始化表单
  if (isEdit.value) {
    form.value = {
      id: props.user.id,
      username: props.user.userName ?? '',
      password: '',
      isAgent: !!props.user.isAgent,
      status: Number(props.user.status ?? 0)
    }
  } else {
    form.value = {
      username: '',
      password: '',
      isAgent: false,
      status: 0
    }
  }

  // 并行加载数据
  await Promise.all([
    loadTemplates(),
    loadAndProcessPrices()
  ])

  loading.value = false
}

// 请用下面的版本替换你原来的 loadAndProcessPrices 函数

async function loadAndProcessPrices() {
  try {
    // 并行获取“我的(代理的)价格”和“所有项目的基础信息”
    const [agentPriceRes, projectListRes] = await Promise.all([
      getAgentProjectPrice(),
      getProjectList({ size: -1 })
    ]);

    if (agentPriceRes.code !== 200 || !Array.isArray(agentPriceRes.data)) {
      throw new Error('加载您的项目价格配置失败');
    }
    const agentBasePrices = agentPriceRes.data;

    // 创建项目元数据映射，用于查找最高价
    const projectMetaMap = new Map();
    if (projectListRes.code === 200 && projectListRes.data?.records) {
      projectListRes.data.records.forEach(proj => {
        const key = `${proj.projectId}_${proj.lineId}`;
        projectMetaMap.set(key, {
          maxPrice: proj.priceMax ? Number(proj.priceMax) : null,
        });
      });
    }

    // ✅ [核心修改点 1] 获取并处理该用户的现有价格配置
    let userPriceMap = new Map();
    if (isEdit.value) {
      const userPriceRes = await getSubUserProjectPricesById(props.user.id);
      if (userPriceRes.code === 200 && Array.isArray(userPriceRes.data)) {
        userPriceRes.data.forEach(p => {
          const key = `${p.projectId}_${p.lineId}`;
          // 将完整的价格对象存入 Map，而不仅仅是价格值
          // 这样我们就能同时获得记录的 `id` 和 `agentPrice`
          userPriceMap.set(key, p);
        });
      } else {
         ElMessage.warning('获取该用户的价格配置失败，将使用默认值');
      }
    }

    // ✅ [核心修改点 2] 组合最终的 prices 列表
    prices.value = agentBasePrices.map(agentProj => {
      const key = `${agentProj.projectId}_${agentProj.lineId}`;
      const meta = projectMetaMap.get(key) || {};
      const userPriceData = userPriceMap.get(key); // 获取完整的用户价格对象
      const costPriceForSubUser = Number(agentProj.agentPrice);

      return {
        // `id`: 用户价格记录的主键。如果是新增用户或该项目未定价，则为 null
        id: userPriceData ? userPriceData.id : null,
        // `projectTableId`: 项目线路在主表中的ID，用于新建关联关系
        projectTableId: agentProj.projectTableId,
        
        // 其他基础信息
        projectName: agentProj.projectName,
        projectId: agentProj.projectId,
        lineId: agentProj.lineId,
        costPrice: costPriceForSubUser,
        maxPrice: meta.maxPrice ?? null,
        // `agentPrice`: 优先使用用户已有的价格，否则默认为代理的成本价
        agentPrice: userPriceData ? Number(userPriceData.agentPrice) : costPriceForSubUser,
        status: userPriceData ? userPriceData.status : true, // 默认启用
      };
    });

  } catch (error) {
    console.error("加载价格数据出错:", error);
    ElMessage.error(error.message || '网络异常，加载价格数据失败');
    prices.value = [];
  }
}

async function loadTemplates() {
  try {
    const res = await getAgentPriceTemplates()
    if (res.code === 200) {
      templates.value = res.data || []
    }
  } catch (e) {
    console.error('加载模板失败', e)
  }
}

function applyTemplate(templateId) {
  if (!templateId) return
  const tpl = templates.value.find(t => t.id === templateId)
  if (!tpl) return

  const templatePriceMap = new Map(
    (tpl.items || []).map(item => [`${item.projectId}_${item.lineId}`, item.price])
  )

  prices.value.forEach(p => {
    const key = `${p.projectId}_${p.lineId}`
    if (templatePriceMap.has(key)) {
      const templatePrice = templatePriceMap.get(key)
      if (templatePrice >= p.costPrice && (p.maxPrice === null || templatePrice <= p.maxPrice)) {
        p.agentPrice = templatePrice
      }
    }
  })
  ElMessage.success(`已应用模板「${tpl.name}」的售价`)
}

// ==========================================================
// ✅ [核心修改] 重构 save 函数
// ==========================================================
// 请用下面的版本替换你原来的 save 函数

async function save() {
  // 1. 价格合法性校验 (逻辑不变)
  for (const p of prices.value) {
    if (p.agentPrice < p.costPrice) {
      ElMessage.error(`项目"${p.projectName}"的售价不能低于成本价 ${p.costPrice}`);
      return;
    }
    if (p.maxPrice !== null && p.agentPrice > p.maxPrice) {
       ElMessage.error(`项目"${p.projectName}"的售价不能高于最高价 ${p.maxPrice}`);
      return;
    }
  }

  saving.value = true;
  try {
    // 2. 根据是“新增”还是“编辑”执行不同逻辑
    if (isEdit.value) {
      // --- 编辑逻辑：分两步调用API ---

      // 2.1 准备并调用【更新用户基本信息】接口
      const userPayload = { ...form.value };
      if (!userPayload.password) {
        delete userPayload.password;
      }
      const userUpdateRes = await updateAgentUser(userPayload);
      if (userUpdateRes.code !== 200) {
        throw new Error(userUpdateRes.message || '更新用户信息失败');
      }

      // 2.2 ✅ [核心修改点 3] 准备并调用【更新价格配置】接口
      //     为每条价格记录都附上它自己的主键 `id`
      const pricePayload = {
        userId: props.user.id,
        projectPrices: prices.value.map(p => ({
          // `id`: 用户价格记录的主键，后端据此更新数据
          id: p.id,
          // `price`: 用户要更新的价格
          price: Number(p.agentPrice),
          // `projectId` 和 `lineId` 作为业务标识
          projectId: p.projectId,
          lineId: p.lineId,
          status: p.status
        }))
      };
      const priceUpdateRes = await updateUserProjectPrices(pricePayload);
      if (priceUpdateRes.code !== 200) {
        throw new Error(priceUpdateRes.message || '用户信息已更新，但价格配置更新失败');
      }

    } else {
      // --- 新增逻辑：一次性提交 ---
      // ✅ [核心修改点 4] 使用 `projectTableId` 作为 `userProjectLineId`
      const projectPrices = prices.value.map(p => ({
        // `userProjectLineId`：在新建时，告诉后端要关联哪个主项目线路
        userProjectLineId: p.projectTableId,
        price: Number(p.agentPrice),
        projectId: p.projectId,
        lineId: p.lineId,
        status: p.status 
      }));
      
      const payload = { ...form.value, projectPrices };
      if (!payload.password) {
        delete payload.password;
      }
      
      const createRes = await createAgentUser(payload);
      if (createRes.code !== 200) {
        throw new Error(createRes.message || '创建用户失败');
      }
    }

    // 3. 全部成功后的操作 (逻辑不变)
    ElMessage.success('保存成功');
    emit('update:modelValue', false);
    emit('updated');

  } catch(e) {
    console.error("保存操作失败：", e);
    ElMessage.error(e.message || '网络异常，请稍后重试');
  } finally {
    saving.value = false;
  }
}


function onUpdate(val) {
  emit('update:modelValue', val)
}

onMounted(() => {
  // 注意：在 Dialog 组件中，推荐使用 @open 事件代替 onMounted
  // 因为 onMounted 只执行一次，而 @open 每次打开都会执行，更符合弹窗逻辑
  // 你代码中已经正确使用了 @open，所以这里的 onMounted 可以移除，避免重复调用
  handleOpen();
});

</script>

<style scoped>
.prices-container {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.price-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #dcdfe6;
}
.price-scroll-area {
    max-height: 300px;
    overflow-y: auto;
}

.price-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
}
.price-row:not(:last-child) {
    border-bottom: 1px solid #ebeef5;
}

.col-input {
  width: 100%;
}
</style>