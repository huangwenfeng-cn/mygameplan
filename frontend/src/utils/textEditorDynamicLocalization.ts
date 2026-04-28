const DYNAMIC_TEXT_MAP: Record<string, string> = {
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
  'No results found': '无结果',
  'Smiley & Emotion': '笑脸与表情',
  Today: '今天',
  Tomorrow: '明天',
}

const TOKEN_TEXT_MAP: Array<[RegExp, string]> = [
  [/\bJan\b/g, '1月'],
  [/\bFeb\b/g, '2月'],
  [/\bMar\b/g, '3月'],
  [/\bApr\b/g, '4月'],
  [/\bMay\b/g, '5月'],
  [/\bJun\b/g, '6月'],
  [/\bJul\b/g, '7月'],
  [/\bAug\b/g, '8月'],
  [/\bSep\b/g, '9月'],
  [/\bOct\b/g, '10月'],
  [/\bNov\b/g, '11月'],
  [/\bDec\b/g, '12月'],
]

let observer: MutationObserver | null = null
let subscriberCount = 0

function localizeText(original: string): string {
  const trimmed = original.trim()
  const mapped = DYNAMIC_TEXT_MAP[trimmed]
  if (mapped) {
    return original.replace(trimmed, mapped)
  }

  let replaced = original
  for (const [regex, value] of TOKEN_TEXT_MAP) {
    replaced = replaced.replace(regex, value)
  }
  return replaced
}

function processTextNode(textNode: Node) {
  const original = textNode.nodeValue
  if (!original) return

  const parentTag = (textNode.parentElement?.tagName || '').toUpperCase()
  if (parentTag === 'SCRIPT' || parentTag === 'STYLE') return

  const localized = localizeText(original)
  if (localized !== original) {
    textNode.nodeValue = localized
  }
}

function replaceMappedTextInTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    processTextNode(root)
    return
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let textNode = walker.nextNode()

  while (textNode) {
    processTextNode(textNode)
    textNode = walker.nextNode()
  }
}

function localizeFromNode(node: Node) {
  if (!(node instanceof Element)) return

  if (node.matches('.tippy-box, [role="dialog"], .vc-container')) {
    replaceMappedTextInTree(node)
  }

  node.querySelectorAll('.tippy-box, [role="dialog"], .vc-container').forEach((box) => {
    replaceMappedTextInTree(box)
  })
}

function runLocalizationPass() {
  document.querySelectorAll('.tippy-box, [role="dialog"], .vc-container').forEach((box) => {
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
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            localizeFromNode(node)
            replaceMappedTextInTree(node)
          } else {
            replaceMappedTextInTree(node)
          }
        })
        replaceMappedTextInTree(mutation.target)
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
