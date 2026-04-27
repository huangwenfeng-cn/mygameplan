import { createEditorButton } from 'frappe-ui'

const BUTTON_LABELS: Record<string, string> = {
  Paragraph: '正文',
  'Heading 1': '一级标题',
  'Heading 2': '二级标题',
  'Heading 3': '三级标题',
  'Heading 4': '四级标题',
  'Heading 5': '五级标题',
  'Heading 6': '六级标题',
  Bold: '粗体',
  Italic: '斜体',
  Underline: '下划线',
  Strikethrough: '删除线',
  'Bullet List': '无序列表',
  'Numbered List': '有序列表',
  'Task List': '任务列表',
  IndentList: '增加缩进',
  DedentList: '减少缩进',
  'Align Left': '左对齐',
  'Align Center': '居中对齐',
  'Align Right': '右对齐',
  FontColor: '字体颜色',
  Blockquote: '引用',
  Code: '代码块',
  'Horizontal Rule': '分隔线',
  Link: '链接',
  Image: '图片',
  Video: '视频',
  Iframe: '嵌入',
  Undo: '撤销',
  Redo: '重做',
  InsertTable: '插入表格',
  AddColumnBefore: '在前方插入列',
  AddColumnAfter: '在后方插入列',
  DeleteColumn: '删除列',
  AddRowBefore: '在上方插入行',
  AddRowAfter: '在下方插入行',
  DeleteRow: '删除行',
  DeleteTable: '删除表格',
  MergeCells: '合并单元格',
  SplitCell: '拆分单元格',
  ToggleHeaderColumn: '切换标题列',
  ToggleHeaderRow: '切换标题行',
  ToggleHeaderCell: '切换标题单元格',
  TableOfContents: '目录',
}

function localizeEditorButton(option: any): any {
  if (Array.isArray(option)) {
    return option.map(localizeEditorButton)
  }
  if (typeof option === 'object' && option !== null) {
    return option
  }

  const button = createEditorButton(option)
  if (!button || typeof button !== 'object') return button

  const label = BUTTON_LABELS[option]
  if (!label) return button

  return {
    ...button,
    label,
  }
}

export function localizeEditorButtons(options: any[]) {
  return options.map(localizeEditorButton)
}
