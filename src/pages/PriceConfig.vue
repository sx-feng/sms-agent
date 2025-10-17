<template>
  <div class="price-config-page">
    <div class="card">
      <h2 class="title">项目价格配置</h2>

      <!-- 表格区域 -->
      <table class="price-table">
        <thead>
          <tr>
            <th>项目ID</th>
            <th>项目名</th>
            <th>成本价</th>
            <th>最高价</th>
            <th>当前价</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in projectList" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.costPrice }}</td>
            <td>{{ item.maxPrice }}</td>
            <td>{{ item.currentPrice }}</td>
            <td>
              <button class="btn-edit" @click="openEditor(item)">修改</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <button class="btn-save" @click="saveAll" :disabled="loading">
          {{ loading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>

    <!-- 弹窗编辑器 -->
    <PriceEditor
      v-model:show="showEditor"
      :record="editingRecord"
      @confirm="onEditConfirm"
    />
  </div>
</template>

<script setup>

import PriceEditor from "@/components/PriceEditor.vue";





</script>

<style scoped>
.price-config-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 40px;
  min-height: 100vh;
  background: #f5f6fa;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  width: 90%;
  max-width: 900px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.title {
  text-align: center;
  font-size: 20px;
  margin-bottom: 16px;
  color: #333;
}

.price-table {
  width: 100%;
  border-collapse: collapse;
}

.price-table th,
.price-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #ddd;
  text-align: center;
  font-size: 14px;
}

.price-table th {
  background: #fafafa;
  font-weight: 600;
}

.btn-edit {
  background: linear-gradient(90deg, #f6c244, #d6a520);
  color: #000;
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}

.btn-edit:hover {
  background: linear-gradient(90deg, #ffd54f, #f9a825);
}

.footer {
  text-align: right;
  margin-top: 20px;
}

.btn-save {
  background: linear-gradient(90deg, #4caf50, #388e3c);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;
}

.btn-save:hover {
  background: linear-gradient(90deg, #66bb6a, #43a047);
}
</style>
