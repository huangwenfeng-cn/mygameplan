const DYNAMIC_EDITOR_TEXT_MAP: Record<string, string> = {
  'Heading 2': '二级标题',
  'Heading 3': '三级标题',
  'Bullet List': '无序列表',
  'Numbered List': '有序列表',
  'Task List': '任务列表',
  'Code Block': '代码块',
  Blockquote: '引用',
  Image: '图片',
  Video: '视频',
  Embed: '嵌入',
  Link: '链接',
  'Horizontal Rule': '分隔线',
  Table: '表格',
  'Table of Contents': '目录',
  'No results': '无结果',
}

let observer: MutationObserver | null = null
let subscriberCount = 0

function replaceMappedTextInTree(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let textNode = walker.nextNode()

  while (textNode) {
    const original = textNode.nodeValue
    if (original) {
      const trimmed = original.trim()
      const localized = DYNAMIC_EDITOR_TEXT_MAP[trimmed]
      if (localized) {
        textNode.nodeValue = original.replace(trimmed, localized)
      }
    }
    textNode = walker.nextNode()
  }
}

function localizeTippyBoxesFromNode(node: Node) {
  if (!(node instanceof Element)) return

  if (node.matches('.tippy-box')) {
    replaceMappedTextInTree(node)
  }

  node.querySelectorAll('.tippy-box').forEach((box) => {
    replaceMappedTextInTree(box)
  })
}

function runLocalizationPass() {
  document.querySelectorAll('.tippy-box').forEach((box) => {
    replaceMappedTextInTree(box)
  })
}

export function startTextEditorDynamicLocalization() {
  if (typeof document === 'undefined') return () => {}

  subscriberCount += 1

  if (!observer) {
    runLocalizationPass()

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(localizeTippyBoxesFromNode)
        localizeTippyBoxesFromNode(mutation.target)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }

  return () => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0 && observer) {
      observer.disconnect()
      observer = null
    }
  }
}
