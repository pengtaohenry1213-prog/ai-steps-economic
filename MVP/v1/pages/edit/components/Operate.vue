<script lang="ts" setup>
import { useAnimationData } from '../hooks/index';

const emit = defineEmits<{
  (e: 'calculate'): void;
  (e: 'compare', file: File): void;
  (e: 'export'): void;
  (e: 'highlight'): void;
  (e: 'import', file: File): void;
  (e: 'kahnCalculate'): void;
  (e: 'save'): void;
  (e: 'showProduct'): void;
  (e: 'showUnit'): void;
  (e: 'sort'): void;
  (e: 'submit'): void;
}>();
const { highlight } = useAnimationData();
const isDev = (import.meta as any).env.DEV;
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    emit('import', file);
    // 重置 input 的值，允许选择相同文件再次触发 change 事件
    target.value = '';
  }
};
</script>

<template>
  <div class="operate_area">
    <el-space direction="vertical">
      <el-tooltip content="保存" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box save_box"
          size="small"
          type="primary"
          @click="emit('save')"
        />
      </el-tooltip>

      <el-tooltip content="编辑产品" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box edit_box"
          size="small"
          type="primary"
          @click="emit('showProduct')"
        />
      </el-tooltip>

      <el-tooltip content="编辑单位" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box edit_box"
          size="small"
          type="primary"
          @click="emit('showUnit')"
        />
      </el-tooltip>

      <el-tooltip content="导入" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box import_box file-btn"
          size="small"
          type="primary"
        >
          <input
            accept=".xlsx,.xls,.xlsm"
            type="file"
            @change="handleFileChange"
          />
        </el-button>
      </el-tooltip>

      <el-tooltip content="导出" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box export_box"
          size="small"
          type="primary"
          @click="emit('export')"
        />
      </el-tooltip>

      <el-tooltip content="提交" effect="dark" placement="left">
        <el-button
          circle
          class="operate_box submit_box"
          size="small"
          type="primary"
          @click="emit('submit')"
        />
      </el-tooltip>

      <el-tooltip
        :content="highlight.enabled ? '关闭高亮' : '开启高亮'"
        effect="dark"
        placement="left"
      >
        <el-button
          :type="highlight.enabled ? 'primary' : 'default'"
          circle
          class="operate_box revoke_box"
          size="small"
          @click="highlight.enabled = !highlight.enabled"
        />
      </el-tooltip>

      <template v-if="isDev">
        <el-tooltip content="计算" effect="dark" placement="left">
          <el-button
            :disabled="false"
            circle
            class="operate_box compute_box"
            size="small"
            type="primary"
            @click="emit('calculate')"
          />
        </el-tooltip>
        <el-tooltip content="计算-test" effect="dark" placement="left">
          <el-button
            :disabled="false"
            circle
            class="operate_box compute_box"
            size="small"
            type="primary"
            @click="emit('kahnCalculate')"
          />
        </el-tooltip>
        <el-tooltip content="排序数据" effect="dark" placement="left">
          <el-button
            :disabled="false"
            circle
            class="operate_box compute_box"
            size="small"
            type="primary"
            @click="emit('sort')"
          />
        </el-tooltip>
        <el-tooltip content="比对" effect="dark" hoverd placement="left">
          <el-button
            circle
            class="operate_box compute_box file-btn"
            size="small"
            type="primary"
          >
            <input
              accept=".xlsx,.xls,.xlsm"
              type="file"
              @change="(e: any) => emit('compare', e.target.files[0])"
            />
          </el-button>
        </el-tooltip>
      </template>
    </el-space>
  </div>
</template>

<style scoped lang="less">
.operate_area {
  position: fixed;
  right: 10px;
  bottom: 20px;
  z-index: 999;

  .operate_box {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-size: contain;
    border: none;
  }

  .edit_box {
    background-image: url('../../../../assets/icons/edit.png');

    &:hover {
      background-image: url('../../../../assets/icons/edit-hover.png');
    }
  }

  .revoke_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Frevoke.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Frevoke_light.png');
    }
  }

  .import_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fimport.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fimport_light.png');
    }
  }

  .export_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fexport.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fexport_light.png');
    }
  }

  .compute_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fcompute.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fcompute_light.png');
    }
  }

  .save_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsave.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsave_light.png');
    }
  }

  .submit_box {
    background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsubmit.png');

    &:hover {
      background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsubmit_light.png');
    }
  }

  .file-btn {
    overflow: hidden;

    input {
      color: transparent;
      cursor: pointer;
    }
  }
}
</style>
